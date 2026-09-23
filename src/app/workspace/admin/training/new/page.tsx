import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { createTrainingCourseAction } from "@/app/actions/training-admin";

export default function NewTrainingCoursePage() {
  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Training authoring"
        title="New course"
        subtitle={<>Create the course shell first. Keep it in draft until its lessons have been written and reviewed.</>}
        actions={<Link className="dash-btn" href="/workspace/admin/training"><ArrowLeft size={15}/> Training</Link>}
      />

      <section className="card dashboard-section-card">
        <form action={createTrainingCourseAction} className="stack">
          <div className="grid-2">
            <label className="field"><span>Course title</span><input name="title" required minLength={4} maxLength={140}/></label>
            <label className="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="virtual-assistant-foundations"/></label>
          </div>
          <label className="field"><span>Summary</span><textarea name="summary" required minLength={20} maxLength={800} rows={4}/></label>
          <div className="grid-3">
            <label className="field"><span>Category</span><select name="category" defaultValue="foundation"><option value="foundation">Foundation</option><option value="software">Software</option><option value="industry">Industry</option><option value="skill">Skill</option></select></label>
            <label className="field"><span>Country focus</span><input name="country_focus" maxLength={80} placeholder="Optional, e.g. Australia"/></label>
            <label className="field"><span>Estimated total minutes</span><input name="estimated_minutes" type="number" min={0} max={10000} defaultValue={0}/></label>
          </div>
          <label className="field"><span>Roadmap order</span><input name="recommended_order" type="number" min={1} max={999} placeholder="Optional"/></label>
          <label className="field"><span>Trademark / affiliation disclosure</span><textarea name="trademark_disclaimer" maxLength={1000} rows={3} placeholder="Use for software-branded courses where needed."/></label>
          <div><button className="btn btn-primary" type="submit">Create draft course</button></div>
        </form>
      </section>
    </div>
  );
}
