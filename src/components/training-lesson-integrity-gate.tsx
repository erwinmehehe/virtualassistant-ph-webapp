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
  completionLabel,
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
  completionLabel: string;
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
    checkpointAlreadyPassed ? "Quick check complete." : "",
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
      label: "Spend a little time with the lesson",
      action: "spend a little more active time here",
      ready: timeReady,
      detail: timeReady
        ? "Enough active time recorded"
        : `${timeLabel(Math.min(activeSeconds, requiredActiveSeconds))} of about ${timeLabel(requiredActiveSeconds)} active time`,
      icon: Clock3,
    },
    {
      label: "Reach the lesson end",
      action: "reach the lesson end",
      ready: readingReady,
      detail: readingReady ? "Lesson content reached" : `${Math.min(maxScrollPercent, 100)}% viewed`,
      icon: Gauge,
    },
    {
      label: "Answer the quick check",
      action: "answer the quick check",
      ready: checkpointPassed,
      detail: checkpointPassed ? "Complete" : "One short question",
      icon: ShieldCheck,
    },
    {
      label: "Add your practical note",
      action: "add your practical note",
      ready: exerciseReady,
      detail: requiresExercise
        ? exerciseReady
          ? "Practical note added"
          : "A few useful sentences are enough"
        : "Not needed for this lesson",
      icon: FileCheck2,
    },
  ], [
    activeSeconds,
    checkpointPassed,
    exerciseReady,
    maxScrollPercent,
    readingReady,
    requiredActiveSeconds,
    requiresExercise,
    timeReady,
  ]);

  const remainingActions = readiness.filter((item) => !item.ready).map((item) => item.action);
  const remainingText = remainingActions.length
    ? `Still to do: ${remainingActions.join(", ")}.`
    : "Everything is ready. You can complete the lesson.";

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
        setCheckpointMessage("Correct. Your quick check is saved.");
      } else {
        setCheckpointPassed(false);
        setCheckpointMessage("Not quite. Review the relevant part of the lesson, then try again.");
      }
    });
  }

  return (
    <section className="training-integrity-gate" aria-label="Lesson completion">
      <div className="training-integrity-head">
        <div>
          <span className="dash-kicker">Lesson wrap-up</span>
          <h3>Ready to complete this lesson?</h3>
          <p>
            A few quick checks confirm you reached the lesson end, understood the key point,
            and completed the practical work.
          </p>
        </div>
      </div>

      <div className="training-integrity-status-grid">
        {readiness.map((item) => {
          const Icon = item.icon;
          return (
            <div className={item.ready ? "is-ready" : ""} key={item.label}>
              <span className="training-integrity-status-icon">
                {item.ready ? <CheckCircle2 size={16}/> : <Icon size={16}/>}
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
          <div className="training-inline-checkpoint-head">
            <span className="dash-kicker">Quick check</span>
            <strong>{checkpoint.prompt}</strong>
          </div>
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
            {checkpointMessage ? <span className="training-checkpoint-message" role="status">{checkpointMessage}</span> : null}
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
            <span>Your practical note</span>
            <textarea
              name="exercise_response"
              rows={5}
              minLength={80}
              maxLength={5000}
              required
              value={exerciseResponse}
              onChange={(event) => setExerciseResponse(event.target.value)}
              placeholder="Describe what you would do, what evidence you would use, or what you would hand off."
            />
            <small>
              A few useful sentences are enough. Use fictional or non-sensitive details only.
            </small>
          </label>
        ) : (
          <input type="hidden" name="exercise_response" value=""/>
        )}

        <div className="training-integrity-finish">
          <button
            className="btn btn-primary training-integrity-complete"
            type="submit"
            disabled={!ready}
            data-track="training_lesson_complete_click"
          >
            {ready ? <CheckCircle2 size={15}/> : <Circle size={15}/>}
            {ready ? completionLabel : "Complete lesson when ready"}
          </button>
          <p className={ready ? "is-ready" : ""} aria-live="polite">{remainingText}</p>
        </div>
      </form>
    </section>
  );
}
