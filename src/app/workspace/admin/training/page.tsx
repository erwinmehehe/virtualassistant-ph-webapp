import Link from "next/link";
import { BookOpenCheck, Clock3, FileCheck2, GraduationCap, Plus } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingAdminSummary } from "@/lib/training";

function reviewState(value: string | null) {
  if (!value) return "Review not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Review not recorded";
  const ageDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return ageDays > 180 ? `Review due · ${ageDays}d` : `Reviewed ${new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(date)}`;
}

export default async function AdminTrainingPage() {
  const { courses, totals, error } = await getTrainingAdminSummary();

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Learning system"
        title="Training"
        subtitle={<>Manage the free learning library separately from hiring. Published lessons are private to signed-in learners and remain out of search indexing.</>}
        actions={<><Link className="dash-btn" href="/workspace/admin/training/new"><Plus size={15}/> New course</Link><Link className="dash-btn" href="/workspace/training">Open learner view</Link></>}
      />

      <div className="va-status-grid">
        <div className="status-summary-card"><div className="row-between"><span>Courses</span><GraduationCap size={18}/></div><strong>{totals.courses}</strong><small>Draft, published, and archived</small></div>
        <div className="status-summary-card"><div className="row-between"><span>Published</span><BookOpenCheck size={18}/></div><strong>{totals.published}</strong><small>Visible to signed-in learners</small></div>
        <div className="status-summary-card"><div className="row-between"><span>Lessons</span><FileCheck2 size={18}/></div><strong>{totals.lessons}</strong><small>Maximum 30 minutes each</small></div>
      </div>

      {error ? <section className="card dashboard-section-card"><h2>Migration required</h2><p className="muted">Apply the free training foundation migration before using course administration.</p></section> : null}

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Course inventory</h2><p>Keep content versioned, reviewed, and easy to maintain as software and Australian workflows change.</p></div></div>
        {courses.length ? (
          <div className="dash-actions">
            {courses.map((course) => (
              <Link className="dash-action" href={"/workspace/admin/training/" + course.id} key={course.id}>
                <span className="dash-action-count"><Clock3 size={16}/></span>
                <span className="dash-action-copy">
                  <span className="dash-action-title"><strong>{course.title}</strong><span className="badge">{course.status}</span></span>
                  <small>{course.modules} module{course.modules === 1 ? "" : "s"} · {course.publishedLessons}/{course.lessons} lessons published · v{course.content_version}</small>
                  <small className="muted">{reviewState(course.last_reviewed_at)}{course.reviewed_by ? " · " + course.reviewed_by : ""}</small>
                  {course.trademark_disclaimer ? <small className="muted">Trademark disclosure recorded</small> : null}
                </span>
              </Link>
            ))}
          </div>
        ) : !error ? (
          <div className="dashboard-caught-up"><GraduationCap size={22}/><div><strong>No courses yet.</strong><p>The learning data model is ready. Create the first course after the content outline is approved.</p></div></div>
        ) : null}
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Publishing rules</h2><p>These are product rules, not optional marketing guidance.</p></div></div>
        <div className="compact-list">
          <div><span><strong>Free learning and certificates</strong><small>No lesson, assessment, or completion certificate is paywalled.</small></span></div>
          <div><span><strong>Independent from hiring</strong><small>Course completion never controls job access or shortlisting.</small></span></div>
          <div><span><strong>Expert-reviewed specialist content</strong><small>Industry workflows should be reviewed by practising VAs or subject-matter experts before publishing.</small></span></div>
          <div><span><strong>Composite scenarios only</strong><small>Real briefs can inspire exercises, but a single client brief should never be lightly anonymized and reused.</small></span></div>
        </div>
      </section>
    </div>
  );
}
