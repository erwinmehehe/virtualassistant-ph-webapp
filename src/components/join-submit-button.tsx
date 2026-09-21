"use client";

import { useFormStatus } from "react-dom";

export function JoinSubmitButton({ role }: { role: "client" | "va" }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-lg" type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Creating account…" : role === "client" ? "Create client account" : "Create VA account"}
    </button>
  );
}
