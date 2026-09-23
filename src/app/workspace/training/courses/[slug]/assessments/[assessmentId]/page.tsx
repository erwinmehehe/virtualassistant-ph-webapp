import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { submitTrainingAssessmentAction } from "@/app/actions/training";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingAssessment } from "@/lib/training";

function statusLabel(status: "submitted" | "reviewed" | "needs_revision") {
  if (status === "reviewed") return "Reviewed";
  if (status === "needs_revision") return "Needs revision";
  return "Submitted for review";
}

export default async function TrainingAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; assessmentId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { slug, assessmentId } = await params;
  const query = await searchParams;
  const { userId } = await requireAuthenticatedUserFast(
    `/workspace/training/courses/${slug}/assessments/${assessmentId}`,
  );
  const { course, assessment, error } = await getTrainingAssessment(slug, assessmentId, userId);
  if ((!course || !assessment) && !error) notFound();

  if (!course || !assessment) {
    return (
      <div className="dash-page">
        <section className="card dashboard-section-card">
          <h1>Assessment unavailable</h1>
          <p className="muted">This assessment could not be loaded.</p>
          <Link className="btn" href="/workspace/training">Back to training</Link>
        </section>
      </div>
    );
  }

  const latest = assessment.latestSubmission || null;
  const waitingForReview = latest?.status === "submitted";
  const passed =
    latest?.status === "reviewed" &&
    (assessment.pass_score === null || (latest.score !== null && Number(latest.score) >= assessment.pass_score));

  return (
    <div className="dash-page role-overview">
      <Link className="btn btn-sm" href={`/workspace/training/courses/${course.slug}`}>
        <ArrowLeft size={14}/> {course.title}
      </Link>

      <section className="card dashboard-section-card">
        <div className="dash-kicker">Final assessment</div>
        <h1>{assessment.title}</h1>
        <p>{assessment.assessment_type === "practical" ? "Practical work simulation" : "Knowledge check"}</p>
        <div className="row wrap">
          <span className="badge"><FileCheck2 size={13}/> {assessment.assessment_type === "practical" ? "Work sample" : "Assessment"}</span>
          {assessment.pass_score !== null ? <span className="badge">Pass score {assessment.pass_score}%</span> : null}
          <span className="badge"><Clock3 size={13}/> Review required</span>
        </div>
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>What to submit</h2>
            <p>Use the fictional scenario only. Do not include real client data, passwords, private documents, or confidential screenshots.</p>
          </div>
        </div>
        <div className="prose">
          {(assessment.instructions || "").split("\n").filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      {latest ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head">
            <div>
              <h2>Your latest submission</h2>
              <p>{statusLabel(latest.status)}</p>
            </div>
            <span className={"badge " + (passed ? "badge-success" : latest.status === "needs_revision" ? "badge-warning" : "")}>
              {passed ? "Passed" : statusLabel(latest.status)}
            </span>
          </div>
          {latest.score !== null ? <p><strong>Score:</strong> {latest.score}%</p> : null}
          {latest.feedback ? <div className="notice"><strong>Reviewer feedback</strong><p>{latest.feedback}</p></div> : null}
          {query.submitted === "1" && latest.status === "submitted" ? <p className="success-banner">Your assessment was submitted for review.</p> : null}
        </section>
      ) : null}

      {!waitingForReview && !passed ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head">
            <div>
              <h2>{latest?.status === "needs_revision" ? "Submit a revised response" : "Submit your work"}</h2>
              <p>Use clear headings so the reviewer can check each requested deliverable quickly.</p>
            </div>
          </div>
          <form action={submitTrainingAssessmentAction} className="stack">
            <input type="hidden" name="course_slug" value={course.slug}/>
            <input type="hidden" name="assessment_id" value={assessment.id}/>
            <label className="field">
              <span>Your response</span>
              <textarea
                name="response_text"
                rows={18}
                minLength={100}
                maxLength={20000}
                required
                placeholder="Paste your completed work here. You can include view-only links to fictional work documents if useful."
              />
            </label>
            <div>
              <button className="btn btn-primary" type="submit" data-track="training_assessment_submit_click">
                <CheckCircle2 size={15}/> Submit for review
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {waitingForReview ? (
        <section className="card dashboard-section-card">
          <h2>Review pending</h2>
          <p className="muted">You do not need to resubmit while this version is waiting for review.</p>
        </section>
      ) : null}

      {passed ? (
        <section className="card dashboard-section-card">
          <h2>Assessment complete</h2>
          <p className="muted">If all course lessons are also complete, your course completion and certificate are issued automatically.</p>
        </section>
      ) : null}
    </div>
  );
}
