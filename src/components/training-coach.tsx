"use client";

import { useRef, useState } from "react";
import { BookOpenCheck, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import type { TrainingCoachMode, TrainingCoachMessage } from "@/lib/training-coach";
import "./training-coach.css";

type CoachActivity = "explain" | "plan" | "client" | "interview" | "review";

const STARTERS: Array<{ id: CoachActivity; mode: TrainingCoachMode; label: string; prompt: string }> = [
  {
    id: "explain",
    mode: "explain",
    label: "Explain this lesson",
    prompt: "Explain the main idea of this lesson in simple steps and ask me a short comprehension question.",
  },
  {
    id: "plan",
    mode: "plan",
    label: "15-minute practice plan",
    prompt: "Make a suggested 15-minute study and practice plan for this lesson based on my verified lesson progress. Include one small fictional VA task. Do not grade me.",
  },
  {
    id: "client",
    mode: "practice",
    label: "Practice with a client",
    prompt: "Play a fictional client and give me one realistic VA task based on this lesson. Wait for my response.",
  },
  {
    id: "interview",
    mode: "practice",
    label: "Mock interview",
    prompt: "Act as a fictional VA hiring interviewer. Ask one beginner interview question related to this lesson, wait for my answer, then give practical feedback. Do not imply this is a real hiring decision.",
  },
  {
    id: "review",
    mode: "review",
    label: "Review my work",
    prompt: "Help me improve my work using the lesson checklist. Ask me to paste my draft first.",
  },
];

type DisplayMessage = TrainingCoachMessage & { id: number };

export function TrainingCoach({
  courseSlug,
  lessonId,
  lessonTitle,
  completedLessons,
  lessonCount,
}: {
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
  completedLessons: number;
  lessonCount: number;
}) {
  // Display only verified course data; this is lesson progress, not job readiness.
  const totalLessons = Math.max(0, Math.trunc(lessonCount));
  const finishedLessons = Math.max(0, Math.min(totalLessons, Math.trunc(completedLessons)));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [mode, setMode] = useState<TrainingCoachMode>("explain");
  const [activeActivity, setActiveActivity] = useState<CoachActivity | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(1);

  function resetChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setMode("explain");
    setActiveActivity(null);
    setQuestion("");
    setError(null);
    setBusy(false);
  }

  async function sendMessage(text: string, requestedMode: TrainingCoachMode = mode) {
    const prompt = text.trim();
    if (!prompt || busy || abortRef.current) return;

    const outgoing: DisplayMessage[] = [
      ...messages,
      { id: nextIdRef.current++, role: "user", content: prompt },
    ];
    setMessages(outgoing);
    setMode(requestedMode);
    setQuestion("");
    setError(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // The server, not the browser, fetches and authorizes source lesson content.
      const response = await fetch("/api/training/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          courseSlug,
          lessonId,
          mode: requestedMode,
          messages: outgoing.slice(-7).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data: { reply?: string; error?: string } = await response.json();
      if (!response.ok || !data.reply) {
        throw new Error(data.error || "The coach could not answer right now.");
      }
      if (controller.signal.aborted) return;
      setMessages([
        ...outgoing,
        { id: nextIdRef.current++, role: "assistant", content: data.reply },
      ]);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "The coach could not connect.");
      // Do not send an unanswered user turn as if it were part of successful history.
      setMessages(messages);
      setQuestion(prompt);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <section className="card training-ai-coach" aria-label="VAPH AI Coach">
      <div className="training-ai-coach-head">
        <span className="training-ai-coach-mark" aria-hidden="true"><Sparkles size={18}/></span>
        <div className="training-ai-coach-title">
          <strong>Kiro · VAPH AI Coach</strong>
          <small>Your Virtual Assistant Foundations companion</small>
        </div>
        {open ? (
          <button type="button" className="training-ai-coach-icon-button" aria-label="Close AI Coach" onClick={() => setOpen(false)}>
            <X size={17}/>
          </button>
        ) : null}
      </div>
      <div className="training-ai-coach-progress">
        <div className="training-ai-coach-progress-label">
          <span>Foundation lessons completed</span>
          <strong>{finishedLessons} of {totalLessons}</strong>
        </div>
        <progress aria-label="Virtual Assistant Foundations lessons completed" value={finishedLessons} max={Math.max(1, totalLessons)}>
          {finishedLessons} of {totalLessons}
        </progress>
      </div>
      {!open ? (
        <>
          <p>Ask Kiro for a short practice plan, try a fictional client task or mock interview, or get feedback on your work. Coaching is optional and not graded.</p>
          <button type="button" className="btn btn-primary training-ai-coach-start" onClick={() => setOpen(true)}>
            <MessageCircle size={15}/> Ask your coach
          </button>
        </>
      ) : (
        <div className="training-ai-coach-open">
          <div className="training-ai-coach-context">
            <BookOpenCheck size={14}/>
            <span title={lessonTitle}>Based on: {lessonTitle}</span>
          </div>
          <div className="training-ai-coach-starters" aria-label="Coach activities">
            {STARTERS.map((starter) => (
              <button
                key={starter.id}
                type="button"
                className={activeActivity === starter.id ? "is-active" : ""}
                aria-pressed={activeActivity === starter.id}
                disabled={busy}
                onClick={() => {
                  setActiveActivity(starter.id);
                  void sendMessage(starter.prompt, starter.mode);
                }}
              >
                {starter.label}
              </button>
            ))}
          </div>
          <div className="training-ai-coach-log" role="log" aria-label="Coaching conversation" aria-live="polite">
            {messages.length === 0 ? (
              <p className="training-ai-coach-welcome">Choose an activity or ask a question about this lesson.</p>
            ) : messages.map((message) => (
              <div
                key={message.id}
                className={"training-ai-coach-message " + (message.role === "assistant" ? "is-coach" : "is-learner")}
              >
                <strong>{message.role === "assistant" ? "Kiro" : "You"}</strong>
                <p>{message.content}</p>
              </div>
            ))}
            {busy ? <p className="training-ai-coach-thinking" role="status">Coach is thinking…</p> : null}
          </div>
          {error ? <p role="alert" className="training-ai-coach-error">{error}</p> : null}
          <form
            className="training-ai-coach-form"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(question);
            }}
          >
            <label htmlFor="training-coach-question">Your question or draft</label>
            <textarea
              id="training-coach-question"
              value={question}
              maxLength={800}
              disabled={busy}
              placeholder="Ask Kiro about this lesson or paste a short fictional practice draft..."
              rows={3}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <div className="training-ai-coach-form-actions">
              <button type="button" className="training-ai-coach-reset" disabled={busy || (messages.length === 0 && !question)} onClick={resetChat}>
                <RotateCcw size={14}/> Clear chat
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !question.trim()}>
                <Send size={14}/> Send
              </button>
            </div>
          </form>
          <p className="training-ai-coach-privacy">
            Your messages are sent to an AI provider to generate replies. VAPH does not save this chat to your training account, and the conversation clears when you leave the lesson. Never share passwords or real client details. Coach advice does not affect your grades or certificates.
          </p>
        </div>
      )}
    </section>
  );
}
