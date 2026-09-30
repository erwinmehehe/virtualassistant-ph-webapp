"use client";

import { useEffect, useState } from "react";

const DRAFT_PREFIX = "va_role_brief_v1:";

export function FormDraftPersistence({ formId, storageKey }: { formId: string; storageKey: string }) {
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const key = `${DRAFT_PREFIX}${storageKey}`;
    if (new URLSearchParams(window.location.search).get("sent") === "1") {
      try { localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, string>;
      for (const [name, value] of Object.entries(saved)) {
        const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
        if (field && field.type !== "file" && !field.value) field.value = value;
      }
      setRestored(Object.keys(saved).length > 0);
    } catch { /* storage may be unavailable */ }

    const save = () => {
      const values: Record<string, string> = {};
      for (const field of Array.from(form.elements)) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue;
        if (!field.name || field.type === "file" || field.type === "hidden" || field.name === "website") continue;
        if (field.value.trim()) values[field.name] = field.value;
      }
      try { localStorage.setItem(key, JSON.stringify(values)); } catch { /* storage may be unavailable */ }
    };
    form.addEventListener("input", save);
    form.addEventListener("change", save);
    return () => { form.removeEventListener("input", save); form.removeEventListener("change", save); };
  }, [formId, storageKey]);

  return <p className="form-draft-note" aria-live="polite">{restored ? "Draft restored from this device." : "Your progress is saved on this device."}</p>;
}
