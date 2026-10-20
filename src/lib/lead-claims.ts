import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseInvitedShortlistWhenReady } from "@/lib/client-shortlist-release";

const HIRING_LEAD_SOURCES = [
  "service_match_request",
  "industry_match_request",
  "blog_match_request",
  "public_role_brief",
  "content_role_brief",
  "talent_introduction_request"
] as const;

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

  // A lead can be claimed only by an account with the same verified email.
  // Check write errors and actual linked job IDs before promising access.
  let linkedJobIds: string[] = [];
  if (jobIds.length) {
    const { data: linkedJobs, error: jobLinkError } = await admin
      .from("jobs")
      .update({ client_id: args.userId })
      .in("id", jobIds)
      .is("client_id", null)
      .select("id");
    if (jobLinkError) throw jobLinkError;
    linkedJobIds = (linkedJobs || []).map((job) => String(job.id));
  }
  if (leadIds.length) {
    const { error: leadLinkError } = await admin
      .from("lead_intake")
      .update({ client_id: args.userId })
      .in("id", leadIds)
      .is("client_id", null);
    if (leadLinkError) throw leadLinkError;
  }
  // Claiming an account never bypasses publication, commercial approval or
  // paid/comped candidate access. Pending invites release only when ready.
  for (const jobId of linkedJobIds) {
    try {
      await releaseInvitedShortlistWhenReady(admin, args.userId, jobId);
    } catch (error) {
      console.error("[client-claim] shortlist release deferred", {
        jobId, error: error instanceof Error ? error.message : String(error),
      });
    }
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

  const claimedJobId = args.leadId ? claimable.get(args.leadId)?.job_id : null;
  return claimedJobId && linkedJobIds.includes(claimedJobId) ? claimedJobId : null;
}
