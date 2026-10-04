import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isOpenLeadStage } from "@/lib/lead-crm";
import { inferLegacyLossReasonCode, isLeadLossReasonCode, isRecoverableLeadLoss, leadLossReasonLabel } from "@/lib/loss-reasons";

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
  return ["qualified", "terms_sent", "shortlist_sent", "won"].includes(String(stage || ""));
}

function buildLeadTimeline(leads: any[], days: SalesRangeDays, sinceIso: string) {
  const bucketDays = days === 30 ? 5 : days === 90 ? 10 : 30;
  const bucketMs = bucketDays * 86400000;
  const start = new Date(sinceIso).getTime();
  const bucketCount = Math.ceil(days / bucketDays);
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: days === 365 ? undefined : "numeric", timeZone: "UTC" });
  const timeline = Array.from({ length: bucketCount }, (_, index) => ({
    label: formatter.format(new Date(start + index * bucketMs)),
    leads: 0,
    wins: 0
  }));

  for (const lead of leads) {
    const created = new Date(lead.created_at).getTime();
    if (Number.isFinite(created) && created >= start) {
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((created - start) / bucketMs)));
      timeline[index].leads += 1;
    }
    const wonAt = lead.won_at ? new Date(lead.won_at).getTime() : 0;
    if (wonAt && wonAt >= start) {
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((wonAt - start) / bucketMs)));
      timeline[index].wins += 1;
    }
  }

  return timeline;
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
    .select("id,name,company,source_page,page_url,crm_stage,created_at,first_contact_at,discovery_scheduled_at,discovery_completed_at,discovery_cancelled_at,discovery_outcome,owner_id,estimated_value_usd,won_at,lost_at,lost_reason,lost_reason_code,lost_competitor,win_back_at")
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
  const draftLeadIds = new Set<string>();
  const changesLeadIds = new Set<string>();
  for (const proposal of proposalRows) {
    if (proposal.sent_at || proposal.status !== "draft") sentLeadIds.add(proposal.lead_id);
    if (proposal.status === "draft" && !proposal.sent_at) draftLeadIds.add(proposal.lead_id);
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
  const discoveryReached = leadRows.filter((lead: any) => lead.discovery_scheduled_at || lead.discovery_completed_at || lead.discovery_cancelled_at).length;
  const discoveryResolved = leadRows.filter((lead: any) => lead.discovery_completed_at || lead.discovery_cancelled_at).length;
  const discoveryPastDue = leadRows.filter((lead: any) => {
    if (!lead.discovery_scheduled_at || lead.discovery_completed_at || lead.discovery_cancelled_at) return false;
    const scheduled = new Date(lead.discovery_scheduled_at).getTime();
    return Number.isFinite(scheduled) && scheduled < Date.now();
  }).length;
  const discoveryQualified = leadRows.filter((lead: any) => lead.discovery_completed_at && lead.discovery_outcome === "qualified").length;
  const qualifiedWithoutProposal = leadRows.filter((lead: any) =>
    (lead.discovery_outcome === "qualified" || lead.crm_stage === "qualified") &&
    !sentLeadIds.has(lead.id) &&
    !draftLeadIds.has(lead.id)
  ).length;
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

  const lostRows = leadRows.filter((lead: any) => lead.crm_stage === "lost");
  const lostValue = lostRows.reduce((sum: number, lead: any) => sum + Number(lead.estimated_value_usd || 0), 0);
  const lossMap = new Map<string, { code: string; label: string; count: number; value: number; recoverable: boolean }>();
  const competitorMap = new Map<string, number>();
  let recoverableLost = 0;
  let winBackScheduled = 0;
  let winBackDue = 0;
  let preProposalLost = 0;
  let postProposalLost = 0;
  const nowMs = Date.now();

  for (const lead of lostRows) {
    const code = isLeadLossReasonCode(lead.lost_reason_code)
      ? lead.lost_reason_code
      : inferLegacyLossReasonCode(lead.lost_reason) || "other";
    const recoverable = isRecoverableLeadLoss(code);
    const current = lossMap.get(code) || {
      code,
      label: leadLossReasonLabel(code),
      count: 0,
      value: 0,
      recoverable,
    };
    current.count += 1;
    current.value += Number(lead.estimated_value_usd || 0);
    lossMap.set(code, current);

    if (recoverable) recoverableLost += 1;
    if (lead.win_back_at) {
      winBackScheduled += 1;
      const due = new Date(lead.win_back_at).getTime();
      if (Number.isFinite(due) && due <= nowMs) winBackDue += 1;
    }
    if (sentLeadIds.has(lead.id)) postProposalLost += 1;
    else preProposalLost += 1;

    const competitor = String(lead.lost_competitor || "").trim();
    if (competitor) competitorMap.set(competitor, (competitorMap.get(competitor) || 0) + 1);
  }

  const lossReasons = [...lossMap.values()]
    .map((row) => ({ ...row, share: pct(row.count, lostRows.length) }))
    .sort((a, b) => b.count - a.count || b.value - a.value)
    .slice(0, 14);
  const competitors = [...competitorMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);
  const timeline = buildLeadTimeline(leadRows, args.days, since);

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
      proposalDrafts: draftLeadIds.size,
      proposalsViewed: viewedLeadIds.size,
      proposalChanges: changesLeadIds.size,
      proposalsAccepted: acceptedLeadIds.size,
      discoveryReached,
      discoveryResolved,
      discoveryPastDue,
      discoveryQualified,
      qualifiedWithoutProposal,
      discoveryOutcomeRate: pct(discoveryResolved, discoveryReached),
      won,
      lost,
      lostValue,
      recoverableLost,
      winBackScheduled,
      winBackDue,
      preProposalLost,
      postProposalLost,
      hires: hiredLeadIds.size,
      openPipelineValue,
      wonValue,
      medianFirstResponseMinutes: median(responseMinutes),
      firstResponseWithinThirtyRate: pct(withinThirty, responseMinutes.length),
      medianDaysToWin: median(closeDays),
      leadToWinRate: pct(won, leadRows.length),
      proposalAcceptanceRate: pct(acceptedLeadIds.size, sentLeadIds.size),
      proposalViewRate: pct(viewedLeadIds.size, sentLeadIds.size)
    },
    verifiedFunnel: [
      { key: "discovery_completed", label: "Discovery completed", count: discoveryCompleted },
      { key: "proposal_sent", label: "Proposal sent", count: sentLeadIds.size },
      { key: "proposal_accepted", label: "Proposal accepted", count: acceptedLeadIds.size },
      { key: "hire", label: "Hire", count: hiredLeadIds.size }
    ],
    funnel,
    timeline,
    sources,
    owners: ownersSummary,
    lossReasons,
    competitors,
    dataQuality: {
      legacyQualifiedWithoutTimeline,
      missingSource,
      wonWithoutValue
    }
  };
}
