import Link from "next/link";
import { Activity, BookOpenCheck, Clock3, FileCheck2, GraduationCap, Plus, RefreshCcw, ShieldCheck, TimerReset } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingAdminSummary } from "@/lib/training";
import { getTrainingReminderOutcomes } from "@/lib/training-reminder-outcomes-server";
import { setTrainingLearningPathStatusAction } from "@/app/actions/training-admin";

function reviewState(value: string | null) {
  if (!value) return "Review not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Review not recorded";
  const ageDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return ageDays > 180 ? `Review due · ${ageDays}d` : `Reviewed ${new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(date)}`;
}

export default async function AdminTrainingPage() {
  const [summary, reminderOutcomes] = await Promise.all([
    getTrainingAdminSummary(),
    getTrainingReminderOutcomes(),
  ]);
  const { courses, paths, totals, funnel, recovery, completionHealth, cohortConversion, lessonBottlenecks, integrity, error } = summary;

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Learning system"
        title="Training"
        subtitle={<>Manage the free learning library separately from hiring. Published lessons are private to signed-in learners and remain out of search indexing.</>}
        actions={<><Link className="dash-btn" href="/workspace/admin/training/activation">Account activation</Link><Link className="dash-btn" href="/workspace/admin/training/new"><Plus size={15}/> New course</Link><Link className="dash-btn" href="/workspace/training">Open learner view</Link></>}
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
        <section className="card dashboard-section-card training-recovery-analytics">
          <div className="dashboard-section-head">
            <div>
              <h2>Stalled learner recovery</h2>
              <p>Incomplete course enrolments are nudged only after {recovery.inactivityHours} hours without training activity. The automation sends at most two reminders per course and stops automatically after the learner resumes or completes the course.</p>
            </div>
            <span className="badge"><RefreshCcw size={13}/> Recovery</span>
          </div>
          <div className="va-status-grid">
            <div className="status-summary-card">
              <div className="row-between"><span>Incomplete</span><BookOpenCheck size={18}/></div>
              <strong>{recovery.incompleteEnrollments}</strong>
              <small>Current incomplete course enrolments</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Stalled 72h+</span><TimerReset size={18}/></div>
              <strong>{recovery.stalled72h}</strong>
              <small>Eligible for a resume nudge</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Stalled 7d+</span><Clock3 size={18}/></div>
              <strong>{recovery.stalled7d}</strong>
              <small>Needs the one follow-up reminder</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Reminder records</span><Activity size={18}/></div>
              <strong>{recovery.remindersSent}</strong>
              <small>Logged in-app reminders; email delivery is not guaranteed</small>
            </div>
          </div>
          <div className="notice">
            <strong>Conservative by design</strong>
            <p>Resume emails use the Product Emails preference, respect suppression lists and email quota, and never send more than two reminders for the same learner and course.</p>
          </div>
        </section>
      ) : null}

      {!error ? (
        <section className="card dashboard-section-card training-reminder-outcomes" aria-labelledby="training-reminder-outcomes-title">
          <div className="dashboard-section-head">
            <div>
              <h2 id="training-reminder-outcomes-title">What happens after a learning reminder?</h2>
              <p>Track meaningful saved progress after a recorded reminder, not clicks or email opens. Seven-day lesson progress and fourteen-day course completion use only follow-ups old enough to observe the full period.</p>
            </div>
            <span className="badge"><Activity size={13}/> Observed outcomes</span>
          </div>
          {!reminderOutcomes.available ? (
            <div className="notice" role="status">
              <strong>Reminder outcomes unavailable</strong>
              <p>{reminderOutcomes.reason} Incomplete results are not displayed.</p>
            </div>
          ) : (
            <>
              <div className="va-status-grid">
                <div className="status-summary-card">
                  <div className="row-between"><span>Learners reminded</span><GraduationCap size={18}/></div>
                  <strong>{reminderOutcomes.learnersNudged}</strong>
                  <small>{reminderOutcomes.nudgedEnrollments} learner–course follow-ups</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Reminder events logged</span><RefreshCcw size={18}/></div>
                  <strong>{reminderOutcomes.remindersLogged}</strong>
                  <small>Recorded in-app reminders, not confirmed emails</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Progress within 7 days</span><BookOpenCheck size={18}/></div>
                  <strong>{reminderOutcomes.sevenDay.rate === null ? "Not yet" : reminderOutcomes.sevenDay.rate + "%"}</strong>
                  <small>{reminderOutcomes.sevenDay.reached} of {reminderOutcomes.sevenDay.eligible} mature follow-ups completed a lesson or course</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Course completed within 14 days</span><FileCheck2 size={18}/></div>
                  <strong>{reminderOutcomes.fourteenDay.rate === null ? "Not yet" : reminderOutcomes.fourteenDay.rate + "%"}</strong>
                  <small>{reminderOutcomes.fourteenDay.reached} of {reminderOutcomes.fourteenDay.eligible} follow-ups old enough to measure</small>
                </div>
              </div>
              {reminderOutcomes.courses.length ? (
                <>
                  <div className="dashboard-section-head">
                    <div>
                      <h3>Observed course progress after reminders</h3>
                      <p>Review courses with mature follow-ups first. Small cohorts may vary considerably.</p>
                    </div>
                  </div>
                  <div className="compact-list">
                    {reminderOutcomes.courses.slice(0, 8).map(course => (
                      <div key={course.id}>
                        <span>
                          <strong>{course.title}</strong>
                          <small>{course.nudged} course follow-ups · 7-day lesson/course progress: {course.sevenDay.reached}/{course.sevenDay.eligible} · 14-day course completions: {course.fourteenDay.reached}/{course.fourteenDay.eligible}</small>
                        </span>
                        <span className="badge">{course.sevenDay.rate === null ? "Collecting data" : course.sevenDay.rate + "% at 7d"}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dashboard-caught-up"><RefreshCcw size={22}/><div><strong>No follow-ups measured yet.</strong><p>Outcome windows begin when reminder records exist.</p></div></div>
              )}
              <div className="notice">
                <strong>How to interpret these numbers</strong>
                <p>Results use the most recent logged reminder for each learner and course. A seven-day result means a lesson or course was completed afterward; a fourteen-day result means the course was finished. These are time-associated outcomes, not evidence the reminder caused the improvement. The reminder record does not confirm email delivery.</p>
              </div>
            </>
          )}
        </section>
      ) : null}

      {!error ? (
        <section className="card dashboard-section-card training-completion-health" aria-labelledby="course-completion-health-title">
          <div className="dashboard-section-head">
            <div>
              <h2 id="course-completion-health-title">Where learners get stuck</h2>
              <p>All-time learner–course enrolment snapshot from saved progress, activity and final checks. Each course counts once per learner. This is not a same-age conversion cohort, and newer enrolments have had less time to finish.</p>
            </div>
            <span className="badge"><BookOpenCheck size={13}/> Course health</span>
          </div>
          {!completionHealth.available ? (
            <div className="notice" role="status">
              <strong>Completion data temporarily unavailable</strong>
              <p>{completionHealth.reason} No partial totals are shown.</p>
            </div>
          ) : (
            <>
              <div className="va-status-grid">
                <div className="status-summary-card">
                  <div className="row-between"><span>Course enrolments</span><BookOpenCheck size={18}/></div>
                  <strong>{completionHealth.totals.enrolled}</strong>
                  <small>Unique learner–course combinations</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Completed</span><GraduationCap size={18}/></div>
                  <strong>{completionHealth.totals.completed} <small>({completionHealth.totals.completionRate}%)</small></strong>
                  <small>Courses marked completed, all time</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Inactive 7 days</span><TimerReset size={18}/></div>
                  <strong>{completionHealth.totals.stalled7d}</strong>
                  <small>{completionHealth.totals.notEngaged7d} without recorded lesson engagement</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>At final step</span><FileCheck2 size={18}/></div>
                  <strong>{completionHealth.totals.finalStep}</strong>
                  <small>All published lessons done; course still incomplete</small>
                </div>
              </div>
              <div className="notice">
                <strong>Final-check follow-through</strong>
                <p>{completionHealth.totals.awaitingReview} incomplete enrolment{completionHealth.totals.awaitingReview === 1 ? "" : "s"} awaiting assessment review, {completionHealth.totals.needsRevision} needing revision, and {completionHealth.totals.oneLessonLeft} with one published lesson left. These groups can overlap with stalled or final-step counts.</p>
              </div>
              <div className="dashboard-section-head">
                <div>
                  <h3>Course-level completion bottlenecks</h3>
                  <p>Ranked by inactive learners, then unfinished final steps. Inspect course content before changing reminder frequency.</p>
                </div>
              </div>
              {completionHealth.courses.length ? (
                <div className="compact-list training-health-course-list">
                  {completionHealth.courses.slice(0, 10).map((item) => (
                    <div key={item.id}>
                      <span>
                        <Link href={`/workspace/admin/training/${item.id}`}><strong>{item.title}</strong></Link>
                        <small>{item.enrolled} enrolled · {item.engaged} engaged · {item.completed} completed · {item.stalled7d} inactive 7d+</small>
                        <small>{item.notEngaged7d} without lesson engagement · {item.oneLessonLeft} one lesson left · {item.finalStep} at final step · {item.awaitingReview} awaiting review · {item.needsRevision} need revision</small>
                        {item.enrolled < 5 ? <small>Small sample — avoid drawing course-wide conclusions.</small> : null}
                      </span>
                      <span className="badge">{item.completionRate}% completed</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-caught-up">
                  <GraduationCap size={22}/>
                  <div><strong>No enrolments yet</strong><p>Course bottlenecks will appear once learners start published courses.</p></div>
                </div>
              )}
              <p className="muted">Aggregated administrator-only data. Progress is measured against currently published lessons; curriculum changes can alter remaining-lesson counts. No learner names or email addresses appear in this report.</p>
            </>
          )}
        </section>
      ) : null}

      {!error ? (
        <section className="card dashboard-section-card training-lesson-bottlenecks" aria-labelledby="lesson-bottleneck-title">
          <div className="dashboard-section-head">
            <div>
              <h2 id="lesson-bottleneck-title">Next-lesson bottlenecks</h2>
              <p>See the first unfinished published lesson holding up each incomplete course enrolment. Ranked by inactive learners, then total waiting. Use this to review lesson clarity and sequencing before increasing reminders.</p>
            </div>
            <span className="badge"><BookOpenCheck size={13}/> Lesson steps</span>
          </div>
          {!lessonBottlenecks.available ? (
            <div className="notice" role="status">
              <strong>Lesson bottleneck data temporarily unavailable</strong>
              <p>{lessonBottlenecks.reason} Partial lesson counts are never shown.</p>
            </div>
          ) : (
            <>
              <div className="va-status-grid">
                <div className="status-summary-card">
                  <div className="row-between"><span>Unfinished enrolments</span><BookOpenCheck size={18}/></div>
                  <strong>{lessonBottlenecks.totals.unfinishedEnrollments}</strong>
                  <small>All published courses with an incomplete enrolment</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Waiting on a lesson</span><FileCheck2 size={18}/></div>
                  <strong>{lessonBottlenecks.totals.withNextLesson}</strong>
                  <small>Other learners may be at their final assessment</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Inactive {lessonBottlenecks.inactivityDays}d+</span><TimerReset size={18}/></div>
                  <strong>{lessonBottlenecks.totals.stalled7d}</strong>
                  <small>Waiting on a lesson without recent saved training activity</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>No active engagement recorded</span><Clock3 size={18}/></div>
                  <strong>{lessonBottlenecks.totals.noRecordedEngagement}</strong>
                  <small>May include recent enrolments; not all are inactive</small>
                </div>
              </div>
              {lessonBottlenecks.lessons.length ? (
                <div className="compact-list training-lesson-bottleneck-list">
                  {lessonBottlenecks.lessons.slice(0, 12).map((item) => (
                    <div key={item.lessonId}>
                      <span>
                        <Link href={`/workspace/admin/training/${item.courseId}`}><strong>{item.lessonTitle}</strong></Link>
                        <small>{item.courseTitle} · Lesson {item.lessonNumber} of {item.totalLessons}</small>
                        <small>{item.waiting} waiting · {item.stalled7d} inactive {lessonBottlenecks.inactivityDays}d+ · {item.noRecordedEngagement} without recorded active engagement</small>
                        {item.waiting < 5 ? <small>Small sample — inspect before making course-wide changes.</small> : null}
                      </span>
                      <span className="badge">{item.stalled7d} inactive</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-caught-up">
                  <BookOpenCheck size={22}/>
                  <div><strong>No published lessons currently blocking progress</strong><p>Learners may be at final assessments or all active lessons may be complete.</p></div>
                </div>
              )}
              <p className="muted">Aggregated administrator-only metrics. Each learner–course enrolment appears against only its next unfinished published lesson, never against every remaining lesson. Course revisions can change the ranking. No learner names, emails, or automatic outreach.</p>
            </>
          )}
        </section>
      ) : null}

      {!error ? (
        <section className="card dashboard-section-card training-cohort-analytics" aria-labelledby="course-cohort-title">
          <div className="dashboard-section-head">
            <div>
              <h2 id="course-cohort-title">Completion within 7 and 14 days</h2>
              <p>Starts from the last {cohortConversion.lookbackDays} days. Each rate includes only learners whose full 7- or 14-day window has elapsed. This avoids classifying new enrolments as failed completions.</p>
            </div>
            <span className="badge"><Clock3 size={13}/> Age-matched cohorts</span>
          </div>
          {!cohortConversion.available ? (
            <div className="notice" role="status">
              <strong>Cohort rates temporarily unavailable</strong>
              <p>{cohortConversion.reason} Partial enrolments are not counted.</p>
            </div>
          ) : (
            <>
              <div className="va-status-grid">
                <div className="status-summary-card">
                  <div className="row-between"><span>Completed within 7 days</span><GraduationCap size={18}/></div>
                  <strong>{cohortConversion.totals.sevenDay.rate === null ? "No mature starts" : `${cohortConversion.totals.sevenDay.rate}%`}</strong>
                  <small>{cohortConversion.totals.sevenDay.completed} of {cohortConversion.totals.sevenDay.eligible} eligible course starts</small>
                </div>
                <div className="status-summary-card">
                  <div className="row-between"><span>Completed within 14 days</span><BookOpenCheck size={18}/></div>
                  <strong>{cohortConversion.totals.fourteenDay.rate === null ? "No mature starts" : `${cohortConversion.totals.fourteenDay.rate}%`}</strong>
                  <small>{cohortConversion.totals.fourteenDay.completed} of {cohortConversion.totals.fourteenDay.eligible} eligible course starts</small>
                </div>
              </div>
              <div className="dashboard-section-head">
                <div>
                  <h3>Courses to review for completion</h3>
                  <p>Courses with at least five mature 14-day starts are ordered by lowest 14-day completion rate. Open a course to review onboarding, lesson sequence or the final check before changing reminders.</p>
                </div>
              </div>
              {cohortConversion.courses.length ? (
                <div className="compact-list training-cohort-course-list">
                  {cohortConversion.courses.slice(0, 10).map((item) => (
                    <div key={item.id}>
                      <span>
                        <Link href={`/workspace/admin/training/${item.id}`}><strong>{item.title}</strong></Link>
                        <small>7-day: {item.sevenDay.completed}/{item.sevenDay.eligible} completed ({item.sevenDay.rate === null ? "not yet measurable" : `${item.sevenDay.rate}%`})</small>
                        <small>14-day: {item.fourteenDay.completed}/{item.fourteenDay.eligible} completed ({item.fourteenDay.rate === null ? "not yet measurable" : `${item.fourteenDay.rate}%`})</small>
                        {item.fourteenDay.eligible < 5 ? <small>Small or immature 14-day sample — interpret cautiously.</small> : null}
                      </span>
                      <span className="badge">{item.fourteenDay.rate === null ? "No 14-day cohort" : `${item.fourteenDay.rate}% in 14d`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-caught-up">
                  <Clock3 size={22}/>
                  <div><strong>Not enough enrolment history</strong><p>Recent published courses will appear after the first full 7-day measurement window.</p></div>
                </div>
              )}
              <p className="muted">Seven-day and 14-day rates have different eligible denominators. Completion after the window is excluded from that window but still counts in the all-time report above. One learner taking two courses counts as two course starts. Administrator-only aggregates; no learner identities.</p>
            </>
          )}
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

          <div className="va-status-grid" style={{ marginTop: 16 }}>
            <div className="status-summary-card">
              <div className="row-between"><span>Avg. final score</span><FileCheck2 size={18}/></div>
              <strong>{integrity.automaticFinalAttempts ? integrity.averageFinalScore + "%" : "No data"}</strong>
              <small>{integrity.automaticFinalAttempts} automatic final attempt{integrity.automaticFinalAttempts === 1 ? "" : "s"}</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Critical misses</span><ShieldCheck size={18}/></div>
              <strong>{integrity.criticalBoundaryMisses}</strong>
              <small>Authority-boundary questions missed</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>Answer-pattern flags</span><Activity size={18}/></div>
              <strong>{integrity.answerPatternFlags}</strong>
              <small>Telemetry only, never an automatic cheating verdict</small>
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
          <div><span><strong>Editorial QA before release</strong><small>Every course needs a recorded editorial review, complete lesson content, and ready assessments before publication.</small></span></div>
          <div><span><strong>Composite scenarios only</strong><small>Real briefs can inspire exercises, but a single client brief should never be lightly anonymized and reused.</small></span></div>
        </div>
      </section>
    </div>
  );
}
