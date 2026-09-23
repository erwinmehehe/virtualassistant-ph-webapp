import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, ShieldAlert } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingSpecialistReviewQueue } from "@/lib/training-admin";
import { getSpecialistReviewDefinition } from "@/lib/training-specialist-review";
import {
  assignTrainingSpecialistReviewerAction,
  saveTrainingSpecialistReviewAction,
  setTrainingCourseStatusAction,
} from "@/app/actions/training-admin";

export const dynamic = "force-dynamic";

function dateLabel(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

function dueState(value: string | null | undefined) {
  if (!value) return { label: "No due date", overdue: false };
  const due = new Date(value + "T23:59:59+08:00");
  if (Number.isNaN(due.getTime())) return { label: "No due date", overdue: false };
  return {
    label: dateLabel(value),
    overdue: due.getTime() < Date.now(),
  };
}

function eventLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SpecialistTrainingReviewPage() {
  const { items, error } = await getTrainingSpecialistReviewQueue();
  const approved = items.filter((item) => item.specialistReady).length;
  const changesRequested = items.filter((item) => item.review?.decision === "changes_requested").length;
  const releaseReady = items.filter(
    (item) => item.editorialReady && item.contentReady && item.assessmentReady && item.specialistReady,
  ).length;

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Training quality"
        title="Specialist review queue"
        subtitle={<>Verify higher-risk course content before release. Approval here records specialist evidence but does not bypass the normal publishing checks.</>}
        actions={<Link className="dash-btn" href="/workspace/admin/training"><ArrowLeft size={15}/> Training</Link>}
      />

      <div className="va-status-grid">
        <div className="status-summary-card">
          <div className="row-between"><span>Specialist courses</span><ClipboardCheck size={18}/></div>
          <strong>{items.length}</strong>
          <small>Require subject-matter sign-off</small>
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
          <div><span><strong>Evidence, not a checkbox ritual</strong><small>Use the notes field for corrections, limits, and what was actually reviewed.</small></span></div>
          <div><span><strong>All checklist items required for approval</strong><small>Partial reviews can be saved as in progress or needs changes.</small></span></div>
          <div><span><strong>Content edits invalidate sign-off</strong><small>Any substantive course edit clears the specialist review date and returns the course to draft.</small></span></div>
          <div><span><strong>Publishing remains separate</strong><small>Specialist approval makes a course eligible for the normal publish gate. It does not auto-publish.</small></span></div>
        </div>
      </section>

      <div className="stack">
        {items.map((item) => {
          const definition = getSpecialistReviewDefinition(item.course.slug);
          if (!definition) return null;
          const review = item.review;
          const due = dueState(review?.review_due_date);
          const canReview = item.assignmentCurrent;
          const canApprove = item.contentReady && item.assessmentReady && item.assignmentCurrent;
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
                  {item.specialistReady ? "Specialist approved" : review?.decision === "changes_requested" ? "Needs changes" : review?.decision === "in_progress" ? "In progress" : "Waiting"}
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
                  <span><strong>Assessment</strong><small>{item.assessmentReadyCount}/{item.assessmentCount} practical assessment setup ready</small></span>
                  <span className={"badge " + (item.assessmentReady ? "badge-success" : "badge-warning")}>{item.assessmentReady ? "Ready" : "Needed"}</span>
                </div>
                <div>
                  <span><strong>Specialist sign-off</strong><small>{item.specialistReady ? (item.course.specialist_reviewed_by || "Reviewer") + " · " + (item.course.specialist_reviewer_role || "Role recorded") + " · " + dateLabel(item.course.specialist_reviewed_at) : "Not approved"}</small></span>
                  <span className={"badge " + (item.specialistReady ? "badge-success" : "badge-warning")}>{item.specialistReady ? "Done" : "Needed"}</span>
                </div>
              </div>

              <form action={assignTrainingSpecialistReviewerAction} className="stack" style={{ marginTop: 18 }}>
                <input type="hidden" name="course_id" value={item.course.id}/>
                <div className="dashboard-section-head">
                  <div>
                    <h3>Reviewer assignment</h3>
                    <p>Assignment locks this review to revision {review?.review_revision || 1}. Any later course edit makes the assignment stale until it is refreshed.</p>
                  </div>
                  <span className={"badge " + (item.assignmentCurrent ? "badge-success" : "badge-warning")}>
                    {item.assignmentCurrent ? "Current assignment" : review?.assigned_reviewer_name ? "Refresh required" : "Unassigned"}
                  </span>
                </div>
                <div className="grid-3">
                  <label className="field">
                    <span>Assigned reviewer</span>
                    <input name="assigned_reviewer_name" required defaultValue={review?.assigned_reviewer_name || ""} placeholder="Full name"/>
                  </label>
                  <label className="field">
                    <span>Reviewer role / scope</span>
                    <input name="assigned_reviewer_role" required defaultValue={review?.assigned_reviewer_role || ""} placeholder="e.g. payroll practitioner"/>
                  </label>
                  <label className="field">
                    <span>Due date</span>
                    <input name="review_due_date" type="date" defaultValue={review?.review_due_date || ""}/>
                  </label>
                </div>
                <div className="row wrap">
                  <button className="btn" type="submit">{review?.assigned_reviewer_name ? "Refresh assignment" : "Assign reviewer"}</button>
                  {review?.assigned_reviewer_name ? <span className={"badge " + (due.overdue && !item.specialistReady ? "badge-warning" : "")}>Due {due.label}</span> : null}
                  {review?.assigned_at ? <span className="small muted">Assigned {dateLabel(review.assigned_at)} · revision {review.assigned_revision || "—"}/{review.review_revision}</span> : null}
                </div>
              </form>

              <form action={saveTrainingSpecialistReviewAction} className="stack" style={{ marginTop: 18 }}>
                <input type="hidden" name="course_id" value={item.course.id}/>

                <div className="notice">
                  <strong>{review?.assigned_reviewer_name || "No specialist reviewer assigned"}</strong>
                  <p>{review?.assigned_reviewer_role || "Assign a reviewer before recording checklist work."}</p>
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
                  <button className="btn" type="submit" name="decision" value="in_progress" disabled={!canReview}>Save progress</button>
                  <button className="btn" type="submit" name="decision" value="changes_requested" disabled={!canReview}>Needs changes</button>
                  <button className="btn btn-primary" type="submit" name="decision" value="approved" disabled={!canApprove}>Approve specialist review</button>
                  <Link className="btn" href={"/workspace/admin/training/" + item.course.id}>Open course <ExternalLink size={14}/></Link>
                </div>
              </form>

              {item.specialistReady ? (
                <div className="notice" style={{ marginTop: 16 }}>
                  <strong>Specialist approval recorded</strong>
                  <p>{item.course.specialist_review_notes}</p>
                </div>
              ) : null}

              {item.history.length ? (
                <details className="card" style={{ marginTop: 16 }}>
                  <summary className="row-between">
                    <span><strong>Review history</strong><small className="muted"> Immutable assignment and decision events</small></span>
                    <span className="badge">{item.history.length}</span>
                  </summary>
                  <div className="compact-list" style={{ marginTop: 12 }}>
                    {item.history.map((event) => (
                      <div key={event.id}>
                        <span>
                          <strong>{eventLabel(event.event_type)}</strong>
                          <small>{event.reviewer_name || "System"}{event.reviewer_role ? " · " + event.reviewer_role : ""} · revision {event.assigned_revision || "—"}/{event.review_revision}</small>
                          {event.notes ? <small className="muted">{event.notes}</small> : null}
                        </span>
                        <span>
                          <small>{dateLabel(event.created_at)}</small>
                          {event.actor_label ? <small className="muted">{event.actor_label}</small> : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
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
