"use client";

import { useEffect, useState } from "react";

export function AttributionFields({ sourcePath }: { sourcePath: string }) {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    try {
      const key = "va_ph_session";
      let value = window.sessionStorage.getItem(key);
      if (!value) {
        value = crypto.randomUUID();
        window.sessionStorage.setItem(key, value);
      }
      setSessionId(value);
    } catch {
      // Attribution is best-effort and must never block form submission.
    }
  }, []);

  return <>
    <input type="hidden" name="source_path" value={sourcePath} />
    <input type="hidden" name="session_id" value={sessionId} />
  </>;
}
