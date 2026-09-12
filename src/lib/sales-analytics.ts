import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isOpenLeadStage } from "@/lib/lead-crm";

export type SalesRangeDays = 30 | 90 | 365;

export function parseSalesRange(value?: string | null): SalesRangeDays {
  const parsed = Number(value);
  return parsed === 90 || parsed === 365 ? parsed : 30;
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 10) / 10;
}

function sourceLabel(lead: any) {
  const direct = String(lead.source_page || "").trim();
  if (direct) return direct;
  try {
    const path = lead.page_url ? new URL(lead.page_url).pathname : "";
    if (path) return path;
  } catch {}
  return "Direct / unknown";
}

function isQualifiedStage(stage?: string | null) {
  return ["qualified", "shortlist_sent", "won"].includes(String(stage || ""));
}

export async function getSalesAnalytics(args: {
  days: SalesRangeDays;
  ownerId?: string | null;
}) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - args.days * 86400000).toISOString();
  const acquisitionQuery = admin.rpc("recruiter_conversion_summary", { p_since: since });

  let leadQuery = admin
    .from("lead_intake")
    .select("id,name,company,source_page,page_url,crm_stage,created_at,first_contact_at,discovery_scheduled_at,discovery_completed_at,owner_id,estimated_value_usd,won_at,lost_at,lost_reason")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (args.ownerId) leadQuery = leadQuery.eq("owner_id", args.ownerId);

  const [{ data: acquisition, error: acquisitionError }, { data: leads, error: leadsError }] = await Promise.all([
    acquisitionQuery,
    leadQuery
  ]);
  const leadRows = leads || [];
  const leadIds = leadRows.map((lead: any) => lead.id);
  const ownerIds = [...new Set(leadRows.map((lead: any) => lead.owner_id).filter(Boolean))];

  const [{ data: proposals, error: proposalsError }, { data: owners }, { data: jobs, error: jobsError }] = await Promise.all([
    leadIds.length
      ? admin
          .from("lead_proposals")
          .select("id,lead_id,status,sent_at,viewed_at,accepted_at,declined_at,changes_requested_at,created_at")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false })
          .limit(5000)
      : Promise.resolve({ data: [], error: null } as any),
    ownerIds.length
      ? admin.from("profiles").select("id,full_name,role").in("id", ownerIds)
      : Promise.resolve({ data: [] } as any),
    leadIds.length
      ? admin.from("jobs").select("id,lead_id,status,created_at").in("lead_id", leadIds).limit(5000)
      : Promise.resolve({ data: [], error: null } as any)
  ]);

  const jobRows = jobs || [];
  const jobIds = jobRows.map((job: any) => job.id);
  const { data: workrooms, error: workroomsError } = jobIds.length
    ? await admin.from("workrooms").select("id,job_id,created_at").in("job_id", jobIds).limit(5000)
    : { data: [], error: null } as any;

  const ownerMap = new Map((owners || []).map((owner: any) => [owner.id, owner.full_name || (owner.role === "admin" ? "Admin" : "Recruiter")]));
  const proposalRows = proposals || [];
  const sentLeadIds = new Set<string>();
  const viewedLeadIds = new Set<string>();
  const acceptedLeadIds = new Set<string>();
  const changesLeadIds = new Set<string>();
  for (const proposal of proposalRows) {
    if (proposal.sent_at || proposal.status !== "draft") sentLeadIds.add(proposal.lead_id);
    if (proposal.viewed_at) viewedLeadIds.add(proposal.lead_id);
    if (proposal.accepted_at || proposal.status === "accepted") acceptedLeadIds.add(proposal.lead_id);
    if (proposal.changes_requested_at || proposal.status === "changes_requested") changesLeadIds.add(proposal.lead_id);
  }

  const jobToLead = new Map(jobRows.map((job: any) => [job.id, job.lead_id]));
  const hiredLeadIds = new Set<string>();
  for (const workroom of workrooms || []) {
    const leadId = jobToLead.get(workroom.job_id);
    if (leadId) hiredLeadIds.add(String(leadId));
  }

  const contacted = leadRows.filter((lead: any) => lead.first_contact_at).length;
  const discoveryBooked = leadRows.filter((lead: any) => lead.discovery_scheduled_at).length;
  const discoveryCompleted = leadRows.filter((lead: any) => lead.discovery_completed_at).length;
  const qualified = leadRows.filter((lead: any) => isQualifiedStage(lead.crm_stage) || sentLeadIds.has(lead.id)).length;
  const won = leadRows.filter((lead: any) => lead.crm_stage === "won" || acceptedLeadIds.has(lead.id)).length;
  const lost = leadRows.filter((lead: any) => lead.crm_stage === "lost").length;
  const openPipelineValue = leadRows
    .filter((lead: any) => isOpenLeadStage(lead.crm_stage))
    .reduce((sum: number, lead: any) => sum + Number(lead.estimated_value_usd || 0), 0);
  const wonValue = leadRows
    .filter((lead: any) => lead.crm_stage === "won" || acceptedLeadIds.has(lead.id))
    .reduce((sum: number, lead: any) => sum + Number(lead.estimated_value_usd || 0), 0);

  const responseMinutes = leadRows
    .filter((lead: any) => lead.first_contact_at)
    .map((lead: any) => Math.max(0, (new Date(lead.first_contact_at).getTime() - new Date(lead.created_at).getTime()) / 60000))
    .filter(Number.isFinite);
  const closeDays = leadRows
    .filter((lead: any) => lead.won_at)
    .map((lead: any) => Math.max(0, (new Date(lead.won_at).getTime() - new Date(lead.created_at).getTime()) / 86400000))
    .filter(Number.isFinite);
  const withinThirty = responseMinutes.filter((minutes) => minutes <= 30).length;

  const acquisitionMetrics = (acquisition || {}) as {
    homepage_visits?: number;
    form_starts?: number;
    tracked_sessions?: number;
  };
  const homepageVisits = Number(acquisitionMetrics.homepage_visits || 0);
  const formStarts = Number(acquisitionMetrics.form_starts || 0);
  const trackedSessions = Number(acquisitionMetrics.tracked_sessions || 0);

  const funnel = [
    { key: "homepage", label: "Homepage visits", count: homepageVisits },
    { key: "form_start", label: "Form starts", count: formStarts },
    { key: "lead", label: "Form submissions", count: leadRows.length },
    { key: "discovery", label: "Discovery booked", count: discoveryBooked },
    { key: "qualified", label: "Qualified", count: qualified },
    { key: "proposal", label: "Proposal sent", count: sentLeadIds.size },
    { key: "won", label: "Clients won", count: won }
  ].map((stage) => ({ ...stage, rate: pct(stage.count, homepageVisits) }));

  const sourceMap = new Map<string, any>();
  for (const lead of leadRows) {
    const source = sourceLabel(lead);
    const row = sourceMap.get(source) || { source, leads: 0, contacted: 0, proposals: 0, wins: 0, openValue: 0 };
    row.leads += 1;
    if (lead.first_contact_at) row.contacted += 1;
    if (sentLeadIds.has(lead.id)) row.proposals += 1;
    if (lead.crm_stage === "won" || acceptedLeadIds.has(lead.id)) row.wins += 1;
    if (isOpenLeadStage(lead.crm_stage)) row.openValue += Number(lead.estimated_value_usd || 0);
    sourceMap.set(source, row);
  }
  const sources = [...sourceMap.values()]
    .map((row) => ({ ...row, winRate: pct(row.wins, row.leads) }))
    .sort((a, b) => b.wins - a.wins || b.proposals - a.proposals || b.leads - a.leads)
    .slice(0, 20);

  const ownerBuckets = new Map<string, any>();
  for (const lead of leadRows) {
    const ownerKey = lead.owner_id || "unassigned";
    const row = ownerBuckets.get(ownerKey) || {
      ownerId: ownerKey,
      owner: lead.owner_id ? ownerMap.get(lead.owner_id) || "Assigned recruiter" : "Unassigned",
      leads: 0,
      contacted: 0,
      proposals: 0,
      wins: 0,
      openValue: 0,
      responseMinutes: [] as number[]
    };
    row.leads += 1;
    if (lead.first_contact_at) {
      row.contacted += 1;
      const minutes = Math.max(0, (new Date(lead.first_contact_at).getTime() - new Date(lead.created_at).getTime()) / 60000);
      if (Number.isFinite(minutes)) row.responseMinutes.push(minutes);
    }
    if (sentLeadIds.has(lead.id)) row.proposals += 1;
    if (lead.crm_stage === "won" || acceptedLeadIds.has(lead.id)) row.wins += 1;
    if (isOpenLeadStage(lead.crm_stage)) row.openValue += Number(lead.estimated_value_usd || 0);
    ownerBuckets.set(ownerKey, row);
  }
  const ownersSummary = [...ownerBuckets.values()]
    .map((row) => ({
      ownerId: row.ownerId,
      owner: row.owner,
      leads: row.leads,
      contacted: row.contacted,
      proposals: row.proposals,
      wins: row.wins,
      winRate: pct(row.wins, row.leads),
      openValue: row.openValue,
      medianResponseMinutes: median(row.responseMinutes)
    }))
    .sort((a, b) => b.wins - a.wins || b.leads - a.leads);

  const lossMap = new Map<string, number>();
  for (const lead of leadRows) {
    if (lead.crm_stage !== "lost") continue;
    const reason = String(lead.lost_reason || "No reason recorded").trim() || "No reason recorded";
    lossMap.set(reason, (lossMap.get(reason) || 0) + 1);
  }
  const lossReasons = [...lossMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const legacyQualifiedWithoutTimeline = leadRows.filter((lead: any) =>
    isQualifiedStage(lead.crm_stage) &&
    !lead.first_contact_at &&
    !lead.discovery_scheduled_at &&
    !sentLeadIds.has(lead.id)
  ).length;
  const missingSource = leadRows.filter((lead: any) => sourceLabel(lead) === "Direct / unknown").length;
  const wonWithoutValue = leadRows.filter((lead: any) =>
    (lead.crm_stage === "won" || acceptedLeadIds.has(lead.id)) &&
    !Number(lead.estimated_value_usd || 0)
  ).length;

  return {
    days: args.days,
    since,
    scopeOwnerId: args.ownerId || null,
    errors: {
      acquisition: acquisitionError?.message || null,
      leads: leadsError?.message || null,
      proposals: proposalsError?.message || null,
      jobs: jobsError?.message || null,
      workrooms: workroomsError?.message || null
    },
    totals: {
      homepageVisits,
      formStarts,
      trackedSessions,
      leads: leadRows.length,
      contacted,
      discoveryBooked,
      discoveryCompleted,
      qualified,
      proposalsSent: sentLeadIds.size,
      proposalsViewed: viewedLeadIds.size,
      proposalChanges: changesLeadIds.size,
      won,
      lost,
      hires: hiredLeadIds.size,
      openPipelineValue,
      wonValue,
      medianFirstResponseMinutes: median(responseMinutes),
      firstResponseWithinThirtyRate: pct(withinThirty, responseMinutes.length),
      medianDaysToWin: median(closeDays),
      leadToWinRate: pct(won, leadRows.length),
      proposalAcceptanceRate: pct(won, sentLeadIds.size),
      proposalViewRate: pct(viewedLeadIds.size, sentLeadIds.size)
    },
    funnel,
    sources,
    owners: ownersSummary,
    lossReasons,
    dataQuality: {
      legacyQualifiedWithoutTimeline,
      missingSource,
      wonWithoutValue
    }
  };
}
