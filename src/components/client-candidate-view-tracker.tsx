"use client";

import { useEffect, useRef } from "react";
import { getBrowserSessionId } from "@/lib/browser-session";

export function ClientCandidateViewTracker({ jobId, vaId }: { jobId: string; vaId: string }) {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !jobId || !vaId) return;

    const storageKey = `client-candidate-viewed:${jobId}:${vaId}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") return;
    } catch {
      // Tracking remains best-effort when sessionStorage is unavailable.
    }

    let sent = false;
    const record = () => {
      if (sent) return;
      sent = true;
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Non-blocking.
      }

      const payload = JSON.stringify({
        event_id: typeof window.crypto?.randomUUID === "function" ? window.crypto.randomUUID() : undefined,
        event: "candidate_viewed",
        path: window.location.pathname,
        session_id: getBrowserSessionId() || undefined,
        metadata: {
          job_id: jobId,
          va_id: vaId,
          surface: "client_hiring_room",
        },
      });

      try {
        if (navigator.sendBeacon) {
          const ok = navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
          if (ok) return;
        }
        void fetch("/api/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        });
      } catch {
        // Analytics must never interrupt client review.
      }
    };

    if (!("IntersectionObserver" in window)) {
      record();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        record();
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    observer.observe(marker);
    return () => observer.disconnect();
  }, [jobId, vaId]);

  return <span ref={markerRef} aria-hidden="true" style={{ display: "block", width: 1, height: 1 }} />;
}
