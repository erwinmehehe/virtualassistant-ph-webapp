import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { submitTrainingAssessmentAction } from "@/app/actions/training";
import { TrainingCertificateActions } from "@/components/training-certificate-actions";
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
  const lessonsComplete = course.lessonCount > 0 && course.completedLessons === course.lessonCount;
  const waitingForReview = latest?.status === "submitted";
  const passed =
    latest?.status === "reviewed" &&
    (assessment.pass_score === null || (latest.score !== null && Number(latest.score) >= assessment.pass_score));
  const courseHref = `/workspace/training/courses/${course.slug}`;
  const credentialHref = course.certificate
    ? `/training/certificates/${course.certificate.credential_code}`
    : null;

  return (
    <div className="dash-page role-overview training-home training-assessment-page">
      <Link className="btn btn-sm" href={courseHref}>
        <ArrowLeft size={14}/> {course.title}
      </Link>

      <section className="card training-assessment-journey" aria-label="Course completion steps">
        <div className={`training-assessment-step ${lessonsComplete ? "is-complete" : "is-current"}`}>
          <span>{lessonsComplete ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>}</span>
          <div><strong>Lessons</strong><small>{course.completedLessons} of {course.lessonCount}</small></div>
        </div>
        <div className={`training-assessment-step ${passed ? "is-complete" : lessonsComplete ? "is-current" : ""}`}>
          <span>{passed ? <CheckCircle2 size={14}/> : <FileCheck2 size={14}/>}</span>
          <div><strong>Assessment</strong><small>{passed ? "Passed" : waitingForReview ? "In review" : latest?.status === "needs_revision" ? "Revision needed" : "Ready to start"}</small></div>
        </div>
        <div className={`training-assessment-step ${credentialHref ? "is-complete" : ""}`}>
          <span>{credentialHref ? <CheckCircle2 size={14}/> : <Award size={14}/>}</span>
          <div>
            <strong>Certificate</strong>
            <small>{credentialHref ? "Issued" : course.completedAt ? "Preparing" : "After passing"}</small>
          </div>
        </div>
      </section>

      <section className="card dashboard-section-card training-assessment-hero">
        <div className="dash-kicker">Assessment</div>
        <h1>{assessment.title}</h1>
        <p>{assessment.assessment_type === "practical" ? "Practical work simulation" : "Knowledge check"}</p>
        <div className="row wrap">
          <span className="badge"><FileCheck2 size={13}/> {assessment.assessment_type === "practical" ? "Work sample" : "Assessment"}</span>
          {assessment.pass_score !== null ? <span className="badge">Pass score {assessment.pass_score}%</span> : null}
          <span className="badge"><Clock3 size={13}/> Reviewed by a person</span>
          <span className={`badge ${lessonsComplete ? "badge-success" : ""}`}>
            {lessonsComplete ? "Lessons complete" : `${course.completedLessons}/${course.lessonCount} lessons complete`}
          </span>
        </div>
        <div className="training-assessment-readiness">
          <strong>Before you submit</strong>
          <p>Complete every lesson, follow the requested deliverables, and use only the practice materials provided here. Your submission should look like work you would hand to a real client.</p>
        </div>
      </section>

      {assessment.resource_pack?.length ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head">
            <div>
              <h2>Practice client materials</h2>
              <p>Use these materials for the task. If something is missing, note the gap or assumption instead of inventing details.</p>
            </div>
            <span className="badge">{assessment.resource_pack.length} resources</span>
          </div>
          <div className="stack">
            {assessment.resource_pack.map((resource) => (
              <article className="card training-assessment-resource" key={resource.id}>
                <div className="row-between wrap">
                  <strong>{resource.title}</strong>
                  <span className="badge">{resource.kind.toUpperCase()}</span>
                </div>
                <pre>{resource.content}</pre>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {assessment.rubric?.length ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head">
            <div>
              <h2>How your work will be graded</h2>
              <p>The score is based on the work quality below, not keyword matching or course trivia.</p>
            </div>
          </div>
          <div className="compact-list">
            {assessment.rubric.map((criterion) => (
              <div key={criterion.id}>
                <span>
                  <strong>{criterion.label}</strong>
                  <small>{criterion.description}</small>
                </span>
                <span>
                  <span className="badge">{criterion.weight}%</span>
                  {criterion.hard_fail ? <small className="muted">Must meet</small> : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
          {latest.status !== "submitted" && assessment.rubric?.length && latest.rubric_scores ? (
            <div className="compact-list" style={{ marginTop: 12 }}>
              {assessment.rubric.map((criterion) => (
                <div key={criterion.id}>
                  <span><strong>{criterion.label}</strong><small>{criterion.weight}% of overall score</small></span>
                  <span className="badge">{latest.rubric_scores?.[criterion.id] ?? "—"}%</span>
                </div>
              ))}
            </div>
          ) : null}
          {latest.feedback ? <div className="notice"><strong>Reviewer feedback</strong><p>{latest.feedback}</p></div> : null}
          {query.submitted === "1" && latest.status === "submitted" ? <p className="success-banner">Your assessment was submitted for review.</p> : null}
          {latest.status === "needs_revision" ? (
            <div className="training-assessment-review-lessons">
              <Link className="btn" href={courseHref}><ArrowLeft size={14}/> Review course lessons</Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {lessonsComplete && !waitingForReview && !passed ? (
        <section className="card dashboard-section-card training-assessment-submit">
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
                <CheckCircle2 size={15}/> Submit assessment
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!lessonsComplete ? (
        <section className="card dashboard-section-card">
          <h2>Complete the lessons first</h2>
          <p className="muted">This assessment becomes available after you complete all {course.lessonCount} lessons. You have completed {course.completedLessons}.</p>
          <Link className="btn" href={courseHref}>Back to lessons</Link>
        </section>
      ) : null}

      {waitingForReview ? (
        <section className="card dashboard-section-card">
          <h2>Review pending</h2>
          <p className="muted">You do not need to resubmit while this version is being reviewed. Your work is saved here.</p>
        </section>
      ) : null}

      {passed && course.completedAt ? (
        <section className="card training-completion-card">
          <div className="training-completion-icon"><Award size={22}/></div>
          <div className="training-completion-copy">
            <div className="dash-kicker">Course complete</div>
            <h2>{course.title}</h2>
            <p>You passed the assessment. Your next recommended course will be waiting in My learning.</p>
            {course.certificate ? (
              <div className="training-completion-credential">
                <div>
                  <span className="small muted">Credential code</span>
                  <code>{course.certificate.credential_code}</code>
                </div>
                <div className="training-certificate-actions">
                  {credentialHref ? <TrainingCertificateActions href={credentialHref} courseTitle={course.title}/> : null}
                </div>
              </div>
            ) : (
              <p className="small muted">Your completion is saved. The certificate will appear in My learning when issued.</p>
            )}
            <div className="row wrap training-completion-actions">
              {credentialHref ? <Link className="btn btn-primary" href={credentialHref}>View certificate</Link> : null}
              <Link className={credentialHref ? "btn" : "btn btn-primary"} href="/workspace/training">My learning</Link>
            </div>
          </div>
        </section>
      ) : null}

      {passed && !course.completedAt ? (
        <section className="card dashboard-section-card">
          <h2>Assessment passed</h2>
          <p className="muted">This assessment is complete. If there is another assessment in this course, continue from the course overview.</p>
          <Link className="btn btn-primary" href={courseHref}>Course overview</Link>
        </section>
      ) : null}
    </div>
  );
}
