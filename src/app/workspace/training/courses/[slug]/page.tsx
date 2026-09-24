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
  const reviewLabel = reviewedLabel(course.last_reviewed_at);

  return (
    <div className="dash-page role-overview training-home training-course-page">
      <Link className="btn btn-sm training-course-back" href="/workspace/training"><ArrowLeft size={14}/> My learning</Link>

      <section className="card dashboard-section-card training-course-hero">
        <div className="dash-kicker">{course.category}{course.country_focus ? ` · ${course.country_focus}` : ""}</div>
        <h1>{course.title}</h1>
        <p className="training-course-summary">{course.summary}</p>

        <div className="row wrap training-course-meta-row">
          <span className="badge"><Clock3 size={13}/> {course.lessonCount} lessons</span>
          {reviewLabel ? <span className="badge">{reviewLabel}</span> : null}
          {course.reviewed_by ? <span className="badge">Reviewed by {course.reviewed_by}</span> : null}
        </div>

        {course.trademark_disclaimer ? <div className="notice" role="note"><strong>About this course.</strong> {course.trademark_disclaimer}</div> : null}

        <div className="row-between training-course-progress-row">
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
            <Link className="btn btn-primary" href={credentialHref} data-track="training_certificate_open">View certificate <ArrowRight size={14}/></Link>
          ) : nextLesson ? (
            <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/lessons/${nextLesson.id}`} data-track="training_course_continue">Continue lesson <ArrowRight size={14}/></Link>
          ) : nextAssessment ? (
            <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/assessments/${nextAssessment.id}`} data-track="training_assessment_open">Start final check <ArrowRight size={14}/></Link>
          ) : course.completedAt ? (
            <div className="row wrap">
              <span className="badge">Certificate preparing</span>
              <Link className="btn" href="/workspace/training">My learning</Link>
            </div>
          ) : (
            <Link className="btn" href="/workspace/training">My learning</Link>
          )}
        </div>
        <div className="progress training-course-progress-bar" aria-label={`${course.progressPercent}% complete`}><span style={{ width: `${course.progressPercent}%` }}/></div>
      </section>

      {course.modules.map((module) => (
        <section className="card dashboard-section-card training-module-card" key={module.id}>
          <div className="dashboard-section-head training-module-head">
            <div>
              <span className="small training-module-label">Module {module.position}</span>
              <h2>{module.title}</h2>
              {module.summary ? <p>{module.summary}</p> : null}
            </div>
          </div>
          <div className="dash-actions training-module-lessons">
            {module.lessons.map((lesson) => {
              const isNextLesson = nextLesson?.id === lesson.id;
              return (
                <Link
                  className={[
                    "dash-action",
                    "training-lesson-row",
                    lesson.completed ? "is-complete" : "",
                    isNextLesson ? "is-next" : "",
                  ].filter(Boolean).join(" ")}
                  href={`/workspace/training/courses/${course.slug}/lessons/${lesson.id}`}
                  key={lesson.id}
                  data-track="training_lesson_open"
                >
                  <span className="dash-action-count training-lesson-index">{lesson.completed ? <CheckCircle2 size={18}/> : lesson.position}</span>
                  <span className="dash-action-copy training-lesson-copy">
                    <span className="dash-action-title"><strong>{lesson.title}</strong></span>
                    <span className="training-lesson-summary">{lesson.summary || "Detailed lesson with examples and practical application."}</span>
                    <span className="training-lesson-meta"><Clock3 size={12}/>{lesson.estimated_minutes} min{isNextLesson ? " · Next lesson" : lesson.completed ? " · Completed" : ""}</span>
                  </span>
                  <ArrowRight className="training-lesson-arrow" size={16}/>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {course.assessments.length ? (
        <section className="card dashboard-section-card training-module-card training-assessment-card">
          <div className="dashboard-section-head training-module-head"><div><h2>Final check</h2><p>Complete every lesson, then pass the randomized automatic knowledge check to receive your certificate.</p></div></div>
          <div className="dash-actions training-module-lessons">
            {course.assessments.map((assessment) => {
              const latest = assessment.latestSubmission || null;
              const passed = latest?.status === "reviewed" &&
                (assessment.pass_score === null || (latest.score !== null && Number(latest.score) >= assessment.pass_score));
              const status = passed
                ? "Passed"
                : latest?.status === "needs_revision"
                  ? "Review and retry"
                  : latest?.status === "submitted"
                    ? "Processing"
                    : "Not attempted";
              return (
                <Link
                  className="dash-action training-lesson-row training-assessment-row"
                  href={`/workspace/training/courses/${course.slug}/assessments/${assessment.id}`}
                  key={assessment.id}
                  data-track="training_assessment_open"
                >
                  <span className="dash-action-count training-lesson-index">{passed ? <CheckCircle2 size={18}/> : <FileCheck2 size={17}/>}</span>
                  <span className="dash-action-copy">
                    <span className="dash-action-title"><strong>{assessment.title}</strong></span>
                    <small>Randomized knowledge check · {status}</small>
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
