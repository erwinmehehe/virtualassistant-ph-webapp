import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewFinalistAction } from "@/app/actions/vetting";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";
import { uniqueStrings } from "@/lib/collections";

const scoreFields = [
  ["role_skills", "Role skills"],
  ["communication", "Communication"],
  ["judgment", "Judgment"],
  ["reliability", "Reliability"],
  ["client_readiness", "Client readiness"]
] as const;

export default async function AdminFinalistReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("admin");
  const admin = createAdminClient();
  const [{ data: profile }, { data: va }, { data: vetting }, { data: attempt }, { data: scorecard }] = await Promise.all([
    admin.from("profiles").select("id,full_name,created_at").eq("id", id).single(),
    admin.from("va_profiles").select("*").eq("user_id", id).single(),
    admin.from("va_vetting").select("*").eq("va_id", id).single(),
    admin.from("va_test_attempts").select("*,skills_tests(title,category,questions,passing_score)").eq("va_id", id).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("vetting_scorecards").select("*").eq("va_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);
  if (!profile || !va || !vetting) notFound();

  const questions = Array.isArray(attempt?.skills_tests?.questions) ? attempt.skills_tests.questions : [];
  const answers = attempt?.answers || {};
  const decisionReady = vetting.stage === "finalist" && !!scorecard && !!vetting.recruiter_interview_at;

  return <>
    <div className="page-head">
      <div>
        <div className="row wrap"><Link className="text-link small" href="/workspace/admin/vetting">← Final review queue</Link><span className="badge">{vettingStatusLabel(vetting.stage)}</span></div>
        <h1 style={{ marginTop: 8 }}>{profile.full_name || "VA candidate"}</h1>
        <p>{va.headline || va.primary_category || "Virtual Assistant"} · Final evidence review</p>
      </div>
      <div className="row wrap">
        {va.resume_path ? <a className="btn" href={`/api/admin/va-resume/${id}`} target="_blank">Private resume</a> : null}
        {vetting.video_url ? <a className="btn btn-primary" href={vetting.video_url} target="_blank" rel="noreferrer">Watch video intro</a> : null}
      </div>
    </div>

    <div className="profile-layout">
      <div className="stack">
        <section className="card">
          <div className="row-between wrap"><div><h3 style={{ margin: 0 }}>Structured profile</h3><p className="small muted" style={{ margin: "5px 0 0" }}>Review the evidence behind the recruiter recommendation, not only the aggregate score.</p></div><span className="small muted">Joined {dateShort(profile.created_at)}</span></div>
          <p>{va.bio || "No professional summary provided."}</p>
          <div className="score-grid">
            <div><span>Primary category</span><strong>{va.primary_category || "Not set"}</strong></div>
            <div><span>Experience</span><strong>{va.years_experience ?? "Not set"}{va.years_experience != null ? " years" : ""}</strong></div>
            <div><span>Availability</span><strong>{va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Not set"}</strong></div>
            <div><span>Rate</span><strong>{va.hourly_rate ? `USD ${va.hourly_rate}/hr` : "Not set"}</strong></div>
            <div><span>Overlap</span><strong>{va.overlap_hours != null ? `${va.overlap_hours} hrs/day` : "Not set"}</strong></div>
          </div>
          <div style={{ marginTop: 16 }}><div className="small muted">Skills</div><div className="pill-list" style={{ marginTop: 7 }}>{uniqueStrings(va.skills).length ? uniqueStrings(va.skills).map((x, index) => <span className="badge" key={`${String(x)}-${index}`}>{x}</span>) : <span className="small muted">None listed</span>}</div></div>
          <div style={{ marginTop: 16 }}><div className="small muted">Tools</div><div className="pill-list" style={{ marginTop: 7 }}>{uniqueStrings(va.tools).length ? uniqueStrings(va.tools).map((x, index) => <span className="badge" key={`${String(x)}-${index}`}>{x}</span>) : <span className="small muted">None listed</span>}</div></div>
        </section>

        <section className="card">
          <div className="row-between wrap"><div><h3 style={{ margin: 0 }}>Skills test evidence</h3><p className="small muted" style={{ margin: "5px 0 0" }}>{attempt?.skills_tests?.title || "No test submitted"}</p></div>{attempt ? <strong className="score-big">{attempt.final_score ?? attempt.reviewer_score ?? attempt.auto_score ?? 0}%</strong> : null}</div>
          {attempt ? <><div className="row wrap" style={{ marginTop: 12 }}><span className="badge">Pass mark {attempt.skills_tests?.passing_score != null ? `${attempt.skills_tests.passing_score}%` : "Not set"}</span><span className="badge">Submitted {dateShort(attempt.submitted_at)}</span>{attempt.reviewed_at ? <span className="badge badge-success">Reviewed {dateShort(attempt.reviewed_at)}</span> : <span className="badge badge-warning">Reviewer scoring pending</span>}</div>{attempt.review_notes ? <div className="review-answer" style={{ marginTop: 14 }}><strong>Test reviewer notes</strong><p>{attempt.review_notes}</p></div> : null}<div className="stack" style={{ marginTop: 16 }}>{questions.map((q: any, index: number) => <div className="review-answer" key={q.id || index}><div className="small muted">Question {index + 1}</div><strong>{q.prompt}</strong><p>{answers[q.id] || "No answer"}</p>{q.type === "choice" ? <span className={`badge ${answers[q.id] === q.correct ? "badge-success" : "badge-warning"}`}>{answers[q.id] === q.correct ? "Correct" : "Incorrect"}</span> : null}</div>)}</div></> : <div className="empty">No skills-test attempt is available.</div>}
        </section>

        <section className="card">
          <h3>Recruiter evidence</h3>
          {scorecard ? <><div className="score-grid">{scoreFields.map(([field, label]) => <div key={field}><span>{label}</span><strong>{scorecard[field]}/5</strong></div>)}</div><div className="review-answer" style={{ marginTop: 16 }}><div className="row-between wrap"><strong>{scorecard.total_score}% · {scorecard.recommendation}</strong><span className="small muted">{dateShort(scorecard.created_at)}</span></div><p>{scorecard.notes || "No recruiter scorecard notes."}</p></div></> : <div className="empty">No recruiter scorecard is available.</div>}
          <div className="review-answer" style={{ marginTop: 14 }}><strong>Recruiter interview</strong><p>{vetting.recruiter_interview_at ? `Completed ${dateShort(vetting.recruiter_interview_at)}.` : "Not recorded as completed."}</p>{vetting.recruiter_notes ? <p>{vetting.recruiter_notes}</p> : null}</div>
        </section>
      </div>

      <aside className="profile-sidebar">
        <div className="card stack">
          <div><h3 style={{ margin: 0 }}>Final decision</h3><p className="small muted" style={{ margin: "5px 0 0" }}>Approve only after reviewing the profile, resume, test, video, and recruiter scorecard. A written final-review note is required.</p></div>
          {decisionReady ? <form action={reviewFinalistAction} className="stack">
            <input type="hidden" name="va_id" value={id}/>
            <div className="field"><label htmlFor="admin-review-note">Final review note</label><textarea id="admin-review-note" name="notes" required minLength={20} placeholder="Record the evidence behind your decision, any conditions, and concerns."/></div>
            <button className="btn btn-primary" name="decision" value="approve" type="submit">Approve for client matching</button>
            <button className="btn" name="decision" value="return" type="submit">Return to recruiter review</button>
            <button className="btn btn-danger" name="decision" value="reject" type="submit">Reject candidate</button>
          </form> : <div className="alert">This candidate is not ready for a final decision. A finalist stage, completed recruiter interview, and scorecard are required.</div>}
          {vetting.admin_notes ? <div className="review-answer"><strong>Previous admin note</strong><p>{vetting.admin_notes}</p></div> : null}
        </div>
      </aside>
    </div>
  </>;
}
