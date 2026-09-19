import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchLabel } from "@/lib/matching";
import { sendVaMatchEmail } from "@/lib/match-email";

const HIRING_LEAD_SOURCES = [
  "service_match_request",
  "industry_match_request",
  "blog_match_request",
  "public_role_brief",
  "content_role_brief",
  "talent_introduction_request"
] as const;

async function releaseInvitedShortlists(admin: ReturnType<typeof createAdminClient>, userId: string, jobIds: string[]) {
  if (!jobIds.length) return;

  const [{ data: inviteRows }, { data: jobs }] = await Promise.all([
    admin.from("recruiter_activity")
      .select("subject_id,metadata,created_at")
      .eq("subject_type", "job")
      .eq("action", "client_review_invited")
      .in("subject_id", jobIds)
      .order("created_at", { ascending: false }),
    admin.from("jobs").select("id,title").in("id", jobIds)
  ]);

  const latestInviteByJob = new Map<string, any>();
  for (const row of inviteRows || []) {
    if (!latestInviteByJob.has(row.subject_id)) latestInviteByJob.set(row.subject_id, row);
  }
  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]));
  const releasedAt = new Date().toISOString();

  for (const jobId of jobIds) {
    const invite = latestInviteByJob.get(jobId);
    const invitedIds = Array.isArray(invite?.metadata?.va_ids)
      ? [...new Set(invite.metadata.va_ids.map(String).filter(Boolean))].slice(0, 50)
      : [];
    if (!invitedIds.length) continue;

    const { data: proposed } = await admin.from("job_shortlist_candidates")
      .select("va_id,match_score")
      .eq("job_id", jobId)
      .eq("shortlist_status", "proposed")
      .in("va_id", invitedIds);
    if (!proposed?.length) continue;

    const vaIds = proposed.map((row: any) => row.va_id);
    const { error } = await admin.from("job_shortlist_candidates")
      .update({ shortlist_status: "released", released_at: releasedAt })
      .eq("job_id", jobId)
      .eq("shortlist_status", "proposed")
      .in("va_id", vaIds);
    if (error) continue;

    const job = jobMap.get(jobId) as any;
    await admin.from("notifications").insert({
      user_id: userId,
      title: "Your curated shortlist is ready",
      body: `${vaIds.length} recruiter-reviewed VA${vaIds.length === 1 ? " is" : "s are"} ready for your role${job?.title ? `, ${job.title}` : ""}.`,
      href: `/workspace/client/jobs/${jobId}`
    });
    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: jobId,
      action: "shortlist_released_after_client_claim",
      description: `${vaIds.length} invited VA${vaIds.length === 1 ? "" : "s"} released automatically after the client linked their account`,
      actor_id: null,
      metadata: { va_ids: vaIds, client_id: userId }
    });

    const strongMatches = proposed.filter((row: any) => Number(row.match_score || 0) >= 60);
    if (strongMatches.length) {
      await admin.from("notifications").insert(strongMatches.map((row: any) => ({
        user_id: row.va_id,
        title: "A client role may be a good fit",
        body: `Your recruiter shortlisted your profile as a ${matchLabel(Number(row.match_score || 0))} for client review. Keep your availability and profile current while the client reviews the shortlist.`,
        href: "/workspace/va/profile"
      })));
      await Promise.allSettled(strongMatches.map(async (row: any) => {
        const { data: authUser } = await admin.auth.admin.getUserById(row.va_id);
        await sendVaMatchEmail({
          to: authUser.user?.email,
          fitLabel: matchLabel(Number(row.match_score || 0)),
          appUrl: process.env.NEXT_PUBLIC_APP_URL
        });
      }));
    }
  }
}

export async function claimClientHiringRequests(args: { userId: string; email: string; leadId?: string }) {
  const admin = createAdminClient();
  const claimable = new Map<string, { id: string; job_id: string | null; session_id: string | null; page_url: string | null; service: string | null }>();

  if (args.leadId) {
    const { data: lead } = await admin.from("lead_intake").select("id,email,job_id,source_page,client_id,session_id,page_url,service").eq("id", args.leadId).maybeSingle();
    if (
      lead &&
      !lead.client_id &&
      String(lead.email || "").toLowerCase() === args.email.toLowerCase() &&
      HIRING_LEAD_SOURCES.includes(lead.source_page as (typeof HIRING_LEAD_SOURCES)[number])
    ) {
      claimable.set(lead.id, { id: lead.id, job_id: lead.job_id || null, session_id: lead.session_id || null, page_url: lead.page_url || null, service: lead.service || null });
    }
  }

  const { data: matchingLeads } = await admin
    .from("lead_intake")
    .select("id,job_id,session_id,page_url,service")
    .ilike("email", args.email)
    .is("client_id", null)
    .in("source_page", [...HIRING_LEAD_SOURCES])
    .limit(50);

  for (const lead of matchingLeads || []) {
    claimable.set(lead.id, { id: lead.id, job_id: lead.job_id || null, session_id: lead.session_id || null, page_url: lead.page_url || null, service: lead.service || null });
  }

  const leadIds = Array.from(claimable.keys());
  const jobIds = Array.from(new Set(Array.from(claimable.values()).map((lead) => lead.job_id).filter(Boolean))) as string[];

  if (leadIds.length) {
    await admin.from("lead_intake").update({ client_id: args.userId }).in("id", leadIds).is("client_id", null);
  }
  if (jobIds.length) {
    await admin.from("jobs").update({ client_id: args.userId }).in("id", jobIds).is("client_id", null);
    await releaseInvitedShortlists(admin, args.userId, jobIds);
  }

  if (claimable.size) {
    const events = Array.from(claimable.values()).map((lead) => {
      let path = "/hire";
      try {
        if (lead.page_url) path = new URL(lead.page_url).pathname;
      } catch {
        // Keep the safe fallback path for malformed imported URLs.
      }
      return {
        event_name: "qualified_lead",
        path,
        session_id: lead.session_id,
        user_id: args.userId,
        metadata: { lead_id: lead.id, job_id: lead.job_id, service: lead.service, qualification: "client_claimed" }
      };
    });
    await admin.from("analytics_events").insert(events);
  }

  return args.leadId ? claimable.get(args.leadId)?.job_id || null : null;
}
