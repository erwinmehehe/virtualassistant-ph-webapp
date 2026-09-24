import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingCourse } from "@/lib/training";
import { startTrainingCourseAction } from "@/app/actions/training";

function reviewedLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Last reviewed ${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(date)}`;
}

export default async function TrainingCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await requireAuthenticatedUserFast(`/workspace/training/courses/${slug}`);
  const { course, error } = await getTrainingCourse(slug, userId);
  if (!course && !error) notFound();

  if (!course) {
    return <div className="dash-page"><section className="card dashboard-section-card"><h1>Course unavailable</h1><p className="muted">We could not load this course right now.</p><Link className="btn" href="/workspace/training">Back to My learning</Link></section></div>;
  }

  const orderedLessons = course.modules.flatMap((module) => module.lessons);
  const nextLesson = orderedLessons.find((lesson) => !lesson.completed) || null;
  const nextAssessment = course.assessments.find((assessment) => {
    const latest = assessment.latestSubmission || null;
    return !(
      latest?.status === "reviewed" &&
      (assessment.pass_score === null ||
        (latest.score !== null && Number(latest.score) >= assessment.pass_score))
    );
  }) || null;
  const credentialHref = course.certificate
    ? `/training/certificates/${course.certificate.credential_code}`
    : null;
  const assessmentInReview = nextAssessment?.latestSubmission?.status === "submitted";
  const reviewLabel = reviewedLabel(course.last_reviewed_at);

  return (
    <div className="dash-page role-overview training-home training-course-page">
      <Link className="btn btn-sm" href="/workspace/training"><ArrowLeft size={14}/> My learning</Link>

      <section className="card dashboard-section-card">
        <div className="dash-kicker">{course.category}{course.country_focus ? ` · ${course.country_focus}` : ""}</div>
        <h1>{course.title}</h1>
        <p>{course.summary}</p>

        <div className="row wrap">
          <span className="badge"><Clock3 size={13}/> {course.lessonCount} lessons</span>
          {reviewLabel ? <span className="badge">{reviewLabel}</span> : null}
          {course.reviewed_by ? <span className="badge">Reviewed by {course.reviewed_by}</span> : null}
        </div>

        {course.trademark_disclaimer ? <div className="notice" role="note"><strong>About this course.</strong> {course.trademark_disclaimer}</div> : null}

        <div className="row-between" style={{ marginTop: 18 }}>
          <div>
            <strong>{course.progressPercent}% complete</strong>
            <div className="small muted">{course.completedLessons} of {course.lessonCount} lessons</div>
          </div>
          {!course.enrolled ? (
            <form action={startTrainingCourseAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <button className="btn btn-primary" type="submit" data-track="training_course_start_click">Start course</button>
            </form>
          ) : course.completedAt && credentialHref ? (
            <Link className="btn btn-primary" href={credentialHref}>View certificate <ArrowRight size={14}/></Link>
          ) : nextLesson ? (
            <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/lessons/${nextLesson.id}`}>Continue lesson <ArrowRight size={14}/></Link>
          ) : nextAssessment && !assessmentInReview ? (
            <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/assessments/${nextAssessment.id}`}>Start assessment <ArrowRight size={14}/></Link>
          ) : assessmentInReview ? (
            <span className="badge">Assessment in review</span>
          ) : course.completedAt ? (
            <div className="row wrap">
              <span className="badge">Certificate preparing</span>
              <Link className="btn" href="/workspace/training">My learning</Link>
            </div>
          ) : (
            <Link className="btn" href="/workspace/training">My learning</Link>
          )}
        </div>
        <div className="progress" aria-label={`${course.progressPercent}% complete`}><span style={{ width: `${course.progressPercent}%` }}/></div>
      </section>

      {course.modules.map((module) => (
        <section className="card dashboard-section-card" key={module.id}>
          <div className="dashboard-section-head">
            <div>
              <span className="small">Module {module.position}</span>
              <h2>{module.title}</h2>
              {module.summary ? <p>{module.summary}</p> : null}
            </div>
          </div>
          <div className="dash-actions">
            {module.lessons.map((lesson) => (
              <Link className="dash-action" href={`/workspace/training/courses/${course.slug}/lessons/${lesson.id}`} key={lesson.id} data-track="training_lesson_open">
                <span className="dash-action-count">{lesson.completed ? <CheckCircle2 size={18}/> : lesson.position}</span>
                <span className="dash-action-copy">
                  <span className="dash-action-title"><strong>{lesson.title}</strong></span>
                  <small>{lesson.summary || "Detailed lesson with examples and practical application."}</small>
                  <small className="muted">{lesson.estimated_minutes} min</small>
                </span>
                <ArrowRight size={16}/>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {course.assessments.length ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head"><div><h2>Assessment</h2><p>Complete the course work, then use the assessment to show how you would apply it.</p></div></div>
          <div className="dash-actions">
            {course.assessments.map((assessment) => {
              const latest = assessment.latestSubmission || null;
              const passed = latest?.status === "reviewed" &&
                (assessment.pass_score === null || (latest.score !== null && Number(latest.score) >= assessment.pass_score));
              const status = passed
                ? "Passed"
                : latest?.status === "needs_revision"
                  ? "Needs revision"
                  : latest?.status === "submitted"
                    ? "In review"
                    : "Not submitted";
              return (
                <Link
                  className="dash-action"
                  href={`/workspace/training/courses/${course.slug}/assessments/${assessment.id}`}
                  key={assessment.id}
                  data-track="training_assessment_open"
                >
                  <span className="dash-action-count">{passed ? <CheckCircle2 size={18}/> : <FileCheck2 size={17}/>}</span>
                  <span className="dash-action-copy">
                    <span className="dash-action-title"><strong>{assessment.title}</strong></span>
                    <small>{assessment.assessment_type === "practical" ? "Practical work simulation" : "Knowledge check"} · {status}</small>
                  </span>
                  <ArrowRight size={16}/>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
