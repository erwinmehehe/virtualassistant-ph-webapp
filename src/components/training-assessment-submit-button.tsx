"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function TrainingAssessmentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn btn-primary"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      data-track="training_assessment_submit_click"
    >
      {pending ? <Loader2 size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
      {pending ? "Submitting final check…" : "Submit final check"}
    </button>
  );
}
