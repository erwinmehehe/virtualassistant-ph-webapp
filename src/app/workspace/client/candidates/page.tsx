import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { clientShortlistDecisionAction } from "@/app/actions/client-shortlist";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { ClientShortlistCandidateCard } from "@/components/client-shortlist-candidate-card";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  getClientHiringRoomSummary,
  recordClientShortlistView,
  trainingCredentialsByUser,
} from "@/lib/client-hiring-room";

export default async function ClientCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const { userId } = await requireRoleFast("client");
  const summaryResult = await getClientHiringRoomSummary(userId, query.role || null);
  if (summaryResult.error) throw summaryResult.error;

  const summary = summaryResult.data || {
    jobs: [],
    selected_job: null,
    access_status: null,
    released: [],
    profiles: [],
    vas: [],
    credentials: [],
    active_interviews: 0,
    active_offers: 0,
  };

  const jobRows = summary.jobs || [];
  if (!jobRows.length) {
    return <>
      <div className="page-head">
        <div>
          <h1>Hiring Room</h1>
          <p>Review recruiter-selected candidates and keep every hiring decision in one place.</p>
        </div>
      </div>
      <div className="card empty">
        <p>Start with a hiring request so we have a role to recruit against.</p>
        <Link className="btn btn-primary" href="/workspace/client/jobs/new">Start a hiring request</Link>
      </div>
    </>;
  }

  const activeJobs = jobRows.filter((job) => job.status !== "closed");
  const selectedJob = summary.selected_job;
  const selectedReleased = summary.released || [];
  const selectedPublished = selectedJob?.status === "published";
  const selectedAccessUnlocked = selectedJob ? candidateAccessUnlocked(summary.access_status) : false;

  if (selectedJob && selectedPublished && selectedAccessUnlocked && selectedReleased.length) {
    try {
      await recordClientShortlistView(userId, selectedJob.id, selectedReleased.length);
    } catch {
      // Shortlist analytics should never block the client from reviewing candidates.
    }
  }

  const profileMap = new Map((summary.profiles || []).map((row) => [row.id, row]));
  const vaMap = new Map((summary.vas || []).map((row) => [row.user_id, row]));
  const trainingByUser = trainingCredentialsByUser(summary.credentials || []);

  const activeOffers = Number(summary.active_offers || 0);
  const activeInterviews = Number(summary.active_interviews || 0);
  const held = selectedReleased.filter((row) => row.client_decision === "hold").length;
  const remaining = selectedReleased.filter((row) => !row.client_decision || row.client_decision === "hold").length;
  const interested = selectedReleased.filter((row) => row.client_decision === "interested").length;
  const allPassed = selectedReleased.length > 0 && selectedReleased.every((row) => row.client_decision === "pass");

  const next = activeOffers
    ? {
        title: `${activeOffers} placement offer${activeOffers === 1 ? "" : "s"} needs attention`,
        copy: "Review recruiter-prepared final terms. The VA accepts first, then you confirm the placement.",
        href: "/workspace/client/offers",
        label: "Review offers",
        waiting: "Waiting on you",
      }
    : activeInterviews
      ? {
          title: `${activeInterviews} interview${activeInterviews === 1 ? "" : "s"} to manage`,
          copy: "Choose or review interview times and keep the hiring decision moving.",
          href: "/workspace/client/interviews",
          label: "Open interviews",
          waiting: "Waiting on you",
        }
      : remaining
        ? {
            title: `${remaining} shortlist decision${remaining === 1 ? "" : "s"} still open`,
            copy: held
              ? `You have ${held} candidate${held === 1 ? "" : "s"} on hold. Resolve held candidates or review any remaining shortlist options.`
              : "Mark each recruiter-selected VA as interested, request an interview, place them on hold with context, or pass.",
            href: selectedJob
              ? `/workspace/client/candidates?role=${encodeURIComponent(selectedJob.id)}#recruiter-shortlist`
              : "/workspace/client/candidates",
            label: "Review Hiring Room",
            waiting: "Waiting on you",
          }
        : interested
          ? {
              title: "Your recruiter has your feedback",
              copy: "You marked a candidate as interested. Our recruiting team will coordinate the appropriate next step.",
              href: "/workspace/client/interviews",
              label: "View interviews",
              waiting: "Waiting on our recruiting team",
            }
          : allPassed
            ? {
                title: "We’re finding replacement options",
                copy: "You passed on the current shortlist. Your recruiter can now bring forward better-matched alternatives.",
                href: "/workspace/client/jobs",
                label: "View role",
                waiting: "Waiting on our recruiting team",
              }
            : {
                title: "We’re screening the vetted pool",
                copy: "Your recruiter is reviewing fit, evidence, rate, schedule, and capacity before anyone is presented to you.",
                href: "/workspace/client/jobs",
                label: "View role progress",
                waiting: "Waiting on our recruiting team",
              };

  return <>
    <div className="page-head">
      <div>
        <h1>Hiring Room</h1>
        <p>Only candidates selected by our recruiting team appear here. Review recruiter-selected VAs, request interviews, hold candidates for follow-up, and send clear feedback without sorting through raw applicants.</p>
      </div>
    </div>

    <section className="candidate-next-action">
      <div className="candidate-next-icon"><Sparkles size={21}/></div>
      <div>
        <span className="small">Your next action</span>
        <h2>{next.title}</h2>
        <p>{next.copy}</p>
        <small className="muted">{next.waiting}</small>
      </div>
      <Link className="btn btn-primary" href={next.href}>{next.label}<ArrowRight size={16}/></Link>
    </section>

    {activeJobs.length > 1 ? (
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <span className="small muted">Role:</span>
        {activeJobs.slice(0, 8).map((job) => (
          <Link
            key={job.id}
            className={`btn btn-sm ${selectedJob?.id === job.id ? "btn-primary" : ""}`}
            href={`/workspace/client/candidates?role=${encodeURIComponent(job.id)}`}
          >
            {job.title}
          </Link>
        ))}
      </div>
    ) : null}

    <section className="card dashboard-section-card" id="recruiter-shortlist">
      <div className="dashboard-section-head">
        <div>
          <h2>Recruiter shortlist{selectedJob ? ` for ${selectedJob.title}` : ""}</h2>
          <p>We have already screened these VAs. Your decisions and notes go directly back to the recruiting team.</p>
        </div>
      </div>

      {selectedReleased.length ? (
        selectedPublished && selectedAccessUnlocked ? (
          <div className="grid-3 browse-va-grid">
            {selectedReleased.map((row) => {
              const profile = profileMap.get(row.va_id);
              const va = vaMap.get(row.va_id);
              const decision = String(row.client_decision || "");
              const decisionLabel = decision === "interested"
                ? "Interested"
                : decision === "interview"
                  ? "Interview requested"
                  : decision === "hold"
                    ? "On hold"
                    : decision === "pass"
                      ? "Passed"
                      : "";

              return <ClientShortlistCandidateCard
                key={row.va_id}
                fullName={profile?.full_name}
                headline={va?.headline}
                primaryCategory={va?.primary_category}
                matchScore={row.match_score}
                yearsExperience={va?.years_experience}
                weeklyHours={va?.weekly_hours}
                hourlyRate={va?.hourly_rate}
                skills={va?.skills}
                tools={va?.tools}
                recommendation={row.client_recommendation}
                trainingCredentials={trainingByUser.get(row.va_id) || []}
                status={decisionLabel ? (
                  <span className={`badge ${decision === "pass" || decision === "hold" ? "badge-warning" : "badge-success"}`}>
                    {decisionLabel}
                  </span>
                ) : null}
                actions={selectedJob ? (
                  <div className="stack" style={{ marginTop: 10 }}>
                    <div className="row wrap">
                      <form action={clientShortlistDecisionAction}>
                        <input type="hidden" name="job_id" value={selectedJob.id}/>
                        <input type="hidden" name="va_id" value={row.va_id}/>
                        <input type="hidden" name="decision" value="interested"/>
                        <input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/>
                        <PendingSubmitButton
                          className={`btn btn-sm ${decision === "interested" ? "btn-primary" : ""}`}
                          label="Interested"
                          pendingLabel="Saving…"
                        />
                      </form>

                      <form action={clientShortlistDecisionAction}>
                        <input type="hidden" name="job_id" value={selectedJob.id}/>
                        <input type="hidden" name="va_id" value={row.va_id}/>
                        <input type="hidden" name="decision" value="interview"/>
                        <input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/>
                        <PendingSubmitButton
                          className={`btn btn-sm ${decision === "interview" ? "btn-primary" : ""}`}
                          label="Request interview"
                          pendingLabel="Saving…"
                        />
                      </form>

                      <details>
                        <summary className={`btn btn-sm ${decision === "hold" ? "btn-primary" : ""}`}>Hold</summary>
                        <form action={clientShortlistDecisionAction} className="stack" style={{ marginTop: 8 }}>
                          <input type="hidden" name="job_id" value={selectedJob.id}/>
                          <input type="hidden" name="va_id" value={row.va_id}/>
                          <input type="hidden" name="decision" value="hold"/>
                          <input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/>
                          <select name="hold_reason" defaultValue="">
                            <option value="">Reason optional</option>
                            <option value="need_more_information">Need more information</option>
                            <option value="comparing_candidates">Comparing candidates</option>
                            <option value="rate_concern">Rate concern</option>
                            <option value="schedule_timezone_concern">Schedule / timezone concern</option>
                            <option value="team_approval">Need team approval</option>
                            <option value="other">Other</option>
                          </select>
                          <input name="decision_note" maxLength={300} placeholder="Optional note for your recruiter"/>
                          <PendingSubmitButton className="btn btn-sm" label="Place on hold" pendingLabel="Saving…"/>
                        </form>
                      </details>

                      <details>
                        <summary className="btn btn-sm">Pass</summary>
                        <form action={clientShortlistDecisionAction} className="stack" style={{ marginTop: 8 }}>
                          <input type="hidden" name="job_id" value={selectedJob.id}/>
                          <input type="hidden" name="va_id" value={row.va_id}/>
                          <input type="hidden" name="decision" value="pass"/>
                          <input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/>
                          <select name="pass_reason" defaultValue="">
                            <option value="">Reason optional</option>
                            <option value="skills">Skills</option>
                            <option value="rate">Rate</option>
                            <option value="schedule_timezone">Schedule / timezone</option>
                            <option value="experience">Experience</option>
                            <option value="communication_video">Communication / video</option>
                            <option value="industry_fit">Industry fit</option>
                            <option value="availability">Availability</option>
                            <option value="other">Other</option>
                          </select>
                          <input name="decision_note" maxLength={300} placeholder="Optional note for your recruiter"/>
                          <PendingSubmitButton className="btn btn-sm" label="Confirm pass" pendingLabel="Saving…"/>
                        </form>
                      </details>
                    </div>
                  </div>
                ) : null}
                feedback={row.client_decision_note ? (
                  <div className="small muted">Feedback: {row.client_decision_note}</div>
                ) : null}
              />;
            })}
          </div>
        ) : selectedPublished ? (
          <div className="empty">
            <strong>{selectedReleased.length} curated match{selectedReleased.length === 1 ? " is" : "es are"} ready.</strong>
            <p>Your recruiting team will make the approved shortlist available once candidate access is active.</p>
            <Link className="btn btn-primary" href={`/workspace/client/jobs/${selectedJob?.id}`}>View role progress</Link>
          </div>
        ) : (
          <div className="empty">
            <strong>{selectedReleased.length} match{selectedReleased.length === 1 ? " is" : "es are"} being prepared.</strong>
            <p>Full profiles appear after the role and service terms are active.</p>
          </div>
        )
      ) : (
        <div className="empty">
          <strong>Your recruiter is working the role.</strong>
          <p>We will only add candidates here after screening them against your requirements.</p>
        </div>
      )}
    </section>
  </>;
}
