import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingLessonForAdmin, lessonBlocks } from "@/lib/training-admin";
import {
  addTrainingLessonBlockAction,
  removeTrainingLessonBlockAction,
  setTrainingLessonPublishedAction,
  updateTrainingLessonBlockAction,
  updateTrainingLessonMetadataAction,
} from "@/app/actions/training-admin";
import type { LessonContentBlock } from "@/lib/training";

function blockFields(block: LessonContentBlock) {
  if (block.type === "list" || block.type === "steps") {
    return { title: "", text: block.items.join("\n"), output: "" };
  }
  if (block.type === "checklist") {
    return { title: block.title || "", text: block.items.join("\n"), output: "" };
  }
  if (block.type === "exercise") {
    return { title: block.title || "", text: block.text, output: block.deliverable || "" };
  }
  if (block.type === "callout" || block.type === "scenario" || block.type === "template") {
    return { title: block.title || "", text: block.text, output: "" };
  }
  return { title: "", text: block.text, output: "" };
}

function blockLabel(block: LessonContentBlock) {
  if (block.type === "scenario") return "Practice scenario";
  if (block.type === "exercise") return "Practice task";
  if (block.type === "template") return "Reusable template";
  if (block.type === "checklist") return "QA checklist";
  return block.type.replace(/^./, (letter) => letter.toUpperCase());
}

