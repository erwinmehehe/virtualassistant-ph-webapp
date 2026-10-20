import "server-only";

import { sendTransactionalEventEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;
type RecruiterJob = { id: string; title: string; recruiter_id: string | null };

type FeedbackKind = "decision" | "more_options" | "message";

export async function emailRecruiterAboutClientFeedback(args: {
  admin: AdminClient;
  job: RecruiterJob;
  kind: FeedbackKind;
  summary: string;
  eventId: string;
  urgent?: boolean;
}) {
  // Email only an active recruiter, never the client's email or a VA account.
  const { data: activeAssigned, error } = await args.admin
    .from("profiles")
    .select("id")
    .eq("role", "recruiter")
    .eq("account_status", "active")
    .eq("id", args.job.recruiter_id || "00000000-0000-0000-0000-000000000000")
    .limit(1);
  let recruiters = activeAssigned;
  if (error) throw error;
  if (!recruiters?.length) {
    const fallback = await args.admin.from("profiles")
      .select("id")
      .eq("role", "recruiter")
      .eq("account_status", "active")
      .limit(3);
    if (fallback.error) throw fallback.error;
    recruiters = fallback.data;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const results = await Promise.allSettled((recruiters || []).map(async (recruiter) => {
    const { data, error: authError } = await args.admin.auth.admin.getUserById(recruiter.id);
    if (authError || !data.user?.email) throw new Error("Recruiter recipient unavailable");
    const delivery = await sendTransactionalEventEmail({
      to: data.user.email,
      subject: "Client feedback received: " + args.job.title,
      heading: args.summary,
      body: "A client submitted feedback on the " + args.job.title + " hiring role. Open the private recruiter workspace to see the recorded response and take the next step.",
      href: appUrl + "/workspace/recruiter/roles/" + args.job.id + "#client-handoff",
      hrefLabel: "Review client feedback",
      senderName: "VirtualAssistant.com.ph Hiring Team",
      teamLabel: "Recruiter update",
      footerText: "This notification relates to a role assigned to the recruiting team.",
      eventType: "client_shortlist_feedback",
      idempotencyKey: "client-shortlist-feedback-" + args.eventId + "-" + recruiter.id,
      priority: args.urgent ? "critical" : "standard",
    });
    if (!delivery.sent) {
      console.error("[client-feedback] recruiter email skipped", {
        jobId: args.job.id, reason: delivery.reason || "email_unavailable",
      });
    }
  }));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[client-feedback] recruiter email failed", {
        jobId: args.job.id,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }
  return { recipientCount: (recruiters || []).length };
}
