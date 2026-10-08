"use client";

import { WorkspaceError } from "@/components/workspace-error";

// Keep the learner in Training when a stale browser bundle or transient
// server-action failure crosses the lesson error boundary.
export default function TrainingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <WorkspaceError error={error} reset={reset} home="/workspace/training" />;
}
