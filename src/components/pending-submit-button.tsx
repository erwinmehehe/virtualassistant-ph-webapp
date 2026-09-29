"use client";

import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  label,
  pendingLabel,
  className = "btn btn-primary",
  name,
  value,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" name={name} value={value} disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
