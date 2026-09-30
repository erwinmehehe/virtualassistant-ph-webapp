"use client";

import { useEffect, useState } from "react";

/**
 * Captures the browser's IANA timezone (for example, Australia/Sydney)
 * without requesting precise location permission. The server validates the
 * value before storing it on a lead.
 */
export function BrowserTimeZoneField() {
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    try {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    } catch {
      setTimeZone("");
    }
  }, []);

  return <input type="hidden" name="timezone" value={timeZone} />;
}
