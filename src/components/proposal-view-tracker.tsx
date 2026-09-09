"use client";

import { useEffect } from "react";

export function ProposalViewTracker({ token }: { token: string }) {
  useEffect(() => {
    void fetch("/api/proposals/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true
    }).catch(() => {});
  }, [token]);

  return null;
}
