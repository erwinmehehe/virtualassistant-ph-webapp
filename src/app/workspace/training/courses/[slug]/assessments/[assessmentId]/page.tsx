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
import { TrainingCertificateActions } from "@/components/training-certificate-actions";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingAssessment } from "@/lib/training";
import {
  buildAssessmentQuestions,
  publicAssessmentQuestions,
} from "@/lib/training-integrity";

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
  searchParams: Promise<{ result?: string }>;
}) {
  const { slug, assessmentId } = await params;
  const query = await searchParams;
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

  const questions =
    lessonsComplete && !passed && !retryLocked
      ? publicAssessmentQuestions(
          buildAssessmentQuestions({
            course,
            assessmentId: assessment.id,
            userId,
            attemptNumber,
            questionCount: 8,
          }),
        )
      : [];

  const missedLessonIds = Array.isArray(latest?.response?.missed_lesson_ids)
    ? latest.response.missed_lesson_ids.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const missedLessons = course.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => missedLessonIds.includes(lesson.id));

  return (
    <div className="dash-page role-overview training-home training-assessment-page">
      <Link className="btn btn-sm" href={courseHref}>
        <ArrowLeft size={14}/> {course.title}
      </Link>

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
        <div className="dash-kicker">Automatic final assessment</div>
        <h1>{assessment.title}</h1>
        <p>
          Practical work is completed inside the lessons. This final check confirms that you
          understood the course QA standards before a certificate is issued.
        </p>
        <div className="row wrap">
          <span className="badge"><ShieldCheck size={13}/> Server-scored</span>
          <span className="badge"><RefreshCw size={13}/> Randomized each attempt</span>
          <span className="badge">Pass score {passScore}%</span>
          <span className="badge">Up to 3 attempts / 24h</span>
          <span className={`badge ${lessonsComplete ? "badge-success" : ""}`}>
            {lessonsComplete
              ? "Lessons complete"
              : `${course.completedLessons}/${course.lessonCount} lessons complete`}
          </span>
        </div>
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>How the final check works</h2>
            <p>No answer key is revealed after a failed attempt.</p>
          </div>
        </div>
        <div className="compact-list">
          <div>
            <span>
              <strong>Questions come from this course</strong>
              <small>Each attempt samples lesson-specific QA standards from the material you completed.</small>
            </span>
          </div>
          <div>
            <span>
              <strong>Questions and option order change</strong>
              <small>Refreshing after a submitted attempt produces a new mix based on the next attempt number.</small>
            </span>
          </div>
          <div>
            <span>
              <strong>Failed attempts point back to lessons</strong>
              <small>You will see which lessons to review, not which answer was correct.</small>
            </span>
          </div>
          <div>
            <span>
              <strong>Passing is automatic</strong>
              <small>When you meet the pass score, course completion and the certificate are issued immediately.</small>
            </span>
          </div>
        </div>
      </section>

      {latest ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head">
            <div>
              <h2>{passed ? "Final check passed" : "Latest attempt"}</h2>
              <p>Attempt {attemptState.total}</p>
            </div>
            <span className={`badge ${passed ? "badge-success" : failed ? "badge-warning" : ""}`}>
              {passed ? "Passed" : latest.score !== null ? `${latest.score}%` : latest.status}
            </span>
          </div>

          {latest.score !== null ? (
            <p><strong>Score:</strong> {latest.score}% · Pass score {passScore}%</p>
          ) : null}

          {latest.feedback ? (
            <div className={passed ? "success-banner" : "notice"}>
              <p style={{ margin: 0 }}>{latest.feedback}</p>
            </div>
          ) : null}

          {!passed && missedLessons.length ? (
            <div className="training-assessment-review-lessons">
              <strong>Review these lessons</strong>
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

          {query.result === "failed" && !passed ? (
            <p className="notice">Your attempt was scored. Review the listed lessons before trying the new question mix below.</p>
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
        <section className="card dashboard-section-card">
          <h2>Review before another attempt</h2>
          <p className="muted">
            You have used three attempts in the last 24 hours. This prevents brute-force guessing.
            {retryAt ? ` You can try again after ${retryAt}.` : ""}
          </p>
          <Link className="btn" href={courseHref}>Review course lessons</Link>
        </section>
      ) : null}

      {lessonsComplete && !passed && !retryLocked && questions.length ? (
        <section className="card dashboard-section-card training-assessment-submit">
          <div className="dashboard-section-head">
            <div>
              <h2>Attempt {attemptNumber}</h2>
              <p>Choose the best answer for each course scenario. All questions are required.</p>
            </div>
            <span className="badge">{questions.length} questions</span>
          </div>

          <form action={submitTrainingAssessmentAction} className="stack">
            <input type="hidden" name="course_slug" value={course.slug}/>
            <input type="hidden" name="assessment_id" value={assessment.id}/>
            <input type="hidden" name="attempt_number" value={attemptNumber}/>

            <div className="training-auto-assessment-questions">
              {questions.map((question, index) => (
                <fieldset className="training-auto-question" key={question.id}>
                  <legend>
                    <span className="small muted">Question {index + 1} · {question.lessonTitle}</span>
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

            <div>
              <button
                className="btn btn-primary"
                type="submit"
                data-track="training_assessment_submit_click"
              >
                <CheckCircle2 size={15}/> Submit final check
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {passed && course.completedAt ? (
        <section className="card training-completion-card">
          <div className="training-completion-icon"><Award size={22}/></div>
          <div className="training-completion-copy">
            <div className="dash-kicker">Course complete</div>
            <h2>{course.title}</h2>
            <p>You passed the automatic final check. Your certificate is ready.</p>

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
              <Link className={credentialHref ? "btn" : "btn btn-primary"} href="/workspace/training">
                My learning
              </Link>
            </div>
          </div>
        </section>
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
