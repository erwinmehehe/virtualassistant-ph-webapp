"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, ClipboardCopy, FileText, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import {
  careerScenarioForCategory,
  createPortfolioOutline,
  createResumeExample,
  interviewPracticeTips,
  type ResumeEvidence,
} from "@/lib/kiro-career-coach";

type PracticeTab = "resume" | "portfolio" | "interview";
const FOCUS_OPTIONS = [
  "General VA",
  "Administrative Support",
  "Executive Assistance",
  "Customer Service",
  "SEO",
  "Marketing & Social Media",
  "Ecommerce",
  "Bookkeeping & Finance",
  "Dental & Healthcare",
  "Real Estate",
  "Lead Generation & Sales",
];

export function KiroCareerStudio({
  initialFocus,
  verifiedTools,
  vaAccount,
}: {
  initialFocus: string;
  verifiedTools: string[];
  vaAccount: boolean;
}) {
  const [tab, setTab] = useState<PracticeTab>("resume");
  const [focus, setFocus] = useState(initialFocus || "General VA");
  const [evidence, setEvidence] = useState<ResumeEvidence>("practice");
  const [resumeTask, setResumeTask] = useState("");
  const [resumeTools, setResumeTools] = useState("");
  const [resumeResult, setResumeResult] = useState("");
  const [project, setProject] = useState("");
  const [portfolioTask, setPortfolioTask] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [portfolioTools, setPortfolioTools] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const scenario = careerScenarioForCategory(focus);
  const resumeDraft = createResumeExample({
    evidence, task: resumeTask, tools: resumeTools, result: resumeResult,
  });
  const portfolioDraft = createPortfolioOutline({
    project, task: portfolioTask, deliverable, tools: portfolioTools,
  });
  const feedback = showFeedback ? interviewPracticeTips(interviewAnswer) : [];

  function switchTab(next: PracticeTab) {
    setTab(next);
    setCopyStatus("");
  }

  async function copy(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied. Your text is still not saved to VAPH.");
    } catch {
      setCopyStatus("Copy was blocked by your browser. Select the text in the preview to copy it manually.");
    }
  }

  const options = FOCUS_OPTIONS.includes(focus) ? FOCUS_OPTIONS : [focus, ...FOCUS_OPTIONS];

  return (
    <div className="kiro-studio">
      <div className="kiro-studio-header">
        <div className="kiro-studio-heading">
          <span className="kiro-studio-mark"><Sparkles size={20}/></span>
          <div>
            <h3>Kiro practice tools</h3>
            <p>Structured writing prompts and fictional scenarios you control.</p>
          </div>
        </div>
        <span className="kiro-studio-local"><ShieldCheck size={14}/> Browser-only drafts</span>
      </div>

      <div className="kiro-studio-tabs" role="tablist" aria-label="Career practice tools">
        <button id="kiro-tab-resume" role="tab" aria-selected={tab === "resume"} aria-controls="kiro-panel-resume" className={tab === "resume" ? "is-current" : ""} type="button" onClick={() => switchTab("resume")}>
          <FileText size={17}/> Resume lab
        </button>
        <button id="kiro-tab-portfolio" role="tab" aria-selected={tab === "portfolio"} aria-controls="kiro-panel-portfolio" className={tab === "portfolio" ? "is-current" : ""} type="button" onClick={() => switchTab("portfolio")}>
          <BookOpenText size={17}/> Portfolio builder
        </button>
        <button id="kiro-tab-interview" role="tab" aria-selected={tab === "interview"} aria-controls="kiro-panel-interview" className={tab === "interview" ? "is-current" : ""} type="button" onClick={() => switchTab("interview")}>
          <MessageCircle size={17}/> Interview practice
        </button>
      </div>

      {tab === "resume" ? (
        <section className="kiro-studio-panel" id="kiro-panel-resume" role="tabpanel" aria-labelledby="kiro-tab-resume">
          <div className="kiro-studio-intro">
            <span>01 / RESUME LAB</span>
            <h4>Turn an actual task or a practice exercise into a truthful example.</h4>
            <p>Only describe work you really did. If you're learning, choose a practice example instead of presenting a simulated project as paid experience.</p>
          </div>
          <div className="kiro-studio-two-column">
            <div className="kiro-studio-fields">
              <fieldset className="kiro-studio-evidence">
                <legend>What kind of experience is this?</legend>
                <label><input type="radio" name="kiro-evidence" checked={evidence === "practice"} onChange={() => setEvidence("practice")}/> Practice exercise</label>
                <label><input type="radio" name="kiro-evidence" checked={evidence === "real"} onChange={() => setEvidence("real")}/> Actual work I performed</label>
              </fieldset>
              <label htmlFor="kiro-resume-task">What did you actually do? <span>Required</span></label>
              <textarea id="kiro-resume-task" value={resumeTask} maxLength={220} rows={3} placeholder="Example: Organized a fictional client inbox and created a daily priority list" onChange={(event) => setResumeTask(event.target.value)}/>
              <label htmlFor="kiro-resume-tools">Tools you used <span>Optional</span></label>
              <input id="kiro-resume-tools" value={resumeTools} maxLength={120} placeholder="Example: Gmail and Google Sheets" onChange={(event) => setResumeTools(event.target.value)}/>
              {verifiedTools.length ? <small className="kiro-studio-tool-hint">Tools listed on your profile: {verifiedTools.join(" · ")}. Only mention tools you actually used.</small> : null}
              <label htmlFor="kiro-resume-result">Result you can support <span>Optional</span></label>
              <textarea id="kiro-resume-result" value={resumeResult} maxLength={220} rows={2} placeholder="Example: Prepared a clear handoff checklist (do not invent numbers)" onChange={(event) => setResumeResult(event.target.value)}/>
            </div>
            <div className="kiro-studio-preview" aria-live="polite">
              <span>YOUR EDITABLE EXAMPLE</span>
              <h5>{evidence === "practice" ? "Practice project statement" : "Work experience statement"}</h5>
              <div className="kiro-studio-output">{resumeDraft || "Describe a real task to preview a statement. You can copy and edit it before using it anywhere."}</div>
              <button className="kiro-studio-copy" type="button" disabled={!resumeDraft} onClick={() => { void copy(resumeDraft); }}><ClipboardCopy size={15}/> Copy example</button>
              <p>Review the wording before use. Kiro does not verify employment claims, outcomes, tools or credentials.</p>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "portfolio" ? (
        <section className="kiro-studio-panel" id="kiro-panel-portfolio" role="tabpanel" aria-labelledby="kiro-tab-portfolio">
          <div className="kiro-studio-intro">
            <span>02 / PORTFOLIO BUILDER</span>
            <h4>Show your process with a clearly labeled sample project.</h4>
            <p>A fictional client project can demonstrate practice without sharing private client files or suggesting you were hired.</p>
          </div>
          <div className="kiro-studio-two-column">
            <div className="kiro-studio-fields">
              <label htmlFor="kiro-project-title">Name your sample project <span>Required</span></label>
              <input id="kiro-project-title" value={project} maxLength={120} placeholder="Example: Fictional weekly client handoff" onChange={(event) => setProject(event.target.value)}/>
              <label htmlFor="kiro-project-brief">What did the fictional client need? <span>Required</span></label>
              <textarea id="kiro-project-brief" value={portfolioTask} maxLength={220} rows={3} placeholder="Example: A weekly task summary with open questions and next steps" onChange={(event) => setPortfolioTask(event.target.value)}/>
              <label htmlFor="kiro-project-deliverable">What sample deliverable did you create? <span>Optional</span></label>
              <textarea id="kiro-project-deliverable" value={deliverable} maxLength={220} rows={2} placeholder="Example: A one-page weekly status update" onChange={(event) => setDeliverable(event.target.value)}/>
              <label htmlFor="kiro-project-tools">Tools practiced <span>Optional</span></label>
              <input id="kiro-project-tools" value={portfolioTools} maxLength={120} placeholder="Example: Sheets, Docs" onChange={(event) => setPortfolioTools(event.target.value)}/>
            </div>
            <div className="kiro-studio-preview" aria-live="polite">
              <span>PORTFOLIO OUTLINE</span>
              <h5>Fictional work sample</h5>
              <div className="kiro-studio-output">{portfolioDraft || "Enter a project title and fictional brief to create a practice portfolio outline."}</div>
              <button className="kiro-studio-copy" type="button" disabled={!portfolioDraft} onClick={() => { void copy(portfolioDraft); }}><ClipboardCopy size={15}/> Copy outline</button>
              {vaAccount ? <Link className="kiro-studio-profile-link" href="/workspace/va/profile/preview">Preview your VA profile <ArrowRight size={14}/></Link> : null}
              <p>Use dummy data. Do not upload proprietary client documents, personal records, real passwords or regulated data.</p>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "interview" ? (
        <section className="kiro-studio-panel" id="kiro-panel-interview" role="tabpanel" aria-labelledby="kiro-tab-interview">
          <div className="kiro-studio-intro">
            <span>03 / MOCK INTERVIEW</span>
            <h4>Practice explaining how you'd handle a real-world VA task.</h4>
            <p>Choose your preferred specialty. This is a fictional practice question, not a job interview, recruiter evaluation or AI-generated hiring score.</p>
          </div>
          <div className="kiro-studio-two-column">
            <div className="kiro-studio-fields">
              <label htmlFor="kiro-interview-focus">VA area to practice</label>
              <select id="kiro-interview-focus" value={focus} onChange={(event) => { setFocus(event.target.value); setInterviewAnswer(""); setShowFeedback(false); }}>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <div className="kiro-studio-question"><span>{scenario.focus} · Practice question</span><strong>{scenario.question}</strong></div>
              <label htmlFor="kiro-interview-answer">Your answer</label>
              <textarea id="kiro-interview-answer" value={interviewAnswer} maxLength={1600} rows={7} placeholder="Explain your first action, how you would check the details, what needs approval, and how you would report back..." onChange={(event) => { setInterviewAnswer(event.target.value); setShowFeedback(false); }}/>
              <button className="kiro-studio-review" type="button" disabled={!interviewAnswer.trim()} onClick={() => setShowFeedback(true)}>Review my answer <ArrowRight size={15}/></button>
            </div>
            <div className="kiro-studio-preview kiro-studio-feedback" aria-live="polite">
              <span>SELF-REVIEW NOTES</span>
              <h5>{showFeedback ? "Ways to strengthen your answer" : "A simple interview practice loop"}</h5>
              {showFeedback ? (
                <>
                  <ul>{feedback.map((tip) => <li key={tip}><CheckCircle2 size={16}/><span>{tip}</span></li>)}</ul>
                  <h6>Compare with the scenario checklist</h6>
                  <ul>{scenario.coachingPoints.map((point) => <li key={point}><CheckCircle2 size={16}/><span>{point}</span></li>)}</ul>
                </>
              ) : (
                <ol>
                  <li>Read the fictional scenario.</li>
                  <li>Write how you would verify details and take action.</li>
                  <li>Explain approval, escalation and client updates.</li>
                  <li>Review the checklist and revise your draft.</li>
                </ol>
              )}
              <p>Feedback checks for common writing cues; it cannot verify accuracy or determine job readiness. Practicing does not change any VAPH assessment.</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="kiro-studio-footer">
        <span><ShieldCheck size={15}/> No draft uploads, AI model calls, grading or automatic profile changes.</span>
        {vaAccount ? <Link href="/workspace/va/profile#professional">Update my VA profile <ArrowRight size={14}/></Link> : <Link href="/workspace/training">Continue my training <ArrowRight size={14}/></Link>}
      </div>
      <p className="kiro-studio-copy-status" role="status">{copyStatus}</p>
    </div>
  );
}
