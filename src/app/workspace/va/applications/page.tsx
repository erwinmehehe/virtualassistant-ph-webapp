import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateShort } from "@/lib/format";
import { respondToInviteAction, withdrawApplicationAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";

function stageLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Recruiter review",
    reviewing: "Recruiter review",
    shortlisted: "Presented to client",
    interview: "Interview",
    offered: "Offer",
    hired: "Placed",
    rejected: "Not selected",
    withdrawn: "Withdrawn",
  };
  return labels[status] || String(status).replaceAll("_", " ");
}

export default async function VaApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("va");
  const supabase = await createClient();

  const [{ data: apps }, { data: invites }] = await Promise.all([
    supabase
      .from("applications")
      .select("*,jobs(id,slug,title,company_name,status)")
      .eq("va_id", userId)
      .order("applied_at", { ascending: false }),
    supabase
      .from("job_invites")
      .select("*,jobs(id,slug,title,company_name,hours_per_week,min_hourly_rate)")
      .eq("va_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const pendingInvites = (invites || []).filter((invite: any) => invite.status === "pending");

  return (
    <div className="va-applications-page">
      {params.interest === "1" ? (
        <div className="success-banner" role="status">
          <CheckCircle2 size={17} /> Interest sent. A recruiter will review the role before presenting candidates to the client.
        </div>
      ) : null}
      {params.interest === "already" ? (
        <div className="alert" role="status">You already expressed interest in this role.</div>
      ) : null}
      {params.invite ? (
        <div className="success-banner" role="status">
          Interview request {params.invite}.
          {params.invite === "accepted" ? " The recruiting team can now coordinate the next step." : " The recruiting team has been updated."}
        </div>
      ) : null}

      <div className="va-jobs-head">
        <div>
          <h1>Applications</h1>
          <p>Track roles you applied for and any interview or placement updates.</p>
        </div>
        <Link className="btn btn-sm" href="/workspace/va/jobs">Find jobs</Link>
      </div>

      {pendingInvites.length ? (
        <section className="va-application-section" aria-labelledby="interview-requests-title">
          <div className="va-application-section-head">
            <div>
              <h2 id="interview-requests-title">Interview requests</h2>
              <p>Confirm whether you want to continue with these roles.</p>
            </div>
          </div>
          <div className="va-request-list">
            {pendingInvites.map((invite: any) => (
              <div className="va-request-row" key={invite.id}>
                <div>
                  <strong>{invite.jobs?.title}</strong>
                  <span>{invite.jobs?.company_name || "Confidential client"}</span>
                  {invite.note ? <p>{invite.note}</p> : null}
                </div>
                <div className="va-request-actions">
                  <form action={respondToInviteAction}>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <button className="btn btn-primary btn-sm" name="decision" value="accepted">Accept</button>
                  </form>
                  <form action={respondToInviteAction}>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <button className="btn btn-sm" name="decision" value="declined">Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="va-application-section" aria-labelledby="application-history-title">
        <div className="va-application-section-head">
          <div>
            <h2 id="application-history-title">Your applications</h2>
            <p>Status updates from the recruiting process.</p>
          </div>
        </div>

        {apps?.length ? (
          <div className="va-application-list">
            {apps.map((application: any) => (
              <article className="va-application-row" key={application.id}>
                <div className="va-application-role">
                  <strong>{application.jobs?.title}</strong>
                  <span>{application.jobs?.company_name || "Confidential client"}</span>
                </div>
                <div className="va-application-status">
                  <span className={`badge ${application.status === "hired" ? "badge-success" : application.status === "interview" ? "badge-warning" : ""}`}>
                    {stageLabel(application.status)}
                  </span>
                  <small>Since {dateShort(application.applied_at)}</small>
                </div>
                <div className="va-application-actions">
                  <Link className="btn btn-sm" href={jobPublicHref(application.jobs || { id: application.job_id })}>View role</Link>
                  {!["hired", "rejected", "withdrawn"].includes(application.status) ? (
                    <form action={withdrawApplicationAction}>
                      <input type="hidden" name="application_id" value={application.id} />
                      <button className="btn btn-sm btn-danger" type="submit">Withdraw</button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-card">
            <h2>No applications yet</h2>
            <p>Browse open roles and apply when you find a good fit.</p>
            <div className="workspace-empty-actions row">
              <Link href="/workspace/va/jobs" className="btn btn-primary">Find jobs</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
