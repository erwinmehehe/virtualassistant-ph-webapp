import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Target } from "lucide-react";
import { TrainingLessonIntegrityGate } from "@/components/training-lesson-integrity-gate";
import { TrainingChecklistBlock, TrainingTemplateBlock } from "@/components/training-practice-blocks";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingLesson, type LessonContentBlock, type TrainingAssessment } from "@/lib/training";
import { buildLessonCheckpoint, lessonActiveSecondsRequired } from "@/lib/training-integrity";

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
          <strong>This lesson is not ready yet.</strong>
          <p>Return to the course overview and choose another available lesson.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prose training-lesson-prose">
      {blocks.map((block, index) => {
        if (block.type === "heading") return <h2 className={index === 0 ? "training-lesson-section-heading is-first" : "training-lesson-section-heading"} key={index}>{block.text}</h2>;
        if (block.type === "paragraph") return <p className="training-lesson-paragraph" key={index}>{block.text}</p>;
        if (block.type === "list") return <ul className="training-lesson-list" key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
        if (block.type === "steps") return <ol className="training-lesson-steps" key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ol>;
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
            <section className="training-practice-block training-scenario-block" key={index}>
              <div className="dash-kicker">Client scenario</div>
              {block.title ? <h3>{block.title}</h3> : null}
              <p>{block.text}</p>
            </section>
          );
        }
        if (block.type === "exercise") {
          return (
            <section className="training-exercise-block" key={index}>
              <div className="training-practice-block-head">
                <div>
                  <span className="dash-kicker"><Target size={13}/> Practice task</span>
                  {block.title ? <h3>{block.title}</h3> : null}
                </div>
              </div>
              <p>{block.text}</p>
              {block.deliverable ? (
                <div className="training-exercise-deliverable">
                  <strong>Your deliverable</strong>
                  <p>{block.deliverable}</p>
                </div>
              ) : null}
            </section>
          );
        }
        if (block.type === "template") {
          return <TrainingTemplateBlock key={index} title={block.title} text={block.text}/>;
        }
        if (block.type === "checklist") {
          return <TrainingChecklistBlock key={index} title={block.title} items={block.items}/>;
        }
        return null;
      })}
    </div>
  );
}

const lessonCompletionErrorCopy: Record<string, string> = {
  sequence: "Complete the earlier lessons before finishing this lesson.",
  time: "Spend a little more active time with this lesson, then try again.",
  scroll: "Reach the end of the lesson before completing it.",
  checkpoint: "Answer the quick check correctly before completing this lesson.",
  exercise: "Add a few useful sentences to your practical note before completing this lesson.",
};

