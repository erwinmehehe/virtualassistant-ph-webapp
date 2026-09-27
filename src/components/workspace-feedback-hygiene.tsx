"use client";

import { useEffect } from "react";

const FLASH_KEY_PATTERN = /(?:^|_)(?:saved|error|sent|removed|confirmed|cancelled|completed|created|updated|released|requested|scheduled|invited|prepared|unavailable|warning|closed|done)$/;

const EXACT_FLASH_KEYS = new Set([
  "message",
  "consent",
  "visibility",
  "accepted",
  "declined",
  "repaired",
  "hidden",
  "archived",
  "categorized",
]);

export function WorkspaceFeedbackHygiene() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const hadBulkResult = url.searchParams.has("bulk_done");
    let changed = false;

    for (const key of [...url.searchParams.keys()]) {
      const isFlashKey = EXACT_FLASH_KEYS.has(key) || FLASH_KEY_PATTERN.test(key);
      const isBulkDetail = hadBulkResult && (key === "affected" || key === "published" || key === "skipped");

      if (isFlashKey || isBulkDetail) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    if (changed) {
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, "", next);
    }
  }, []);

  return null;
}
