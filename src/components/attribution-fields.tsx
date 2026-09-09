"use client";

import { useEffect, useState } from "react";
import { getBrowserSessionId } from "@/lib/browser-session";

export function AttributionFields({ sourcePath }: { sourcePath: string }) {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(getBrowserSessionId());
  }, []);

  return <>
    <input type="hidden" name="source_path" value={sourcePath} />
    <input type="hidden" name="session_id" value={sessionId} />
  </>;
}