export default async function TrainingLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams?: Promise<{ lesson_error?: string }>;
}) {
  const [{ slug, lessonId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ lesson_error?: string }>({}),
  ]);
  const completionError = query.lesson_error
    ? lessonCompletionErrorCopy[query.lesson_error] || null
    : null;
  const { userId } = await requireAuthenticatedUserFast(`/workspace/training/courses/${slug}/lessons/${lessonId}`);
  const { course, lesson, engagement, error } = await getTrainingLesson(slug, lessonId, userId);
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
  const certificateHref = course.certificate
    ? `/training/certificates/${course.certificate.credential_code}`
    : null;
  const nextHref = next
    ? `${courseHref}/lessons/${next.id}`
    : nextAssessment
      ? `${courseHref}/assessments/${nextAssessment.id}`
      : certificateHref || courseHref;
  const nextLabel = next
    ? "Continue lesson"
    : nextAssessment
      ? "Start final check"
      : certificateHref
        ? "View certificate"
        : "Course overview";
  const lessonProgress = course.lessonCount
    ? Math.round((course.completedLessons / course.lessonCount) * 100)
    : 0;
  const blocks = contentBlocks(lesson.content);
  const requiresExercise = blocks.some((block) => block.type === "exercise");
  const checkpoint = buildLessonCheckpoint({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    userId,
    content: lesson.content,
  });
  const requiredActiveSeconds = lessonActiveSecondsRequired(lesson.estimated_minutes);
  const checkpointAlreadyPassed = Boolean(
    checkpoint &&
    engagement?.checkpointPassedAt &&
    engagement.checkpointKey === checkpoint.checkpointKey,
  );

  const playerVariant = course.slug === "virtual-assistant-foundations"
    ? " training-foundations-player"
    : course.slug === "executive-virtual-assistant"
      ? " training-executive-player"
      : course.slug === "customer-support-virtual-assistant"
        ? " training-support-player"
        : course.slug === "operations-virtual-assistant"
          ? " training-work-player training-operations-player"
          : course.slug === "project-management-for-virtual-assistants"
            ? " training-work-player training-project-player"
            : course.slug === "seo-virtual-assistant"
              ? " training-work-player training-seo-player"
              : course.slug === "marketing-virtual-assistant"
                ? " training-work-player training-marketing-player"
                : course.slug === "ecommerce-virtual-assistant"
                  ? " training-work-player training-ecommerce-player"
                  : course.slug === "social-media-virtual-assistant"
                    ? " training-work-player training-social-player"
                    : course.slug === "sales-lead-generation-virtual-assistant"
                      ? " training-work-player training-sales-player"
                      : "";

  return (
    <div className={`dash-page role-overview training-home training-player-page${playerVariant}`}>
      <Link className="btn btn-sm" href={courseHref}>
        <ArrowLeft size={14}/> {course.title}
      </Link>

      {completionError ? (
        <div className="notice training-lesson-completion-error" role="alert">
          <strong>Almost there.</strong>
          <span>{completionError}</span>
        </div>
      ) : null}

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
              {course.slug === "executive-virtual-assistant" && requiresExercise ? <span className="badge training-executive-practice-badge"><Target size={13}/> Work output included</span> : null}
              {course.slug === "customer-support-virtual-assistant" && requiresExercise ? <span className="badge training-support-practice-badge"><Target size={13}/> Queue work included</span> : null}
              {course.slug === "operations-virtual-assistant" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> Operations artifact included</span> : null}
              {course.slug === "project-management-for-virtual-assistants" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> Project artifact included</span> : null}
              {course.slug === "seo-virtual-assistant" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> SEO evidence artifact included</span> : null}
              {course.slug === "marketing-virtual-assistant" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> Campaign artifact included</span> : null}
              {course.slug === "ecommerce-virtual-assistant" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> Store ops artifact included</span> : null}
              {course.slug === "social-media-virtual-assistant" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> Social ops artifact included</span> : null}
              {course.slug === "sales-lead-generation-virtual-assistant" && requiresExercise ? <span className="badge training-work-practice-badge"><Target size={13}/> Pipeline artifact included</span> : null}
              {lesson.last_reviewed_at ? (
                <span className="badge">
                  Reviewed {new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(new Date(lesson.last_reviewed_at))}
                </span>
              ) : null}
            </div>
          </div>

          <LessonContent value={lesson.content}/>
          <div data-training-content-end={lesson.id} aria-hidden="true"/>

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
                <Link
                  className="btn btn-primary"
                  href={nextHref}
                  data-track={next ? "training_course_continue" : nextAssessment ? "training_assessment_open" : certificateHref ? "training_certificate_open" : undefined}
                >
                  {nextLabel} <ArrowRight size={14}/>
                </Link>
              ) : (
                <span className="small muted training-player-next-hint">Finish the lesson checks below to unlock your next step.</span>
              )}
            </div>
            <p className="small muted">
              Progress is saved when you complete a lesson. You can come back anytime from My learning.
            </p>
          </footer>

          {!lesson.completed ? (
            <TrainingLessonIntegrityGate
              lessonId={lesson.id}
              courseSlug={course.slug}
              nextHref={nextHref}
              completionLabel={!next && nextAssessment ? "Complete lesson & start final check" : "Complete lesson"}
              requiredActiveSeconds={requiredActiveSeconds}
              initialActiveSeconds={engagement?.activeSeconds || 0}
              initialScrollPercent={engagement?.maxScrollPercent || 0}
              checkpoint={checkpoint ? {
                prompt: checkpoint.prompt,
                options: checkpoint.options,
              } : null}
              checkpointAlreadyPassed={checkpointAlreadyPassed}
              requiresExercise={requiresExercise}
              initialExerciseResponse={engagement?.exerciseResponse || ""}
            />
          ) : null}
        </article>

        <aside className="training-player-sidebar">
          <details className="card training-player-outline">
            <summary>
              <span>
                <strong>{currentModule ? currentModule.title : "Course progress"}</strong>
                <small>Lesson {lessonIndex + 1} of {course.lessonCount} · {course.completedLessons} complete</small>
              </span>
              <span className="small muted">Lessons</span>
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
              <p className="small muted">Finish this lesson and you will go straight to the final check.</p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
