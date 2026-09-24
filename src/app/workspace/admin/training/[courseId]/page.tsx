import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck, FilePlus2, Pencil, Plus, ShieldCheck } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingCourseForAdmin } from "@/lib/training-admin";
import {
  createTrainingAssessmentAction,
  createTrainingLessonAction,
  createTrainingModuleAction,
  setTrainingCourseStatusAction,
  updateTrainingAssessmentAction,
  updateTrainingCourseAction,
} from "@/app/actions/training-admin";

function reviewedLabel(value: string | null) {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not reviewed";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

export default async function AdminTrainingCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { course, error } = await getTrainingCourseForAdmin(courseId);
  if (!course && !error) notFound();

  if (!course) {
    return (
      <div className="dash-page">
        <section className="card dashboard-section-card">
          <h1>Course unavailable</h1>
          <p className="muted">{error || "This course could not be loaded."}</p>
          <Link className="btn" href="/workspace/admin/training">Back to Training</Link>
        </section>
      </div>
    );
  }

  const lessons = course.modules.flatMap((courseModule) => courseModule.lessons);
  const publishedLessons = lessons.filter((lesson) => lesson.is_published);
  const assessmentReady = course.assessments.every((assessment) =>
    assessment.is_published &&
    Boolean(assessment.instructions && assessment.instructions.trim().length >= 100) &&
    assessment.pass_score !== null &&
    (assessment.assessment_type !== "practical" || (
      Array.isArray(assessment.rubric) &&
      assessment.rubric.length >= 4 &&
      assessment.rubric.reduce((sum, item) => sum + Number(item.weight || 0), 0) === 100 &&
      Array.isArray(assessment.resource_pack) &&
      assessment.resource_pack.length >= 2
    ))
  );
  const publishReady =
    Boolean(course.reviewed_by && course.last_reviewed_at) &&
    lessons.length > 0 &&
    publishedLessons.length === lessons.length &&
    lessons.every((lesson) => Array.isArray(lesson.content) && lesson.content.length >= 3) &&
    assessmentReady;

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Training authoring"
        title={course.title}
        subtitle={<>Build, review, and publish the private course. Learners cannot see drafts.</>}
        actions={<Link className="dash-btn" href="/workspace/admin/training"><ArrowLeft size={15}/> Training</Link>}
      />

      <div className="va-status-grid">
        <div className="status-summary-card">
          <div className="row-between"><span>Modules</span><BookOpenCheck size={18}/></div>
          <strong>{course.modules.length}</strong>
          <small>Course sections</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>Lessons</span><FilePlus2 size={18}/></div>
          <strong>{lessons.length}</strong>
          <small>{publishedLessons.length} marked publishable</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>Review</span><ShieldCheck size={18}/></div>
          <strong>{publishReady ? "Ready" : "Draft"}</strong>
          <small>{reviewedLabel(course.last_reviewed_at)}</small>
        </div>
      </div>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>Course settings</h2>
            <p>Editing these fields does not publish the course.</p>
          </div>
          <span className="badge">{course.status}</span>
        </div>

        <form action={updateTrainingCourseAction} className="stack">
          <input type="hidden" name="course_id" value={course.id}/>
          <div className="grid-2">
            <label className="field"><span>Course title</span><input name="title" required defaultValue={course.title}/></label>
            <label className="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={course.slug}/></label>
          </div>
          <label className="field"><span>Summary</span><textarea name="summary" required rows={4} defaultValue={course.summary || ""}/></label>
          <div className="grid-3">
            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue={course.category}>
                <option value="foundation">Foundation</option>
                <option value="software">Software</option>
                <option value="industry">Industry</option>
                <option value="skill">Skill</option>
              </select>
            </label>
            <label className="field"><span>Country focus</span><input name="country_focus" defaultValue={course.country_focus || ""}/></label>
            <label className="field"><span>Estimated minutes</span><input type="number" name="estimated_minutes" min={0} max={10000} defaultValue={course.estimated_minutes}/></label>
          </div>
          <div className="grid-2">
            <label className="field"><span>Roadmap order</span><input type="number" name="recommended_order" min={1} max={999} defaultValue={course.recommended_order ?? ""} placeholder="Optional"/></label>
          </div>
          <label className="field"><span>Course notice / affiliation disclosure</span><textarea name="trademark_disclaimer" rows={3} defaultValue={course.trademark_disclaimer || ""}/></label>
          <div className="grid-3">
            <label className="field"><span>Content version</span><input type="number" name="content_version" min={1} defaultValue={course.content_version}/></label>
            <label className="field"><span>Editorial reviewer</span><input name="reviewed_by" defaultValue={course.reviewed_by || ""} placeholder="Reviewer name"/></label>
            <label className="field"><span>Editorial review action</span><select name="review_action" defaultValue="preserve"><option value="preserve">Keep current review date</option><option value="mark_now">Mark reviewed now</option><option value="clear">Clear review date</option></select></label>
          </div>
          <div><button className="btn btn-primary" type="submit">Save course</button></div>
        </form>
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>Publishing</h2>
            <p>A course can only go live after editorial review, with substantive content in every published lesson.</p>
          </div>
        </div>
        <div className="compact-list">
          <div><span><strong>Editorial review</strong><small>{course.reviewed_by ? course.reviewed_by + " · " + reviewedLabel(course.last_reviewed_at) : "Reviewer not recorded"}</small></span><span className={"badge " + (course.reviewed_by && course.last_reviewed_at ? "badge-success" : "badge-warning")}>{course.reviewed_by && course.last_reviewed_at ? "Done" : "Needed"}</span></div>
          <div><span><strong>Lesson content</strong><small>{lessons.length ? lessons.filter((lesson) => Array.isArray(lesson.content) && lesson.content.length >= 3).length + "/" + lessons.length + " have substantive blocks" : "No lessons yet"}</small></span></div>
          <div><span><strong>Lesson publishing</strong><small>{publishedLessons.length}/{lessons.length} lessons marked publishable</small></span></div>
          <div><span><strong>Assessments</strong><small>{course.assessments.length ? (assessmentReady ? "Published with instructions, rubric, source pack, and pass score" : "Assessment setup still needs review") : "No course assessment configured"}</small></span><span className={"badge " + (assessmentReady ? "badge-success" : "badge-warning")}>{assessmentReady ? "Ready" : "Needed"}</span></div>
        </div>
        <div className="row wrap" style={{ marginTop: 16 }}>
          {course.status !== "published" ? (
            <form action={setTrainingCourseStatusAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <input type="hidden" name="status" value="published"/>
              <button className="btn btn-primary" type="submit" disabled={!publishReady}>Publish course</button>
            </form>
          ) : (
            <form action={setTrainingCourseStatusAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <input type="hidden" name="status" value="draft"/>
              <button className="btn" type="submit">Return to draft</button>
            </form>
          )}
          {course.status !== "archived" ? (
            <form action={setTrainingCourseStatusAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <input type="hidden" name="status" value="archived"/>
              <button className="btn" type="submit">Archive</button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div><h2>Modules and lessons</h2><p>Lessons are capped at 30 minutes. Build depth with more focused lessons rather than oversized pages.</p></div>
        </div>

        <div className="stack">
          {course.modules.map((courseModule) => (
            <article className="card" key={courseModule.id}>
              <div className="row-between wrap">
                <div>
                  <div className="small muted">Module {courseModule.position}</div>
                  <h3 style={{ margin: "4px 0" }}>{courseModule.title}</h3>
                  {courseModule.summary ? <p className="small muted">{courseModule.summary}</p> : null}
                </div>
                <span className="badge">{courseModule.lessons.length} lesson{courseModule.lessons.length === 1 ? "" : "s"}</span>
              </div>

              <div className="dash-actions" style={{ marginTop: 12 }}>
                {courseModule.lessons.map((lesson) => (
                  <Link className="dash-action" href={"/workspace/admin/training/" + course.id + "/lessons/" + lesson.id} key={lesson.id}>
                    <span className="dash-action-count">{lesson.position}</span>
                    <span className="dash-action-copy">
                      <span className="dash-action-title"><strong>{lesson.title}</strong><span className={"badge " + (lesson.is_published ? "badge-success" : "")}>{lesson.is_published ? "publishable" : "draft"}</span></span>
                      <small>{lesson.estimated_minutes} min · {Array.isArray(lesson.content) ? lesson.content.length : 0} content blocks · v{lesson.content_version}</small>
                    </span>
                    <Pencil size={15}/>
                  </Link>
                ))}
              </div>

              <details style={{ marginTop: 14 }}>
                <summary className="btn btn-sm"><Plus size={14}/> Add lesson</summary>
                <form action={createTrainingLessonAction} className="stack" style={{ marginTop: 14 }}>
                  <input type="hidden" name="course_id" value={course.id}/>
                  <input type="hidden" name="module_id" value={courseModule.id}/>
                  <div className="grid-2">
                    <label className="field"><span>Lesson title</span><input name="title" required/></label>
                    <label className="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label>
                  </div>
                  <label className="field"><span>Summary</span><textarea name="summary" required rows={3}/></label>
                  <div className="grid-2">
                    <label className="field"><span>Minutes</span><input type="number" name="estimated_minutes" min={1} max={30} defaultValue={20} required/></label>
                    <label className="field"><span>Position</span><input type="number" name="position" min={1} defaultValue={courseModule.lessons.length + 1} required/></label>
                  </div>
                  <div><button className="btn btn-primary btn-sm" type="submit">Create lesson</button></div>
                </form>
              </details>
            </article>
          ))}
        </div>

        <details style={{ marginTop: 18 }}>
          <summary className="btn"><Plus size={15}/> Add module</summary>
          <form action={createTrainingModuleAction} className="stack" style={{ marginTop: 14 }}>
            <input type="hidden" name="course_id" value={course.id}/>
            <label className="field"><span>Module title</span><input name="title" required/></label>
            <label className="field"><span>Summary</span><textarea name="summary" rows={3}/></label>
            <label className="field"><span>Position</span><input type="number" name="position" min={1} defaultValue={course.modules.length + 1} required/></label>
            <div><button className="btn btn-primary btn-sm" type="submit">Create module</button></div>
          </form>
        </details>
      </section>


      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>Automatic learner assessment</h2>
            <p>Learner completion no longer waits for an admin review. Final checks are randomized from the published lesson QA standards, scored on the server, and certificates issue automatically after a passing score.</p>
          </div>
          <span className="badge badge-success">Automatic</span>
        </div>
        <div className="compact-list">
          <div><span><strong>Lesson integrity</strong><small>Active reading, lesson-end progress, one knowledge checkpoint, practical response, and sequential completion.</small></span></div>
          <div><span><strong>Final check</strong><small>Randomized course questions, server-side scoring, no answer key after a failed attempt, and three attempts per 24 hours.</small></span></div>
          <div><span><strong>Certificate</strong><small>Issued automatically when every published lesson is complete and the final check passes.</small></span></div>
        </div>
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Assessment source material</h2><p>Keep pass scores, source packs, and rubrics maintained as curriculum evidence. Learners are scored automatically from the published lesson QA standards.</p></div></div>
        <div className="stack">
          {course.assessments.map((assessment) => (
            <details className="card" key={assessment.id}>
              <summary className="row-between">
                <span><strong>{assessment.title}</strong><small className="muted"> {assessment.assessment_type}</small></span>
                <span className={"badge " + (assessment.is_published ? "badge-success" : "")}>{assessment.is_published ? "publishable" : "draft"}</span>
              </summary>
              <form action={updateTrainingAssessmentAction} className="stack" style={{ marginTop: 14 }}>
                <input type="hidden" name="assessment_id" value={assessment.id}/>
                <input type="hidden" name="course_id" value={course.id}/>
                <div className="grid-2">
                  <label className="field"><span>Title</span><input name="title" required defaultValue={assessment.title}/></label>
                  <label className="field"><span>Module</span><select name="module_id" defaultValue={assessment.module_id || ""}><option value="">Course-wide</option>{course.modules.map((courseModule) => <option value={courseModule.id} key={courseModule.id}>{courseModule.title}</option>)}</select></label>
                </div>
                <label className="field"><span>Instructions</span><textarea name="instructions" required minLength={20} maxLength={5000} rows={6} defaultValue={assessment.instructions || ""}/></label>
                <details className="card">
                  <summary><strong>Practical assessment evidence</strong> <span className="small muted">Rubric + fictional resource pack</span></summary>
                  <div className="stack" style={{ marginTop: 12 }}>
                    <label className="field"><span>Rubric JSON</span><textarea name="rubric_json" rows={10} defaultValue={JSON.stringify(assessment.rubric || [], null, 2)}/></label>
                    <label className="field"><span>Resource pack JSON</span><textarea name="resource_pack_json" rows={12} defaultValue={JSON.stringify(assessment.resource_pack || [], null, 2)}/></label>
                  </div>
                </details>
                <div className="grid-3">
                  <label className="field"><span>Type</span><select name="assessment_type" defaultValue={assessment.assessment_type}><option value="practical">Practical</option><option value="knowledge">Knowledge</option></select></label>
                  <label className="field"><span>Pass score</span><input name="pass_score" type="number" min={0} max={100} defaultValue={assessment.pass_score ?? ""} placeholder="Optional"/></label>
                  <label className="field"><span>Position</span><input name="position" type="number" min={1} defaultValue={assessment.position}/></label>
                </div>
                <label className="field"><span>Learner visibility</span><select name="is_published" defaultValue={assessment.is_published ? "1" : "0"}><option value="0">Draft</option><option value="1">Publishable</option></select></label>
                <div><button className="btn btn-sm" type="submit">Save assessment</button></div>
              </form>
            </details>
          ))}
        </div>

        <details style={{ marginTop: 18 }}>
          <summary className="btn"><Plus size={15}/> Add assessment</summary>
          <form action={createTrainingAssessmentAction} className="stack" style={{ marginTop: 14 }}>
            <input type="hidden" name="course_id" value={course.id}/>
            <div className="grid-2">
              <label className="field"><span>Title</span><input name="title" required/></label>
              <label className="field"><span>Module</span><select name="module_id" defaultValue=""><option value="">Course-wide</option>{course.modules.map((courseModule) => <option value={courseModule.id} key={courseModule.id}>{courseModule.title}</option>)}</select></label>
            </div>
            <label className="field"><span>Instructions</span><textarea name="instructions" required minLength={20} maxLength={5000} rows={6}/></label>
            <details className="card">
              <summary><strong>Practical assessment evidence</strong> <span className="small muted">Required before publishing a practical assessment</span></summary>
              <div className="stack" style={{ marginTop: 12 }}>
                <label className="field"><span>Rubric JSON</span><textarea name="rubric_json" rows={10} defaultValue="[]"/></label>
                <label className="field"><span>Resource pack JSON</span><textarea name="resource_pack_json" rows={12} defaultValue="[]"/></label>
              </div>
            </details>
            <div className="grid-3">
              <label className="field"><span>Type</span><select name="assessment_type" defaultValue="practical"><option value="practical">Practical</option><option value="knowledge">Knowledge</option></select></label>
              <label className="field"><span>Pass score</span><input name="pass_score" type="number" min={0} max={100} placeholder="Optional"/></label>
              <label className="field"><span>Position</span><input name="position" type="number" min={1} defaultValue={course.assessments.length + 1}/></label>
            </div>
            <div><button className="btn btn-primary btn-sm" type="submit">Create assessment</button></div>
          </form>
        </details>
      </section>
    </div>
  );
}
