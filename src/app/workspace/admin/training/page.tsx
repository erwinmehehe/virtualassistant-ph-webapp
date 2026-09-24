import Link from "next/link";
import { Activity, BookOpenCheck, Clock3, FileCheck2, GraduationCap, Plus, RefreshCcw, ShieldCheck, TimerReset } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingAdminSummary } from "@/lib/training";
import { setTrainingLearningPathStatusAction } from "@/app/actions/training-admin";

function reviewState(value: string | null) {
  if (!value) return "Review not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Review not recorded";
  const ageDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return ageDays > 180 ? `Review due · ${ageDays}d` : `Reviewed ${new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(date)}`;
}

export default async function AdminTrainingPage() {
  const { courses, paths, totals, funnel, integrity, error } = await getTrainingAdminSummary();

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Learning system"
        title="Training"
        subtitle={<>Manage the free learning library separately from hiring. Published lessons are private to signed-in learners and remain out of search indexing.</>}
        actions={<><Link className="dash-btn" href="/workspace/admin/training/new"><Plus size={15}/> New course</Link><Link className="dash-btn" href="/workspace/training">Open learner view</Link></>}
      />

      <div className="va-status-grid">
        <div className="status-summary-card"><div className="row-between"><span>Courses</span><GraduationCap size={18}/></div><strong>{totals.courses}</strong><small>Draft, published, and archived</small></div>
        <div className="status-summary-card"><div className="row-between"><span>Published</span><BookOpenCheck size={18}/></div><strong>{totals.published}</strong><small>Visible to signed-in learners</small></div>
        <div className="status-summary-card"><div className="row-between"><span>Lessons</span><FileCheck2 size={18}/></div><strong>{totals.lessons}</strong><small>Maximum 30 minutes each</small></div>
      </div>

      {error ? <section className="card dashboard-section-card"><h2>Migration required</h2><p className="muted">Apply the free training foundation migration before using course administration.</p></section> : null}

      {!error ? (
        <section className="card dashboard-section-card training-admin-funnel">
          <div className="dashboard-section-head">
            <div>
              <h2>Learner completion funnel</h2>
              <p>Unique signed-in learners who reached each training milestone in the last {funnel.windowDays} days. This is an activity funnel, not a fixed start-date cohort.</p>
            </div>
            <span className="badge">{funnel.windowDays} days</span>
          </div>
          <div className="compact-list training-funnel-list">
            {funnel.stages.map((stage, index) => (
              <div key={stage.event}>
                <span>
                  <strong>{index + 1}. {stage.label}</strong>
                  <small>{stage.events} event{stage.events === 1 ? "" : "s"} recorded</small>
                </span>
                <span className="badge">{stage.learners} learner{stage.learners === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!error ? (
        <section className="card dashboard-section-card training-integrity-analytics">
          <div className="dashboard-section-head">
            <div>
              <h2>Learner integrity signals</h2>
              <p>Signals from the last {integrity.windowDays} days. These help improve lessons and detect unusual patterns; they are not automatic misconduct labels.</p>
            </div>
            <span className="badge"><ShieldCheck size={13}/> Integrity</span>
          </div>

          <div className="va-status-grid">
            <div className="status-summary-card">
              <div className="row-between"><span>Checkpoint failure</span><Activity size={18}/></div>
              <strong>{integrity.checkpointFailureRate}%</strong>
              <small>{integrity.checkpointAttempts} attempt{integrity.checkpointAttempts === 1 ? "" : "s"}</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>First-attempt pass</span><ShieldCheck size={18}/></div>
              <strong>{integrity.firstAttemptPassRate}%</strong>
              <small>Automatic final checks</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Retry rate</span><RefreshCcw size={18}/></div>
              <strong>{integrity.retryRate}%</strong>
              <small>Learners using attempt 2+</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Avg. active reading</span><TimerReset size={18}/></div>
              <strong>{Math.round(integrity.averageActiveSeconds / 60)}m</strong>
              <small>{integrity.completedLessonsWithEngagement} completed lesson{integrity.completedLessonsWithEngagement === 1 ? "" : "s"} with engagement</small>
            </div>
          </div>

          <div className="notice">
            <strong>{integrity.thresholdHuggingCompletions} threshold-hugging completion{integrity.thresholdHuggingCompletions === 1 ? "" : "s"}</strong>
            <p>These completed within 20 seconds of the minimum active-reading threshold. Treat this as a review signal, not proof of cheating.</p>
          </div>

          <div className="dashboard-section-head training-integrity-lessons-head">
            <div>
              <h3>Lessons creating the most friction</h3>
              <p>Checkpoint failures are combined with lessons repeatedly missed in final checks.</p>
            </div>
          </div>
          {integrity.lessonFailures.length ? (
            <div className="compact-list">
              {integrity.lessonFailures.map((item) => (
                <div key={item.lessonId}>
                  <span>
                    <strong>{item.lessonTitle}</strong>
                    <small>{item.courseTitle} · {item.attempts} checkpoint attempt{item.attempts === 1 ? "" : "s"} · {item.failures} failed · {item.finalMisses} final-check miss{item.finalMisses === 1 ? "" : "es"}</small>
                  </span>
                  <span className="badge">{item.failureRate}% fail</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-caught-up">
              <ShieldCheck size={22}/>
              <div><strong>No integrity friction yet.</strong><p>Lesson-level signals will appear after learners begin using the new checkpoints.</p></div>
            </div>
          )}
        </section>
      ) : null}

      {paths.length ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head"><div><h2>Learning paths</h2><p>Optional country or market tracks. They never control hiring eligibility.</p></div></div>
          <div className="compact-list">
            {paths.map((learningPath) => (
              <div key={learningPath.id}>
                <span><strong>{learningPath.title}</strong><small>{learningPath.country_focus || "Global"} · {learningPath.courseCount} course{learningPath.courseCount === 1 ? "" : "s"}</small></span>
                <span className="row wrap">
                  <span className="badge">{learningPath.status}</span>
                  {learningPath.status !== "published" ? (
                    <form action={setTrainingLearningPathStatusAction}>
                      <input type="hidden" name="path_id" value={learningPath.id}/>
                      <input type="hidden" name="status" value="published"/>
                      <button className="btn btn-sm" type="submit">Publish path</button>
                    </form>
                  ) : (
                    <form action={setTrainingLearningPathStatusAction}>
                      <input type="hidden" name="path_id" value={learningPath.id}/>
                      <input type="hidden" name="status" value="draft"/>
                      <button className="btn btn-sm" type="submit">Return to draft</button>
                    </form>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Course inventory</h2><p>Keep the global curriculum versioned, reviewed, and easy to maintain as tools, industries, and country-specific workflows change.</p></div></div>
        {courses.length ? (
          <div className="dash-actions">
            {courses.map((course) => (
              <Link className="dash-action" href={"/workspace/admin/training/" + course.id} key={course.id}>
                <span className="dash-action-count"><Clock3 size={16}/></span>
                <span className="dash-action-copy">
                  <span className="dash-action-title"><strong>{course.recommended_order ? "#" + course.recommended_order + " " : ""}{course.title}</strong><span className="badge">{course.status}</span></span>
                  <small>{course.modules} module{course.modules === 1 ? "" : "s"} · {course.publishedLessons}/{course.lessons} lessons published · v{course.content_version}</small>
                  <small className="muted">{reviewState(course.last_reviewed_at)}{course.reviewed_by ? " · " + course.reviewed_by : ""}</small>
                  {course.trademark_disclaimer ? <small className="muted">Course notice recorded</small> : null}
                </span>
              </Link>
            ))}
          </div>
        ) : !error ? (
          <div className="dashboard-caught-up"><GraduationCap size={22}/><div><strong>No courses yet.</strong><p>The learning data model is ready. Create the first course after the content outline is approved.</p></div></div>
        ) : null}
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Publishing rules</h2><p>These are product rules, not optional marketing guidance.</p></div></div>
        <div className="compact-list">
          <div><span><strong>Free learning and certificates</strong><small>No lesson, assessment, or completion certificate is paywalled.</small></span></div>
          <div><span><strong>Independent from hiring</strong><small>Course completion never controls job access or shortlisting.</small></span></div>
          <div><span><strong>Editorial QA before release</strong><small>Courses need a recorded editorial review, complete lesson content, and ready assessments before publication.</small></span></div>
          <div><span><strong>Composite scenarios only</strong><small>Real briefs can inspire exercises, but a single client brief should never be lightly anonymized and reused.</small></span></div>
        </div>
      </section>
    </div>
  );
}
