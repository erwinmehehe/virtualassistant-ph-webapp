import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { markTrainingLessonCompleteAction } from "@/app/actions/training";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingLesson, type LessonContentBlock } from "@/lib/training";

function contentBlocks(value: unknown): LessonContentBlock[] {
  return Array.isArray(value) ? value as LessonContentBlock[] : [];
}

function LessonContent({ value }: { value: unknown }) {
  const blocks = contentBlocks(value);
  if (!blocks.length) {
    return <div className="dashboard-caught-up"><div><strong>Lesson content is being prepared.</strong><p>This lesson has been created but does not have published content yet.</p></div></div>;
  }

  return (
    <div className="prose">
      {blocks.map((block, index) => {
        if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
        if (block.type === "list") return <ul key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
        if (block.type === "steps") return <ol key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ol>;
        if (block.type === "callout") return <div className="notice" key={index}>{block.title ? <strong>{block.title}</strong> : null}<p>{block.text}</p></div>;
        if (block.type === "scenario") return <section className="card" key={index}><div className="dash-kicker">Practice scenario</div>{block.title ? <h3>{block.title}</h3> : null}<p>{block.text}</p></section>;
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
    return <div className="dash-page"><section className="card dashboard-section-card"><h1>Lesson unavailable</h1><Link className="btn" href="/workspace/training">Back to training</Link></section></div>;
  }

  const orderedLessons = course.modules.flatMap((module) => module.lessons);
  const lessonIndex = orderedLessons.findIndex((item) => item.id === lesson.id);
  const previous = lessonIndex > 0 ? orderedLessons[lessonIndex - 1] : null;
  const next = lessonIndex >= 0 && lessonIndex < orderedLessons.length - 1 ? orderedLessons[lessonIndex + 1] : null;
  const finalAssessment = course.assessments[0] || null;

  return (
    <div className="dash-page role-overview">
      <Link className="btn btn-sm" href={`/workspace/training/courses/${course.slug}`}><ArrowLeft size={14}/> {course.title}</Link>

      <article className="card dashboard-section-card">
        <div className="dash-kicker">Lesson {lesson.position}</div>
        <h1>{lesson.title}</h1>
        {lesson.summary ? <p>{lesson.summary}</p> : null}
        <div className="row wrap">
          <span className="badge"><Clock3 size={13}/> About {lesson.estimated_minutes} minutes</span>
          <span className="badge">Version {lesson.content_version}</span>
          {lesson.last_reviewed_at ? <span className="badge">Reviewed {new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(new Date(lesson.last_reviewed_at))}</span> : null}
        </div>

        <LessonContent value={lesson.content}/>

        <div className="row-between" style={{ marginTop: 28 }}>
          {lesson.completed ? (
            <span className="badge badge-success"><CheckCircle2 size={14}/> Lesson complete</span>
          ) : (
            <form action={markTrainingLessonCompleteAction}>
              <input type="hidden" name="lesson_id" value={lesson.id}/>
              <input type="hidden" name="course_slug" value={course.slug}/>
              <button className="btn btn-primary" type="submit" data-track="training_lesson_complete_click"><CheckCircle2 size={15}/> Mark lesson complete</button>
            </form>
          )}
        </div>
      </article>

      <div className="row-between">
        {previous ? <Link className="btn" href={`/workspace/training/courses/${course.slug}/lessons/${previous.id}`}><ArrowLeft size={14}/> Previous</Link> : <span/>}
        {next ? (
          <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/lessons/${next.id}`}>Next lesson <ArrowRight size={14}/></Link>
        ) : lesson.completed && finalAssessment ? (
          <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/assessments/${finalAssessment.id}`}>Final assessment <ArrowRight size={14}/></Link>
        ) : (
          <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}`}>Course overview <ArrowRight size={14}/></Link>
        )}
      </div>
    </div>
  );
}
