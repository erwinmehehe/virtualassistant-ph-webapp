import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";
import { submitExternalTrainingSpecialistReviewAction } from "@/app/actions/training-specialist-invites";
import { getExternalSpecialistReview } from "@/lib/training-specialist-invites";
import type { LessonContentBlock } from "@/lib/training";
import "./review.css";

export const metadata: Metadata = {
  title: { absolute: "Specialist Course Review | VirtualAssistant.com.ph" },
  description: "Private specialist review for VirtualAssistant.com.ph training content.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function dateLabel(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function ContentBlock({ block }: { block: LessonContentBlock }) {
  if (block.type === "heading") return <h4>{block.text}</h4>;
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "list") return <ul>{block.items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
  if (block.type === "steps") return <ol>{block.items.map((item, index) => <li key={index}>{item}</li>)}</ol>;
  if (block.type === "callout") return <div className="specialist-review-callout">{block.title ? <strong>{block.title}</strong> : null}<p>{block.text}</p></div>;
  if (block.type === "scenario") return <div className="specialist-review-scenario"><span>Practice scenario</span>{block.title ? <strong>{block.title}</strong> : null}<p>{block.text}</p></div>;
  return null;
}

export default async function ExternalSpecialistReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const context = await getExternalSpecialistReview(token, true);

  if (context.state === "invalid") notFound();

  if (context.state === "expired") {
    return (
      <main className="specialist-review-page">
        <section className="specialist-review-shell specialist-review-state">
          <div className="specialist-review-brand">VirtualAssistant.com.ph</div>
          <Clock3 size={34}/>
          <h1>This review link has expired.</h1>
          <p>Ask the training administrator for a new specialist review invite.</p>
        </section>
      </main>
    );
  }

  if (context.state === "submitted" || query.submitted) {
    const approved = query.submitted === "approved";
    return (
      <main className="specialist-review-page">
        <section className="specialist-review-shell specialist-review-state">
          <div className="specialist-review-brand">VirtualAssistant.com.ph</div>
          <CheckCircle2 size={34}/>
          <h1>{approved ? "Specialist review submitted." : "Your requested changes were recorded."}</h1>
          <p>The training team can now see your decision and notes. No further action is required on this link.</p>
        </section>
      </main>
    );
  }

  if (!context.invite || !context.course || !context.definition) notFound();
  const { invite, course, definition } = context;

  return (
    <main className="specialist-review-page">
      <div className="specialist-review-shell">
        <header className="specialist-review-header">
          <div className="specialist-review-brand">VirtualAssistant.com.ph</div>
          <span>Private specialist review</span>
        </header>

        <section className="specialist-review-intro">
          <div className="specialist-review-kicker"><ClipboardCheck size={15}/> {definition.title}</div>
          <h1>{course.title}</h1>
          <p>{course.summary}</p>
          <div className="specialist-review-meta">
            <span><strong>Reviewer</strong>{invite.reviewer_name}</span>
            <span><strong>Role / scope</strong>{invite.reviewer_role}</span>
            <span><strong>Due</strong>{dateLabel(invite.due_at)}</span>
            <span><strong>Content version</strong>v{course.content_version}</span>
          </div>
        </section>

        <section className="specialist-review-guidance">
          <ShieldCheck size={19}/>
          <div>
            <strong>Review the actual operational guidance, not just the outline.</strong>
            <p>{definition.reviewerHint} Check professional boundaries, privacy, escalation, real workflow accuracy, and the final assessment. If something is unsafe or materially wrong, request changes rather than approving around it.</p>
          </div>
        </section>

        {course.trademark_disclaimer ? (
          <section className="specialist-review-notice">
            <strong>Course notice</strong>
            <p>{course.trademark_disclaimer}</p>
          </section>
        ) : null}

        <section className="specialist-review-course">
          <div className="specialist-review-section-head">
            <div>
              <span>Course material</span>
              <h2>Read the lessons and final assessment</h2>
            </div>
            <small>{course.modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</small>
          </div>

          <div className="specialist-review-modules">
            {course.modules.map((module) => (
              <section key={module.id} className="specialist-review-module">
                <div>
                  <span>Module {module.position}</span>
                  <h3>{module.title}</h3>
                  {module.summary ? <p>{module.summary}</p> : null}
                </div>

                <div className="specialist-review-lessons">
                  {module.lessons.map((lesson) => (
                    <details key={lesson.id}>
                      <summary>
                        <span>
                          <strong>{lesson.title}</strong>
                          <small>{lesson.estimated_minutes} min</small>
                        </span>
                        <span>Review lesson</span>
                      </summary>
                      <div className="specialist-review-prose">
                        {lesson.summary ? <p className="specialist-review-summary">{lesson.summary}</p> : null}
                        {lesson.content.map((block, index) => <ContentBlock block={block} key={index}/>)}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {course.assessments.map((assessment) => (
            <section className="specialist-review-assessment" key={assessment.id}>
              <span>Final assessment</span>
              <h3>{assessment.title}</h3>
              <p>{assessment.instructions}</p>
              <div>
                <strong>{assessment.assessment_type === "practical" ? "Practical work simulation" : "Knowledge assessment"}</strong>
                <small>{assessment.pass_score !== null ? `${assessment.pass_score}% pass score` : "Pass score not set"}</small>
              </div>
            </section>
          ))}
        </section>

        <section className="specialist-review-decision">
          <div className="specialist-review-section-head">
            <div>
              <span>Your review</span>
              <h2>Record your decision</h2>
              <p>Approval requires every check below. Use the notes for corrections, limits, source basis, or anything the training team must change.</p>
            </div>
          </div>

          <form action={submitExternalTrainingSpecialistReviewAction}>
            <input type="hidden" name="token" value={token}/>

            <div className="specialist-review-checklist">
              {definition.items.map((item) => (
                <label key={item.id}>
                  <input type="checkbox" name={`check_${item.id}`} value="1"/>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                </label>
              ))}
            </div>

            <label className="specialist-review-notes">
              <span>Review notes and corrections</span>
              <textarea name="notes" required minLength={20} maxLength={5000} rows={8} placeholder="Record what you checked, corrections required or made, current-practice basis, limits, and anything the training team should know."/>
            </label>

            <div className="specialist-review-actions">
              <button type="submit" name="decision" value="changes_requested">Request changes</button>
              <button className="primary" type="submit" name="decision" value="approved">Approve specialist review</button>
            </div>
          </form>
        </section>

        <footer className="specialist-review-footer">
          <span>This review link is private and is not indexed by search engines.</span>
          <span>Approval records specialist evidence. It does not automatically publish the course.</span>
        </footer>
      </div>
    </main>
  );
}
