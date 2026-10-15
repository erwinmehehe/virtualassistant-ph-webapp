"use client";

import { useRef, useState } from "react";
import { BookOpenCheck, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import type { TrainingCoachMode, TrainingCoachMessage } from "@/lib/training-coach";
import "./training-coach.css";

const STARTERS: Array<{ mode: TrainingCoachMode; label: string; prompt: string }> = [
  {
    mode: "explain",
    label: "Explain this lesson",
    prompt: "Explain the main idea of this lesson in simple steps and ask me a short comprehension question.",
  },
  {
    mode: "practice",
    label: "Practice with a client",
    prompt: "Play a fictional client and give me one realistic VA task based on this lesson. Wait for my response.",
  },
  {
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
}: {
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [mode, setMode] = useState<TrainingCoachMode>("explain");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(1);

  function resetChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
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
          <strong>VAPH AI Coach</strong>
          <small>Lesson help · Virtual Assistant Foundations</small>
        </div>
        {open ? (
          <button type="button" className="training-ai-coach-icon-button" aria-label="Close AI Coach" onClick={() => setOpen(false)}>
            <X size={17}/>
          </button>
        ) : null}
      </div>
      {!open ? (
        <>
          <p>Ask questions, practice client tasks, or get feedback while you learn.</p>
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
                key={starter.mode}
                type="button"
                className={mode === starter.mode ? "is-active" : ""}
                disabled={busy}
                onClick={() => { void sendMessage(starter.prompt, starter.mode); }}
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
                <strong>{message.role === "assistant" ? "VAPH Coach" : "You"}</strong>
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
              placeholder="Ask about this lesson or paste a short practice draft..."
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
            Chat stays in this browser session and is not saved to your VAPH account. Never share passwords or real client details. Coach advice does not affect your grades or certificates.
          </p>
        </div>
      )}
    </section>
  );
}
