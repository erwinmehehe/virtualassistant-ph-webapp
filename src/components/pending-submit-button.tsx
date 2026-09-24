"use client";

import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  label,
  pendingLabel,
  className = "btn btn-primary",
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
