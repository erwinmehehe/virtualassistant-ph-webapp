import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Mail,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingSpecialistReviewQueue } from "@/lib/training-admin";
import { getSpecialistReviewDefinition } from "@/lib/training-specialist-review";
import {
  saveTrainingSpecialistReviewAction,
  setTrainingCourseStatusAction,
} from "@/app/actions/training-admin";
import {
  revokeTrainingSpecialistReviewInviteAction,
  sendTrainingSpecialistReviewInviteAction,
} from "@/app/actions/training-specialist-invites";

export const dynamic = "force-dynamic";

function dateLabel(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

function inviteStatus(status: string | undefined) {
  if (status === "opened") return "Opened";
  if (status === "submitted") return "Submitted";
  if (status === "revoked") return "Revoked";
  return "Sent";
}

export default async function SpecialistTrainingReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const { items, error } = await getTrainingSpecialistReviewQueue();
  const approved = items.filter((item) => item.specialistReady).length;
  const changesRequested = items.filter((item) => item.review?.decision === "changes_requested").length;
  const activeInvites = items.filter((item) => ["pending", "opened"].includes(item.invite?.status || "")).length;
  const releaseReady = items.filter(
    (item) => item.editorialReady && item.contentReady && item.assessmentReady && item.specialistReady,
  ).length;

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Training quality"
        title="Specialist review queue"
        subtitle={<>Assign a real subject-matter reviewer, send a private course review, capture evidence, and publish only after every release gate passes.</>}
        actions={<Link className="dash-btn" href="/workspace/admin/training"><ArrowLeft size={15}/> Training</Link>}
      />

      {query.invited ? <div className="success-banner" role="status">Specialist review invite sent.</div> : null}

      <div className="va-status-grid">
        <div className="status-summary-card">
          <div className="row-between"><span>Specialist courses</span><ClipboardCheck size={18}/></div>
          <strong>{items.length}</strong>
          <small>Require subject-matter sign-off</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>Reviews out</span><Mail size={18}/></div>
          <strong>{activeInvites}</strong>
          <small>Pending or opened secure invites</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>Approved</span><CheckCircle2 size={18}/></div>
          <strong>{approved}</strong>
          <small>{releaseReady} fully release-ready</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>Needs changes</span><ShieldAlert size={18}/></div>
          <strong>{changesRequested}</strong>
          <small>Corrections recorded by reviewer</small>
        </div>
      </div>

      {error ? (
        <section className="card dashboard-section-card">
          <h2>Review queue unavailable</h2>
          <p className="muted">{error}</p>
        </section>
      ) : null}

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>Review standard</h2>
            <p>Review the actual operational guidance, legal or professional boundaries, privacy controls, escalation rules, and final simulation. Do not approve from the course title alone.</p>
          </div>
        </div>
        <div className="compact-list">
          <div><span><strong>Invite the actual reviewer</strong><small>The reviewer receives a secure, expiring link and does not need an admin account.</small></span></div>
          <div><span><strong>Evidence, not a checkbox ritual</strong><small>Review notes should record corrections, limits, current-practice basis, and what was actually checked.</small></span></div>
          <div><span><strong>Content edits invalidate sign-off</strong><small>Any substantive course edit clears the specialist review date and returns the course to draft.</small></span></div>
          <div><span><strong>Publishing remains separate</strong><small>Specialist approval makes a course eligible for the normal publish gate. It does not auto-publish.</small></span></div>
        </div>
      </section>

      <div className="stack">
        {items.map((item) => {
          const definition = getSpecialistReviewDefinition(item.course.slug);
          if (!definition) {
            return (
              <section className="card dashboard-section-card" key={item.course.id}>
                <div className="alert">This specialist course is missing its review checklist: {item.course.title}</div>
              </section>
            );
          }

          const review = item.review;
          const invite = item.invite;
          const inviteActive = invite && ["pending", "opened"].includes(invite.status);
          const canApprove = item.contentReady && item.assessmentReady;
          const canPublish = item.editorialReady && item.contentReady && item.assessmentReady && item.specialistReady;

          return (
            <section className="card dashboard-section-card" key={item.course.id}>
              <div className="dashboard-section-head">
                <div>
                  <div className="small muted">{definition.title}</div>
                  <h2>{item.course.title}</h2>
                  <p>{definition.reviewerHint}</p>
                </div>
                <span className={"badge " + (item.specialistReady ? "badge-success" : review?.decision === "changes_requested" ? "badge-warning" : "")}>
                  {item.specialistReady ? "Specialist approved" : review?.decision === "changes_requested" ? "Needs changes" : invite?.status === "opened" ? "Reviewer opened" : invite?.status === "pending" ? "Review sent" : review?.decision === "in_progress" ? "In progress" : "Waiting"}
                </span>
              </div>

              <div className="compact-list">
                <div>
                  <span><strong>Editorial review</strong><small>{item.course.reviewed_by || "Not recorded"} · {dateLabel(item.course.last_reviewed_at)}</small></span>
                  <span className={"badge " + (item.editorialReady ? "badge-success" : "badge-warning")}>{item.editorialReady ? "Ready" : "Needed"}</span>
                </div>
                <div>
                  <span><strong>Course content</strong><small>{item.publishedLessonCount}/{item.lessonCount} lessons publishable · {item.substantiveLessonCount}/{item.lessonCount} substantive</small></span>
                  <span className={"badge " + (item.contentReady ? "badge-success" : "badge-warning")}>{item.contentReady ? "Ready" : "Needed"}</span>
                </div>
                <div>
                  <span><strong>Assessment</strong><small>{item.assessmentReadyCount}/{item.assessmentCount} assessment setup ready</small></span>
                  <span className={"badge " + (item.assessmentReady ? "badge-success" : "badge-warning")}>{item.assessmentReady ? "Ready" : "Needed"}</span>
                </div>
                <div>
                  <span><strong>Specialist sign-off</strong><small>{item.specialistReady ? (item.course.specialist_reviewed_by || "Reviewer") + " · " + (item.course.specialist_reviewer_role || "Role recorded") + " · " + dateLabel(item.course.specialist_reviewed_at) : "Not approved"}</small></span>
                  <span className={"badge " + (item.specialistReady ? "badge-success" : "badge-warning")}>{item.specialistReady ? "Done" : "Needed"}</span>
                </div>
              </div>

              {!item.specialistReady ? (
                <section className="card" style={{ marginTop: 18 }}>
                  <div className="row-between wrap">
                    <div>
                      <div className="small muted">External reviewer handoff</div>
                      <h3 style={{ margin: "4px 0" }}>{inviteActive ? "Review invite is active" : "Assign a specialist reviewer"}</h3>
                    </div>
                    {invite ? <span className={"badge " + (invite.status === "opened" ? "badge-success" : "")}>{inviteStatus(invite.status)}</span> : null}
                  </div>

                  {invite ? (
                    <div className="compact-list" style={{ marginTop: 12 }}>
                      <div><span><strong>{invite.reviewer_name}</strong><small>{invite.reviewer_email} · {invite.reviewer_role}</small></span></div>
                      <div><span><strong>Due date</strong><small><CalendarDays size={12}/> {dateLabel(invite.due_at)}</small></span></div>
                      <div><span><strong>Review link</strong><small>{invite.opened_at ? "Opened " + dateLabel(invite.opened_at) : invite.sent_at ? "Sent " + dateLabel(invite.sent_at) : "Not sent"}</small></span></div>
                    </div>
                  ) : null}

                  {inviteActive ? (
                    <form action={revokeTrainingSpecialistReviewInviteAction} style={{ marginTop: 12 }}>
                      <input type="hidden" name="invite_id" value={invite.id}/>
                      <button className="btn btn-sm" type="submit"><XCircle size={14}/> Revoke invite</button>
                    </form>
                  ) : (
                    <form action={sendTrainingSpecialistReviewInviteAction} className="stack" style={{ marginTop: 14 }}>
                      <input type="hidden" name="course_id" value={item.course.id}/>
                      <div className="grid-2">
                        <label className="field">
                          <span>Reviewer name</span>
                          <input name="reviewer_name" required minLength={2} maxLength={160} defaultValue={invite?.reviewer_name || ""} placeholder="Full name"/>
                        </label>
                        <label className="field">
                          <span>Reviewer email</span>
                          <input type="email" name="reviewer_email" required maxLength={254} defaultValue={invite?.reviewer_email || ""} placeholder="reviewer@company.com"/>
                        </label>
                      </div>
                      <div className="grid-2">
                        <label className="field">
                          <span>Reviewer role / scope</span>
                          <input name="reviewer_role" required minLength={3} maxLength={220} defaultValue={invite?.reviewer_role || ""} placeholder="e.g. licensed mortgage broker"/>
                        </label>
                        <label className="field">
                          <span>Due date</span>
                          <input type="date" name="due_date" required/>
                        </label>
                      </div>
                      <div>
                        <button className="btn btn-primary" type="submit"><Send size={14}/> Send secure review</button>
                      </div>
                    </form>
                  )}
                </section>
              ) : null}

              <details style={{ marginTop: 18 }}>
                <summary className="btn btn-sm">Admin review controls</summary>
                <form action={saveTrainingSpecialistReviewAction} className="stack" style={{ marginTop: 14 }}>
                  <input type="hidden" name="course_id" value={item.course.id}/>

                  <div className="grid-2">
                    <label className="field">
                      <span>Reviewer name</span>
                      <input name="reviewer_name" defaultValue={review?.reviewer_name || item.course.specialist_reviewed_by || ""} placeholder="Full name"/>
                    </label>
                    <label className="field">
                      <span>Reviewer role / scope</span>
                      <input name="reviewer_role" defaultValue={review?.reviewer_role || item.course.specialist_reviewer_role || ""} placeholder="e.g. payroll practitioner"/>
                    </label>
                  </div>

                  <div className="stack">
                    {definition.items.map((check) => (
                      <label className="card" key={check.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <input
                          type="checkbox"
                          name={"check_" + check.id}
                          value="1"
                          defaultChecked={Boolean(review?.checklist?.[check.id])}
                          style={{ marginTop: 4 }}
                        />
                        <span>
                          <strong>{check.label}</strong>
                          <small className="muted" style={{ display: "block", marginTop: 4 }}>{check.detail}</small>
                        </span>
                      </label>
                    ))}
                  </div>

                  <label className="field">
                    <span>Review notes and corrections</span>
                    <textarea
                      name="notes"
                      rows={6}
                      maxLength={5000}
                      defaultValue={review?.notes || item.course.specialist_review_notes || ""}
                      placeholder="Record corrections made, remaining limitations, source or practice basis, and anything the next reviewer should know."
                    />
                  </label>

                  <div className="row wrap">
                    <button className="btn" type="submit" name="decision" value="in_progress">Save progress</button>
                    <button className="btn" type="submit" name="decision" value="changes_requested">Needs changes</button>
                    <button className="btn btn-primary" type="submit" name="decision" value="approved" disabled={!canApprove}>Approve specialist review</button>
                    <Link className="btn" href={"/workspace/admin/training/" + item.course.id}>Open course <ExternalLink size={14}/></Link>
                  </div>
                </form>
              </details>

              {item.specialistReady ? (
                <div className="notice" style={{ marginTop: 16 }}>
                  <strong>Specialist approval recorded</strong>
                  <p>{item.course.specialist_review_notes}</p>
                </div>
              ) : null}

              {canPublish && item.course.status !== "published" ? (
                <form action={setTrainingCourseStatusAction} style={{ marginTop: 16 }}>
                  <input type="hidden" name="course_id" value={item.course.id}/>
                  <input type="hidden" name="status" value="published"/>
                  <button className="btn btn-primary" type="submit">Publish reviewed course</button>
                </form>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
