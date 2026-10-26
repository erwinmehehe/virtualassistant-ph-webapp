"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCopy, RotateCcw, Send, ShieldCheck, Users } from "lucide-react";
import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_FOCUS_OPTIONS,
  INTERVIEW_PANEL,
  INTERVIEW_ROUNDS,
  INTERVIEW_RUBRIC,
  practiceFeedback,
  practiceReport,
  questionForRound,
  speakerForRound,
  type InterviewCourse,
  type InterviewDifficulty,
  type InterviewTurn,
} from "@/lib/kiro-mock-interview";

type InterviewMode = "offline" | "ai";
type Stage = "setup" | "interview" | "finished";
type InterviewResponse = {
  feedback?: string[];
  nextQuestion?: string | null;
  finished?: boolean;
  error?: string;
  testOnly?: boolean;
};

export function KiroMockInterview({
  courses,
  initialFocus,
  aiPilotAvailable,
}: {
  courses: InterviewCourse[];
  initialFocus: string;
  aiPilotAvailable: boolean;
}) {
  const initial = INTERVIEW_FOCUS_OPTIONS.find((item) => item === initialFocus) || "General VA";
  const [courseSlug, setCourseSlug] = useState(courses[0]?.slug || "");
  const [focus, setFocus] = useState<(typeof INTERVIEW_FOCUS_OPTIONS)[number]>(initial);
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("beginner");
  const [mode, setMode] = useState<InterviewMode>("offline");
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<Stage>("setup");
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testFixture, setTestFixture] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const course = courses.find((item) => item.slug === courseSlug);
  const round = turns.length;
  const speaker = speakerForRound(Math.min(round, INTERVIEW_ROUNDS - 1));
  const summary = practiceReport(turns);

  function begin() {
    if (!course || (mode === "ai" && (!aiPilotAvailable || !consent))) return;
    requestRef.current?.abort();
    requestRef.current = null;
    setTurns([]);
    setStage("interview");
    setCurrentQuestion(questionForRound({
      courseTitle: course.title, courseSummary: course.summary, focus, difficulty, index: 0,
    }));
    setAnswer("");
    setFeedback([]);
    setError("");
    setCopyStatus("");
    setTestFixture(false);
  }

  function reset() {
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
    setStage("setup");
    setTurns([]);
    setAnswer("");
    setCurrentQuestion("");
    setFeedback([]);
    setError("");
    setTestFixture(false);
    setConsent(false);
    setCopyStatus("");
  }

  async function submitAnswer() {
    const reply = answer.trim();
    if (!course || !reply || busy || requestRef.current || stage !== "interview" || turns.length >= INTERVIEW_ROUNDS) return;
    const nextTurns: InterviewTurn[] = [...turns, { speaker, question: currentQuestion, answer: reply }];
    const finished = nextTurns.length === INTERVIEW_ROUNDS;
    setBusy(true);
    setError("");
    let controller: AbortController | null = null;
    try {
      let notes: string[];
      let nextQuestion = "";
      let mock = false;
      if (mode === "ai") {
        if (!aiPilotAvailable || !consent) throw new Error("AI interviewing is limited to approved, consenting pilot learners.");
        controller = new AbortController();
        requestRef.current = controller;
        const response = await fetch("/api/training/mock-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({ courseSlug, difficulty, focus, turns: nextTurns, consent: true }),
        });
        const data: InterviewResponse = await response.json();
        if (!response.ok || !Array.isArray(data.feedback)) throw new Error(data.error || "The AI interviewer is unavailable.");
        if (data.finished !== finished || (!finished && (!data.nextQuestion || data.nextQuestion.length > 600))) {
          throw new Error("The AI interviewer returned an unexpected reply.");
        }
        notes = data.feedback;
        nextQuestion = data.nextQuestion || "";
        mock = Boolean(data.testOnly);
      } else {
        notes = practiceFeedback(reply);
        if (!finished) {
          nextQuestion = questionForRound({
            courseTitle: course.title, courseSummary: course.summary,
            focus, difficulty, index: nextTurns.length, previousAnswer: reply,
          });
        }
      }
      if (controller?.signal.aborted) return;
      setTurns(nextTurns);
      setFeedback(notes);
      setCurrentQuestion(nextQuestion);
      setStage(finished ? "finished" : "interview");
      setAnswer("");
      setTestFixture(mock);
    } catch (cause) {
      if (controller?.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "This round could not be completed.");
      // Keep the user's answer and previous rounds so they can retry safely.
    } finally {
      if (!controller || requestRef.current === controller) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  }

  async function copyPractice() {
    const transcript = turns.map((item, index) =>
      "Round " + (index + 1) + " — " + INTERVIEW_PANEL[item.speaker].label +
      "\nQ: " + item.question + "\nA: " + item.answer
    ).join("\n\n");
    try {
      await navigator.clipboard.writeText(
        "Kiro fictional mock interview — " + (course?.title || "Training") +
        "\nCoaching only. Not a hiring score or certificate.\n\n" + transcript
      );
      setCopyStatus("Copied to your clipboard. Nothing was saved to your VAPH training account.");
    } catch {
      setCopyStatus("Clipboard access was blocked by the browser.");
    }
  }

  if (courses.length === 0) {
    return (
      <section className="card kiro-interview-empty">
        <h2>Choose a course to start</h2>
        <p>Enroll in one of VAPH's published training courses to unlock an interview based on that course. No assessment result is required.</p>
        <Link href="/workspace/training?browse=1#course-library-title" className="btn btn-primary">Browse training courses <ArrowRight size={15}/></Link>
      </section>
    );
  }

  return (
    <section className="kiro-interview-studio" aria-label="Kiro expert panel mock interview">
      {stage === "setup" ? (
        <div className="kiro-interview-setup">
          <div>
            <span className="kiro-career-eyebrow">YOUR INTERVIEW SETUP</span>
            <h2>Choose what you want to practice.</h2>
            <p>Three fictional interviewers will alternate across six questions. You can change your settings between sessions.</p>
          </div>
          <div className="kiro-interview-form">
            <label htmlFor="kiro-interview-course">Enrolled training course</label>
            <select id="kiro-interview-course" value={courseSlug} onChange={(event) => setCourseSlug(event.target.value)}>
              {courses.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
            </select>
            <label htmlFor="kiro-panel-focus">VA role or focus</label>
            <select id="kiro-panel-focus" value={focus} onChange={(event) => setFocus(event.target.value as typeof focus)}>
              {INTERVIEW_FOCUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label htmlFor="kiro-panel-difficulty">Difficulty</label>
            <select id="kiro-panel-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as InterviewDifficulty)}>
              {INTERVIEW_DIFFICULTIES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
            </select>
            <fieldset>
              <legend>Interview format</legend>
              <label><input type="radio" name="kiro-panel-mode" checked={mode === "offline"} onChange={() => { setMode("offline"); setConsent(false); }}/> Offline guided panel — no AI calls</label>
              <label><input type="radio" name="kiro-panel-mode" checked={mode === "ai"} disabled={!aiPilotAvailable} onChange={() => setMode("ai")}/> Adaptive AI panel — approved pilot only</label>
              {!aiPilotAvailable ? <small>AI conversations are disabled until provider privacy, pilot testing and cost controls are approved. The offline panel works now.</small> : null}
            </fieldset>
            {mode === "ai" ? (
              <label className="kiro-interview-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/>
                I understand my interview answers and limited published training context will be sent to an external AI provider for coaching. I will use fictional examples only.
              </label>
            ) : null}
            <button type="button" className="btn btn-primary kiro-interview-start" disabled={!course || (mode === "ai" && !consent)} onClick={begin}>
              <Users size={17}/> Start six-round mock interview
            </button>
          </div>
          <div className="kiro-interview-panel-list" aria-label="Fictional interview panel">
            {(["recruiter", "client", "trainer"] as const).map((role) => (
              <div key={role}><strong>{INTERVIEW_PANEL[role].label}</strong><span>{INTERVIEW_PANEL[role].role}</span></div>
            ))}
          </div>
        </div>
      ) : null}

      {stage === "interview" ? (
        <div className="kiro-interview-live">
          <div className="kiro-interview-status">
            <span>Round {round + 1} of {INTERVIEW_ROUNDS}</span>
            <span>{mode === "ai" ? "AI panel pilot" : "Offline guided panel"}</span>
          </div>
          <progress max={INTERVIEW_ROUNDS} value={round} aria-label="Interview rounds completed">{round} of {INTERVIEW_ROUNDS}</progress>
          <div className="kiro-interview-question" aria-live="polite">
            <span>{INTERVIEW_PANEL[speaker].label} · {course?.title}</span>
            <h2>{currentQuestion}</h2>
          </div>
          {feedback.length ? (
            <aside className="kiro-interview-feedback" aria-label="Feedback on your previous answer">
              <strong>Previous round — coaching notes</strong>
              <ul>{feedback.map((note) => <li key={note}>{note}</li>)}</ul>
              <small>{mode === "offline" ? "These are simple wording cues, not a quality assessment." : "AI feedback can be inaccurate and does not affect grades or hiring."}</small>
            </aside>
          ) : null}
          <form onSubmit={(event) => { event.preventDefault(); void submitAnswer(); }}>
            <label htmlFor="kiro-panel-answer">Your answer</label>
            <textarea id="kiro-panel-answer" value={answer} maxLength={1200} rows={7} disabled={busy} placeholder="Use fictional details. Describe how you clarify the task, take action, check quality and communicate..." onChange={(event) => setAnswer(event.target.value)}/>
            <small>{answer.length} / 1200 characters</small>
            {error ? <p className="kiro-interview-error" role="alert">{error}</p> : null}
            <div className="kiro-interview-actions">
              <button type="button" className="kiro-interview-secondary" disabled={busy} onClick={reset}><RotateCcw size={15}/> Restart</button>
              <button type="submit" className="btn btn-primary" disabled={!answer.trim() || busy}><Send size={15}/> {busy ? "Reviewing…" : round === INTERVIEW_ROUNDS - 1 ? "Finish and review" : "Submit answer"}</button>
            </div>
          </form>
          <p className="kiro-interview-disclosure"><ShieldCheck size={14}/> {mode === "offline" ? "Your answers stay in this tab; no AI requests are made." : "Your submitted answers are sent to an external AI provider for this approved pilot. They are not saved to your VAPH training account."}</p>
        </div>
      ) : null}

      {stage === "finished" ? (
        <div className="kiro-interview-results">
          <span className="kiro-career-eyebrow"><CheckCircle2 size={16}/> PRACTICE COMPLETE</span>
          <h2>Expert panel practice report</h2>
          <p>You answered {summary.answered} of {summary.total} fictional interview questions for <strong>{course?.title}</strong>. {summary.notice}</p>
          {testFixture ? <p className="kiro-interview-fixture">LOCAL TEST INTERVIEW — simulated responses, not a real AI provider.</p> : null}
          {feedback.length ? <div className="kiro-interview-feedback"><strong>Final coaching notes</strong><ul>{feedback.map((note) => <li key={note}>{note}</li>)}</ul></div> : null}
          <h3>100-point reference rubric — self-review, not an assigned score</h3>
          <div className="kiro-interview-rubric">
            {INTERVIEW_RUBRIC.map((item) => (
              <div key={item.label}>
                <strong>{item.label}<span>{item.weight} pts</span></strong>
                <p>{item.check}</p>
              </div>
            ))}
          </div>
          <h3>Suggested next steps</h3>
          <ul className="kiro-interview-next">{summary.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul>
          <details className="kiro-interview-transcript">
            <summary>Review your six answers</summary>
            <ol>{turns.map((turn, index) => (
              <li key={index}><strong>{INTERVIEW_PANEL[turn.speaker].label}</strong><p>{turn.question}</p><blockquote>{turn.answer}</blockquote></li>
            ))}</ol>
          </details>
          <div className="kiro-interview-actions">
            <button type="button" className="kiro-interview-secondary" onClick={() => { void copyPractice(); }}><ClipboardCopy size={15}/> Copy my practice</button>
            <button type="button" className="btn btn-primary" onClick={reset}><RotateCcw size={15}/> Practice again</button>
          </div>
          <p role="status">{copyStatus}</p>
        </div>
      ) : null}
    </section>
  );
}
