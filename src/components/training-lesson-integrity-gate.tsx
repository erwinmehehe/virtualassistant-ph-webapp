"use client";

import { CheckCircle2, Circle, Clock3, FileCheck2, Gauge, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  checkTrainingLessonCheckpointAction,
  markTrainingLessonCompleteAction,
  recordTrainingLessonEngagementAction,
} from "@/app/actions/training";

type Checkpoint = {
  prompt: string;
  options: Array<{ id: string; text: string }>;
};

function timeLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export function TrainingLessonIntegrityGate({
  lessonId,
  courseSlug,
  nextHref,
  requiredActiveSeconds,
  initialActiveSeconds,
  initialScrollPercent,
  checkpoint,
  checkpointAlreadyPassed,
  requiresExercise,
  initialExerciseResponse,
}: {
  lessonId: string;
  courseSlug: string;
  nextHref: string;
  requiredActiveSeconds: number;
  initialActiveSeconds: number;
  initialScrollPercent: number;
  checkpoint: Checkpoint | null;
  checkpointAlreadyPassed: boolean;
  requiresExercise: boolean;
  initialExerciseResponse: string;
}) {
  const [activeSeconds, setActiveSeconds] = useState(initialActiveSeconds);
  const [maxScrollPercent, setMaxScrollPercent] = useState(initialScrollPercent);
  const [selectedOption, setSelectedOption] = useState("");
  const [checkpointPassed, setCheckpointPassed] = useState(checkpointAlreadyPassed || !checkpoint);
  const [checkpointMessage, setCheckpointMessage] = useState(
    checkpointAlreadyPassed ? "Checkpoint passed." : "",
  );
  const [exerciseResponse, setExerciseResponse] = useState(initialExerciseResponse || "");
  const [isChecking, startChecking] = useTransition();
  const lastInteractionAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;

    function readingProgress() {
      const marker = document.querySelector(`[data-training-content-end="${lessonId}"]`);
      if (marker instanceof HTMLElement && marker.getBoundingClientRect().top <= window.innerHeight * 0.9) {
        return 100;
      }
      const root = document.documentElement;
      const total = Math.max(1, root.scrollHeight - window.innerHeight);
      return Math.max(0, Math.min(100, Math.round((window.scrollY / total) * 100)));
    }

    function markInteraction() {
      lastInteractionAt.current = Date.now();
    }

    function captureScroll() {
      markInteraction();
      setMaxScrollPercent((current) => Math.max(current, readingProgress()));
    }

    async function heartbeat() {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      if (Date.now() - lastInteractionAt.current > 45_000) return;
      const scrollPercent = readingProgress();
      try {
        const result = await recordTrainingLessonEngagementAction({
          lessonId,
          courseSlug,
          scrollPercent,
        });
        if (!cancelled) {
          setActiveSeconds(Number(result.activeSeconds || 0));
          setMaxScrollPercent((current) => Math.max(current, Number(result.maxScrollPercent || 0)));
        }
      } catch {
        // Keep the learner on the lesson; the server-side completion gate remains authoritative.
      }
    }

    captureScroll();
    void heartbeat();
    window.addEventListener("scroll", captureScroll, { passive: true });
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);
    window.addEventListener("touchstart", markInteraction, { passive: true });
    const timer = window.setInterval(() => void heartbeat(), 20_000);

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", captureScroll);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      window.clearInterval(timer);
    };
  }, [courseSlug, lessonId]);

  const readingReady = maxScrollPercent >= 85;
  const timeReady = activeSeconds >= requiredActiveSeconds;
  const exerciseReady = !requiresExercise || exerciseResponse.trim().length >= 80;
  const ready = readingReady && timeReady && checkpointPassed && exerciseReady;

  const readiness = useMemo(() => [
    {
      label: "Active reading",
      ready: timeReady,
      detail: `${timeLabel(Math.min(activeSeconds, requiredActiveSeconds))} / ${timeLabel(requiredActiveSeconds)}`,
      icon: Clock3,
    },
    {
      label: "Lesson content",
      ready: readingReady,
      detail: readingReady ? "Reached the lesson end" : `${Math.min(maxScrollPercent, 100)}% viewed`,
      icon: Gauge,
    },
    {
      label: "Knowledge checkpoint",
      ready: checkpointPassed,
      detail: checkpointPassed ? "Passed" : "Answer one lesson check",
      icon: ShieldCheck,
    },
    {
      label: "Practical response",
      ready: exerciseReady,
      detail: requiresExercise
        ? exerciseReady
          ? "Response added"
          : `${exerciseResponse.trim().length}/80 characters`
        : "Not required",
      icon: FileCheck2,
    },
  ], [
    activeSeconds,
    checkpointPassed,
    exerciseReady,
    exerciseResponse,
    maxScrollPercent,
    readingReady,
    requiredActiveSeconds,
    requiresExercise,
    timeReady,
  ]);

  function checkAnswer() {
    if (!checkpoint || !selectedOption) return;
    startChecking(async () => {
      const result = await checkTrainingLessonCheckpointAction({
        lessonId,
        courseSlug,
        optionId: selectedOption,
      });
      if (result.correct) {
        setCheckpointPassed(true);
        setCheckpointMessage("Correct. This checkpoint is saved.");
      } else {
        setCheckpointPassed(false);
        setCheckpointMessage("Not quite. Review the lesson QA checklist and try again.");
      }
    });
  }

  return (
    <section className="training-integrity-gate" aria-label="Lesson completion requirements">
      <div className="training-integrity-head">
        <div>
          <span className="dash-kicker">Before you complete this lesson</span>
          <h3>Show that you worked through it</h3>
          <p>
            There is no fixed 30-minute timer. Completion uses active reading, content progress,
            one lesson check, and the practical task.
          </p>
        </div>
      </div>

      <div className="training-integrity-status-grid">
        {readiness.map((item) => {
          const Icon = item.icon;
          return (
            <div className={item.ready ? "is-ready" : ""} key={item.label}>
              <span className="training-integrity-status-icon">
                {item.ready ? <CheckCircle2 size={15}/> : <Icon size={15}/>}
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </div>
          );
        })}
      </div>

      {checkpoint && !checkpointPassed ? (
        <div className="training-inline-checkpoint">
          <strong>{checkpoint.prompt}</strong>
          <div className="training-checkpoint-options">
            {checkpoint.options.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name="lesson_checkpoint_preview"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => {
                    setSelectedOption(option.id);
                    setCheckpointMessage("");
                  }}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
          <div className="training-checkpoint-actions">
            <button
              className="btn btn-sm"
              type="button"
              disabled={!selectedOption || isChecking}
              onClick={checkAnswer}
            >
              {isChecking ? "Checking…" : "Check answer"}
            </button>
            {checkpointMessage ? <span className="small muted">{checkpointMessage}</span> : null}
          </div>
        </div>
      ) : checkpointMessage ? (
        <div className="success-banner training-checkpoint-success" role="status">
          <CheckCircle2 size={15}/> {checkpointMessage}
        </div>
      ) : null}

      <form action={markTrainingLessonCompleteAction} className="training-integrity-complete-form">
        <input type="hidden" name="lesson_id" value={lessonId}/>
        <input type="hidden" name="course_slug" value={courseSlug}/>
        <input type="hidden" name="continue_to" value={nextHref}/>

        {requiresExercise ? (
          <label className="field training-integrity-response">
            <span>Your practical response</span>
            <textarea
              name="exercise_response"
              rows={6}
              minLength={80}
              maxLength={5000}
              required
              value={exerciseResponse}
              onChange={(event) => setExerciseResponse(event.target.value)}
              placeholder="Write what you would actually do, what evidence you would use, and what you would hand off or escalate."
            />
            <small>
              This is saved as evidence that you completed the practical checkpoint. Do not paste passwords,
              private client data, or confidential documents.
            </small>
          </label>
        ) : (
          <input type="hidden" name="exercise_response" value=""/>
        )}

        <button
          className="btn btn-primary training-integrity-complete"
          type="submit"
          disabled={!ready}
          data-track="training_lesson_complete_click"
        >
          {ready ? <CheckCircle2 size={15}/> : <Circle size={15}/>}
          {ready ? "Complete lesson" : "Finish the requirements above"}
        </button>
      </form>
    </section>
  );
}
