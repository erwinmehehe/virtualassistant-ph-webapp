import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { markTrainingLessonCompleteAction } from "@/app/actions/training";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingLesson, type LessonContentBlock, type TrainingAssessment } from "@/lib/training";

function contentBlocks(value: unknown): LessonContentBlock[] {
  return Array.isArray(value) ? value as LessonContentBlock[] : [];
}

function assessmentPassed(assessment: TrainingAssessment) {
  const latest = assessment.latestSubmission || null;
  return Boolean(
    latest?.status === "reviewed" &&
      (assessment.pass_score === null ||
        (latest.score !== null && Number(latest.score) >= assessment.pass_score)),
  );
}

function LessonContent({ value }: { value: unknown }) {
  const blocks = contentBlocks(value);
  if (!blocks.length) {
    return (
      <div className="dashboard-caught-up">
        <div>
          <strong>Lesson content is being prepared.</strong>
          <p>This lesson has been created but does not have published content yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prose training-lesson-prose">
      {blocks.map((block, index) => {
        if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
        if (block.type === "list") return <ul key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
        if (block.type === "steps") return <ol key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ol>;
        if (block.type === "callout") {
          return (
            <div className="notice training-note-block" key={index}>
              {block.title ? <strong>{block.title}</strong> : null}
              <p>{block.text}</p>
            </div>
          );
        }
        if (block.type === "scenario") {
          return (
            <section className="training-practice-block" key={index}>
              <div className="dash-kicker">Practice scenario</div>
              {block.title ? <h3>{block.title}</h3> : null}
              <p>{block.text}</p>
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}

export default async function TrainingLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const { userId } = await requireAuthenticatedUserFast(`/workspace/training/courses/${slug}/lessons/${lessonId}`);
  const { course, lesson, error } = await getTrainingLesson(slug, lessonId, userId);
  if ((!course || !lesson) && !error) notFound();

  if (!course || !lesson) {
    return (
      <div className="dash-page">
        <section className="card dashboard-section-card">
          <h1>Lesson unavailable</h1>
          <Link className="btn" href="/workspace/training">Back to training</Link>
        </section>
      </div>
    );
  }

  const orderedLessons = course.modules.flatMap((module) => module.lessons);
  const lessonIndex = orderedLessons.findIndex((item) => item.id === lesson.id);
  const previous = lessonIndex > 0 ? orderedLessons[lessonIndex - 1] : null;
  const next = lessonIndex >= 0 && lessonIndex < orderedLessons.length - 1 ? orderedLessons[lessonIndex + 1] : null;
  const currentModule = course.modules.find((module) => module.id === lesson.module_id) || null;
  const nextAssessment = course.assessments.find((assessment) => !assessmentPassed(assessment)) || null;
  const courseHref = `/workspace/training/courses/${course.slug}`;
  const nextHref = next
    ? `${courseHref}/lessons/${next.id}`
    : nextAssessment
      ? `${courseHref}/assessments/${nextAssessment.id}`
      : courseHref;
  const nextLabel = next ? "Next lesson" : nextAssessment ? "Start assessment" : "Course overview";
  const completeLabel = next
    ? "Complete & continue"
    : nextAssessment
      ? "Complete lesson & start assessment"
      : "Complete lesson";
  const lessonProgress = course.lessonCount
    ? Math.round((course.completedLessons / course.lessonCount) * 100)
    : 0;

  return (
    <div className="dash-page role-overview training-home training-player-page">
      <Link className="btn btn-sm" href={courseHref}>
        <ArrowLeft size={14}/> {course.title}
      </Link>

      <section className="card training-player-progress" aria-label="Course progress">
        <div className="training-player-progress-copy">
          <div>
            <span className="small muted">{currentModule ? currentModule.title : course.title}</span>
            <strong>Lesson {lessonIndex + 1} of {course.lessonCount}</strong>
          </div>
          <span className="training-player-progress-value">{lessonProgress}%</span>
        </div>
        <div className="progress"><span style={{ width: `${lessonProgress}%` }}/></div>
      </section>

      <div className="training-player-layout">
        <article className="card dashboard-section-card training-player-content">
          <div className="training-player-lesson-head">
            <div className="dash-kicker">Lesson {lessonIndex + 1}</div>
            <h1>{lesson.title}</h1>
            {lesson.summary ? <p>{lesson.summary}</p> : null}
            <div className="row wrap">
              <span className="badge"><Clock3 size={13}/> About {lesson.estimated_minutes} minutes</span>
              {lesson.completed ? <span className="badge badge-success"><CheckCircle2 size={14}/> Completed</span> : <span className="badge">In progress</span>}
              {lesson.last_reviewed_at ? (
                <span className="badge">
                  Reviewed {new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(new Date(lesson.last_reviewed_at))}
                </span>
              ) : null}
            </div>
          </div>

          <LessonContent value={lesson.content}/>

          <footer className="training-player-footer">
            <div className="training-player-footer-nav">
              {previous ? (
                <Link className="btn" href={`${courseHref}/lessons/${previous.id}`}>
                  <ArrowLeft size={14}/> Previous
                </Link>
              ) : (
                <Link className="btn" href={courseHref}><ArrowLeft size={14}/> Course overview</Link>
              )}

              {lesson.completed ? (
                <Link className="btn btn-primary" href={nextHref}>
                  {nextLabel} <ArrowRight size={14}/>
                </Link>
              ) : (
                <form action={markTrainingLessonCompleteAction}>
                  <input type="hidden" name="lesson_id" value={lesson.id}/>
                  <input type="hidden" name="course_slug" value={course.slug}/>
                  <input type="hidden" name="continue_to" value={nextHref}/>
                  <button className="btn btn-primary" type="submit" data-track="training_lesson_complete_click">
                    <CheckCircle2 size={15}/> {completeLabel} <ArrowRight size={14}/>
                  </button>
                </form>
              )}
            </div>
            <p className="small muted">
              Your completion is saved when you continue. You can return from My learning at any time.
            </p>
          </footer>
        </article>

        <aside className="training-player-sidebar">
          <details className="card training-player-outline">
            <summary>
              <span>
                <strong>Course outline</strong>
                <small>{course.completedLessons} of {course.lessonCount} lessons complete</small>
              </span>
              <span className="small muted">View</span>
            </summary>
            <div className="training-player-outline-body">
              {course.modules.map((module) => (
                <section key={module.id}>
                  <div className="training-player-module-title">
                    <span>Module {module.position}</span>
                    <strong>{module.title}</strong>
                  </div>
                  <div className="training-player-lesson-list">
                    {module.lessons.map((item) => (
                      <Link
                        className={[
                          "training-player-lesson-link",
                          item.id === lesson.id ? "is-current" : "",
                          item.completed ? "is-complete" : "",
                        ].filter(Boolean).join(" ")}
                        href={`${courseHref}/lessons/${item.id}`}
                        key={item.id}
                        aria-current={item.id === lesson.id ? "page" : undefined}
                      >
                        <span>{item.completed ? <CheckCircle2 size={14}/> : item.position}</span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.estimated_minutes} min</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </details>

          {nextAssessment && !next ? (
            <section className="card training-player-next-step">
              <div className="dash-kicker">Next step</div>
              <strong>{nextAssessment.title}</strong>
              <p className="small muted">Finish this lesson and you will go straight to the assessment.</p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
