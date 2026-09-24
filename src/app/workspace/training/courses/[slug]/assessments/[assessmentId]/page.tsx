import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { submitTrainingAssessmentAction } from "@/app/actions/training";
import { updateTrainingCertificateVisibilityAction } from "@/app/actions/training-credentials";
import { TrainingCertificateActions } from "@/components/training-certificate-actions";
import { TrainingNextSteps } from "@/components/training-next-steps";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingAssessment, getTrainingDashboard } from "@/lib/training";
import { recommendNextTrainingCourses } from "@/lib/training-recommendations";
import {
  assessmentQuestionSetKey,
  buildAssessmentQuestions,
  publicAssessmentQuestions,
} from "@/lib/training-integrity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function retryLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TrainingAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; assessmentId: string }>;
  searchParams: Promise<{ result?: string; assessment_error?: string }>;
}) {
  const { slug, assessmentId } = await params;
  const query = await searchParams;
  const assessmentErrorCopy: Record<string, string> = {
    lessons: "Complete every published lesson before taking the final check.",
    stale: "This attempt is out of date. The final has been refreshed with your current attempt.",
    limit: "You have used three attempts in the current 24-hour window. Review the lessons and try again when the next attempt opens.",
    not_ready: "This final check is temporarily unavailable because there are not enough valid questions yet.",
    question_set: "This question set is no longer valid for your current attempt. The final has been refreshed safely.",
  };
  const assessmentError = query.assessment_error
    ? assessmentErrorCopy[query.assessment_error] || null
    : null;
  const { userId } = await requireAuthenticatedUserFast(
    `/workspace/training/courses/${slug}/assessments/${assessmentId}`,
  );
  const { course, assessment, attemptState, error } = await getTrainingAssessment(
    slug,
    assessmentId,
    userId,
  );
  if ((!course || !assessment) && !error) notFound();

  if (!course || !assessment) {
    return (
      <div className="dash-page">
        <section className="card dashboard-section-card">
          <h1>Assessment unavailable</h1>
          <p className="muted">This assessment could not be loaded.</p>
          <Link className="btn" href="/workspace/training">Back to training</Link>
        </section>
      </div>
    );
  }

  const latest = assessment.latestSubmission || null;
  const lessonsComplete =
    course.lessonCount > 0 && course.completedLessons === course.lessonCount;
  const passScore = assessment.pass_score ?? 80;
  const passed =
    latest?.status === "reviewed" &&
    latest.score !== null &&
    Number(latest.score) >= passScore;
  const failed = latest?.status === "needs_revision";
  const courseHref = `/workspace/training/courses/${course.slug}`;
  const credentialHref = course.certificate
    ? `/training/certificates/${course.certificate.credential_code}`
    : null;

  const attemptNumber = attemptState.total + 1;
  const retryAt = retryLabel(attemptState.retryAt);
  const retryLocked = !passed && attemptState.last24Hours >= 3 && Boolean(attemptState.retryAt);

  const generatedQuestions =
    lessonsComplete && !passed && !retryLocked
      ? buildAssessmentQuestions({
          course,
          assessmentId: assessment.id,
          userId,
          attemptNumber,
          questionCount: 8,
        })
      : [];
  const questionSetKey = generatedQuestions.length
    ? assessmentQuestionSetKey(generatedQuestions)
    : "";
  const questions = publicAssessmentQuestions(generatedQuestions);

  const missedLessonIds = Array.isArray(latest?.response?.missed_lesson_ids)
    ? latest.response.missed_lesson_ids.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const missedLessons = course.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => missedLessonIds.includes(lesson.id));

  const completionDashboard =
    passed && course.completedAt
      ? await getTrainingDashboard(userId)
      : null;
  const completionRecommendations =
    completionDashboard
      ? recommendNextTrainingCourses({
          courses: completionDashboard.courses,
          currentSlug: course.slug,
          primaryCategory: completionDashboard.learnerProfile?.primaryCategory || null,
          australiaSpecialization:
            completionDashboard.learnerPreferences?.australiaSpecialization || null,
          limit: 3,
        })
      : null;

  return (
    <div className="dash-page role-overview training-home training-assessment-page">
      <Link className="btn btn-sm" href={courseHref}>
        <ArrowLeft size={14}/> {course.title}
      </Link>

      {assessmentError ? (
        <div className="alert" role="alert">
          {assessmentError}
        </div>
      ) : null}

      <section className="card training-assessment-journey" aria-label="Course completion steps">
        <div className={`training-assessment-step ${lessonsComplete ? "is-complete" : "is-current"}`}>
          <span>{lessonsComplete ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>}</span>
          <div>
            <strong>Lessons</strong>
            <small>{course.completedLessons} of {course.lessonCount}</small>
          </div>
        </div>
        <div className={`training-assessment-step ${passed ? "is-complete" : lessonsComplete ? "is-current" : ""}`}>
          <span>{passed ? <CheckCircle2 size={14}/> : <FileCheck2 size={14}/>}</span>
          <div>
            <strong>Final check</strong>
            <small>{passed ? "Passed" : failed ? "Review and retry" : "Ready"}</small>
          </div>
        </div>
        <div className={`training-assessment-step ${credentialHref ? "is-complete" : ""}`}>
          <span>{credentialHref ? <CheckCircle2 size={14}/> : <Award size={14}/>}</span>
          <div>
            <strong>Certificate</strong>
            <small>{credentialHref ? "Issued" : "After passing"}</small>
          </div>
        </div>
      </section>

      <section className="card dashboard-section-card training-assessment-hero">
        <div className="dash-kicker">Final check</div>
        <h1>{assessment.title}</h1>
        <p>
          Answer {questions.length || 8} questions based on the course. Pass once and your
          certificate is issued automatically.
        </p>
        <div className="training-assessment-meta">
          <span><FileCheck2 size={14}/> {questions.length || 8} questions</span>
          <span><ShieldCheck size={14}/> Pass {passScore}%</span>
          <span><RefreshCw size={14}/> Fresh mix each attempt</span>
          <span className={lessonsComplete ? "is-ready" : ""}>
            <CheckCircle2 size={14}/> {lessonsComplete
              ? "Lessons complete"
              : `${course.completedLessons}/${course.lessonCount} lessons complete`}
          </span>
        </div>
        <p className="training-assessment-attempt-note">
          You can make up to 3 attempts in a rolling 24-hour period. A passing score still requires the authority-boundary question to be correct.
        </p>
      </section>

      <section className="card dashboard-section-card training-assessment-guide">
        <div>
          <span><FileCheck2 size={17}/></span>
          <div>
            <strong>Course-based questions</strong>
            <p>Each question comes from material you already completed.</p>
          </div>
        </div>
        <div>
          <span><RefreshCw size={17}/></span>
          <div>
            <strong>Useful retry guidance</strong>
            <p>If you miss the pass score, you will see which lessons to review before a fresh question mix.</p>
          </div>
        </div>
        <div>
          <span><Award size={17}/></span>
          <div>
            <strong>Certificate after passing</strong>
            <p>Passing completes the course and issues your certificate automatically.</p>
          </div>
        </div>
        <p className="training-assessment-guide-note">The answer key is not shown after a failed attempt.</p>
      </section>

      {latest ? (
        <section className={`card dashboard-section-card training-assessment-result ${passed ? "is-passed" : "is-review"}`}>
          <div className="dashboard-section-head">
            <div>
              <div className="dash-kicker">{passed ? "Passed" : "Latest result"}</div>
              <h2>{passed ? "Final check complete" : "Review and try again"}</h2>
              <p>Attempt {attemptState.total}{latest.score !== null ? ` · ${latest.score}% score` : ""} · Pass {passScore}%</p>
            </div>
            <span className={`badge ${passed ? "badge-success" : failed ? "badge-warning" : ""}`}>
              {passed ? "Passed" : latest.score !== null ? `${latest.score}%` : latest.status}
            </span>
          </div>

          {latest.feedback ? (
            <div className={passed ? "success-banner" : "notice"}>
              <p style={{ margin: 0 }}>{latest.feedback}</p>
            </div>
          ) : null}

          {!passed && missedLessons.length ? (
            <div className="training-assessment-review-lessons">
              <strong>Review these lessons before your next attempt</strong>
              <p>Focus on these topics, then come back for a fresh question mix.</p>
              <div className="training-assessment-review-links">
                {missedLessons.map((lesson) => (
                  <Link
                    className="btn btn-sm"
                    href={`${courseHref}/lessons/${lesson.id}`}
                    key={lesson.id}
                  >
                    {lesson.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {query.result === "failed" && !passed && !retryLocked ? (
            <div className="training-assessment-result-actions">
              {missedLessons[0] ? (
                <Link className="btn" href={`${courseHref}/lessons/${missedLessons[0].id}`}>
                  Review first lesson
                </Link>
              ) : null}
              <Link className="btn btn-primary" href="#final-check-questions">Try again</Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {!lessonsComplete ? (
        <section className="card dashboard-section-card">
          <h2>Complete the lessons first</h2>
          <p className="muted">
            The final check unlocks after all {course.lessonCount} lessons are complete.
            You have completed {course.completedLessons}.
          </p>
          <Link className="btn" href={courseHref}>Back to lessons</Link>
        </section>
      ) : null}

      {retryLocked && !passed ? (
        <section className="card dashboard-section-card training-assessment-retry-lock">
          <div className="dash-kicker">Next attempt</div>
          <h2>Use this time to review</h2>
          <p>
            You have reached the 3-attempt limit for the current 24-hour window.
            {retryAt ? ` Your next attempt opens after ${retryAt}.` : ""}
          </p>
          <Link className="btn btn-primary" href={missedLessons[0] ? `${courseHref}/lessons/${missedLessons[0].id}` : courseHref}>
            Review lessons
          </Link>
        </section>
      ) : null}

      {lessonsComplete && !passed && !retryLocked && questions.length ? (
        <section className="card dashboard-section-card training-assessment-submit" id="final-check-questions">
          <div className="dashboard-section-head">
            <div>
              <div className="dash-kicker">Attempt {attemptNumber}</div>
              <h2>Answer the final check</h2>
              <p>Choose the best response for all {questions.length} questions. Pass {passScore}% to complete the course.</p>
            </div>
            <span className="badge">{questions.length} questions</span>
          </div>

          <form action={submitTrainingAssessmentAction} className="stack">
            <input type="hidden" name="course_slug" value={course.slug}/>
            <input type="hidden" name="assessment_id" value={assessment.id}/>
            <input type="hidden" name="attempt_number" value={attemptNumber}/>
            <input type="hidden" name="question_set_key" value={questionSetKey}/>

            <div className="training-auto-assessment-questions">
              {questions.map((question, index) => (
                <fieldset className="training-auto-question" key={question.id}>
                  <legend>
                    <span className="training-auto-question-meta">Question {index + 1} of {questions.length} · {question.lessonTitle}</span>
                    <strong>{question.prompt}</strong>
                  </legend>
                  <div className="training-auto-question-options">
                    {question.options.map((option) => (
                      <label key={option.id}>
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={option.id}
                          required
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="training-assessment-submit-actions">
              <button
                className="btn btn-primary"
                type="submit"
                data-track="training_assessment_submit_click"
              >
                <CheckCircle2 size={15}/> Submit final check
              </button>
              <span>Results are scored immediately. If you miss the pass score, you will get lesson-level review guidance.</span>
            </div>
          </form>
        </section>
      ) : null}

      {passed && course.completedAt ? (
        <>
          <section className="card training-completion-card">
            <div className="training-completion-icon"><Award size={22}/></div>
            <div className="training-completion-copy">
              <div className="dash-kicker">Course complete</div>
              <h2>{course.title}</h2>
              <p>You passed the final check. Your course is complete and your certificate is ready.</p>

              {course.certificate ? (
                <div className="training-completion-credential">
                  <div>
                    <span className="small muted">Credential code</span>
                    <code>{course.certificate.credential_code}</code>
                  </div>
                  <div className="training-certificate-actions">
                    {credentialHref ? (
                      <TrainingCertificateActions
                        href={credentialHref}
                        courseTitle={course.title}
                      />
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="small muted">Your completion is saved. Refresh if the certificate does not appear immediately.</p>
              )}

              <div className="row wrap training-completion-actions">
                {credentialHref ? (
                  <Link
                    className="btn btn-primary"
                    href={credentialHref}
                    data-track="training_certificate_open"
                  >
                    View certificate
                  </Link>
                ) : null}
                {course.certificate && !course.certificate.publicVisible ? (
                  <form action={updateTrainingCertificateVisibilityAction}>
                    <input type="hidden" name="certificate_id" value={course.certificate.id}/>
                    <input type="hidden" name="public_visible" value="true"/>
                    <input
                      type="hidden"
                      name="return_to"
                      value={`/workspace/training/courses/${course.slug}/assessments/${assessment.id}`}
                    />
                    <button className="btn" type="submit" data-track="training_certificate_profile_add">
                      Show on public profile
                    </button>
                  </form>
                ) : course.certificate?.publicVisible ? (
                  <span className="badge badge-success">Shown on public profile</span>
                ) : null}
                <Link className={credentialHref ? "btn" : "btn btn-primary"} href="/workspace/training">
                  My learning
                </Link>
              </div>
            </div>
          </section>

          {completionRecommendations?.courses.length ? (
            <TrainingNextSteps
              sourceCourseTitle={course.title}
              title={completionRecommendations.title}
              reason={completionRecommendations.reason}
              courses={completionRecommendations.courses}
            />
          ) : null}
        </>
      ) : null}

      {passed && !course.completedAt ? (
        <section className="card dashboard-section-card">
          <h2>Final check passed</h2>
          <p className="muted">Your result is saved. Return to the course overview to finish any remaining course requirement.</p>
          <Link className="btn btn-primary" href={courseHref}>Course overview</Link>
        </section>
      ) : null}
    </div>
  );
}