export default async function AdminTrainingLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const { course, lesson, module: courseModule, error } = await getTrainingLessonForAdmin(courseId, lessonId);
  if ((!course || !lesson || !courseModule) && !error) notFound();

  if (!course || !lesson || !courseModule) {
    return (
      <div className="dash-page">
        <section className="card dashboard-section-card">
          <h1>Lesson unavailable</h1>
          <p className="muted">{error || "This lesson could not be loaded."}</p>
          <Link className="btn" href={"/workspace/admin/training/" + courseId}>Back to course</Link>
        </section>
      </div>
    );
  }

  const blocks = lessonBlocks(lesson.content);
  const publishReady = Boolean(lesson.reviewed_by && lesson.last_reviewed_at && blocks.length >= 3);

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker={courseModule.title + " · Lesson " + lesson.position}
        title={lesson.title}
        subtitle={<>Write and review this lesson as structured blocks. The learner view renders these blocks in order.</>}
        actions={<Link className="dash-btn" href={"/workspace/admin/training/" + course.id}><ArrowLeft size={15}/> Course</Link>}
      />

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div><h2>Lesson settings</h2><p>Keep individual lessons at 30 minutes or less.</p></div>
          <span className={"badge " + (lesson.is_published ? "badge-success" : "")}>{lesson.is_published ? "publishable" : "draft"}</span>
        </div>
        <form action={updateTrainingLessonMetadataAction} className="stack">
          <input type="hidden" name="course_id" value={course.id}/>
          <input type="hidden" name="lesson_id" value={lesson.id}/>
          <input type="hidden" name="module_id" value={courseModule.id}/>
          <div className="grid-2">
            <label className="field"><span>Lesson title</span><input name="title" required defaultValue={lesson.title}/></label>
            <label className="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={lesson.slug}/></label>
          </div>
          <label className="field"><span>Summary</span><textarea name="summary" required rows={3} defaultValue={lesson.summary || ""}/></label>
          <div className="grid-3">
            <label className="field"><span>Minutes</span><input type="number" name="estimated_minutes" min={1} max={30} defaultValue={lesson.estimated_minutes}/></label>
            <label className="field"><span>Position</span><input type="number" name="position" min={1} defaultValue={lesson.position}/></label>
            <label className="field"><span>Content version</span><input type="number" name="content_version" min={1} defaultValue={lesson.content_version}/></label>
          </div>
          <div className="grid-2">
            <label className="field"><span>Reviewed by</span><input name="reviewed_by" defaultValue={lesson.reviewed_by || ""} placeholder="Reviewer name"/></label>
            <label className="field"><span>Review action</span><select name="review_action" defaultValue="preserve"><option value="preserve">Keep current review date</option><option value="mark_now">Mark reviewed now</option><option value="clear">Clear review date</option></select></label>
          </div>
          <div><button className="btn btn-primary" type="submit">Save lesson settings</button></div>
        </form>

        <div className="row wrap" style={{ marginTop: 16 }}>
          {!lesson.is_published ? (
            <form action={setTrainingLessonPublishedAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <input type="hidden" name="lesson_id" value={lesson.id}/>
              <input type="hidden" name="publish" value="1"/>
              <button className="btn btn-primary" type="submit" disabled={!publishReady}>Mark lesson publishable</button>
            </form>
          ) : (
            <form action={setTrainingLessonPublishedAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <input type="hidden" name="lesson_id" value={lesson.id}/>
              <input type="hidden" name="publish" value="0"/>
              <button className="btn" type="submit">Return lesson to draft</button>
            </form>
          )}
          {!publishReady ? <span className="small muted">Publishing requires a reviewer, review date, and at least 3 content blocks.</span> : null}
        </div>
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div><h2>Lesson content</h2><p>{blocks.length} blocks. Use plain language, examples, common mistakes, and practical scenarios.</p></div>
        </div>

        <div className="stack">
          {blocks.map((block, index) => {
            const values = blockFields(block);
            return (
              <article className="card" key={block.type + "-" + index}>
                <div className="row-between wrap">
                  <div className="row"><GripVertical size={15}/><strong>{index + 1}. {blockLabel(block)}</strong></div>
                  <form action={removeTrainingLessonBlockAction}>
                    <input type="hidden" name="course_id" value={course.id}/>
                    <input type="hidden" name="lesson_id" value={lesson.id}/>
                    <input type="hidden" name="block_index" value={index}/>
                    <button className="btn btn-sm" type="submit" aria-label={"Remove block " + (index + 1)}><Trash2 size={14}/> Remove</button>
                  </form>
                </div>
                <form action={updateTrainingLessonBlockAction} className="stack" style={{ marginTop: 12 }}>
                  <input type="hidden" name="course_id" value={course.id}/>
                  <input type="hidden" name="lesson_id" value={lesson.id}/>
                  <input type="hidden" name="block_index" value={index}/>
                  <input type="hidden" name="block_type" value={block.type}/>
                  {(["callout", "scenario", "exercise", "template", "checklist"] as string[]).includes(block.type) ? (
                    <label className="field"><span>Block title</span><input name="block_title" defaultValue={values.title}/></label>
                  ) : <input type="hidden" name="block_title" value=""/>}
                  <label className="field">
                    <span>{block.type === "list" || block.type === "steps" || block.type === "checklist" ? "One item per line" : "Content"}</span>
                    <textarea name="block_text" rows={block.type === "paragraph" || block.type === "scenario" || block.type === "exercise" || block.type === "template" ? 7 : 4} required defaultValue={values.text}/>
                  </label>
                  {block.type === "exercise" ? (
                    <label className="field"><span>Expected deliverable</span><textarea name="block_output" rows={3} defaultValue={values.output}/></label>
                  ) : <input type="hidden" name="block_output" value=""/>}
                  <div><button className="btn btn-sm" type="submit">Save block</button></div>
                </form>
              </article>
            );
          })}
        </div>

        <details style={{ marginTop: 18 }}>
          <summary className="btn"><Plus size={15}/> Add content block</summary>
          <form action={addTrainingLessonBlockAction} className="stack" style={{ marginTop: 14 }}>
            <input type="hidden" name="course_id" value={course.id}/>
            <input type="hidden" name="lesson_id" value={lesson.id}/>
            <label className="field">
              <span>Block type</span>
              <select name="block_type" defaultValue="paragraph">
                <option value="heading">Heading</option>
                <option value="paragraph">Paragraph</option>
                <option value="list">Bullet list</option>
                <option value="steps">Numbered steps</option>
                <option value="callout">Callout / important note</option>
                <option value="scenario">Practice scenario</option>
                <option value="exercise">Practice task + deliverable</option>
                <option value="template">Reusable template</option>
                <option value="checklist">QA checklist</option>
              </select>
            </label>
            <label className="field"><span>Optional block title</span><input name="block_title"/></label>
            <label className="field"><span>Content</span><textarea name="block_text" rows={7} required placeholder="For lists, steps, or checklists, enter one item per line."/></label>
            <label className="field"><span>Expected deliverable (practice tasks only)</span><textarea name="block_output" rows={3} placeholder="What the learner should produce."/></label>
            <div><button className="btn btn-primary btn-sm" type="submit">Add block</button></div>
          </form>
        </details>
      </section>
    </div>
  );
}
