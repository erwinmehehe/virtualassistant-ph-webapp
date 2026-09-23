import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingCourse } from "@/lib/training";
import { startTrainingCourseAction } from "@/app/actions/training";

function reviewedLabel(value: string | null) {
  if (!value) return "Review date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Review date pending";
  return `Last reviewed ${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(date)}`;
}

export default async function TrainingCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await requireAuthenticatedUserFast(`/workspace/training/courses/${slug}`);
  const { course, error } = await getTrainingCourse(slug, userId);
  if (!course && !error) notFound();

  if (!course) {
    return <div className="dash-page"><section className="card dashboard-section-card"><h1>Course unavailable</h1><p className="muted">This course could not be loaded in the current environment.</p><Link className="btn" href="/workspace/training">Back to training</Link></section></div>;
  }

  return (
    <div className="dash-page role-overview">
      <Link className="btn btn-sm" href="/workspace/training"><ArrowLeft size={14}/> My learning</Link>

      <section className="card dashboard-section-card">
        <div className="dash-kicker">{course.category}{course.country_focus ? ` · ${course.country_focus}` : ""}</div>
        <h1>{course.title}</h1>
        <p>{course.summary}</p>

        <div className="row wrap">
          <span className="badge"><Clock3 size={13}/> {course.lessonCount} lessons</span>
          <span className="badge"><FileCheck2 size={13}/> Version {course.content_version}</span>
          <span className="badge">{reviewedLabel(course.last_reviewed_at)}</span>
          {course.reviewed_by ? <span className="badge">Reviewed by {course.reviewed_by}</span> : null}
        </div>

        {course.trademark_disclaimer ? <div className="notice" role="note">{course.trademark_disclaimer}</div> : null}

        <div className="row-between" style={{ marginTop: 18 }}>
          <div>
            <strong>{course.progressPercent}% complete</strong>
            <div className="small muted">{course.completedLessons} of {course.lessonCount} lessons</div>
          </div>
          {!course.enrolled ? (
            <form action={startTrainingCourseAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <button className="btn btn-primary" type="submit" data-track="training_course_start_click">Start free training</button>
            </form>
          ) : null}
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
                  <small className="muted">{lesson.estimated_minutes} min · v{lesson.content_version}</small>
                </span>
                <ArrowRight size={16}/>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {course.assessments.length ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head"><div><h2>Assessments</h2><p>Assessments are part of learning, not a requirement to access jobs.</p></div></div>
          <div className="compact-list">
            {course.assessments.map((assessment) => (
              <div key={assessment.id}>
                <span><strong>{assessment.title}</strong><small>{assessment.assessment_type === "practical" ? "Practical exercise" : "Knowledge check"}</small></span>
                <span className="badge">Free</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
