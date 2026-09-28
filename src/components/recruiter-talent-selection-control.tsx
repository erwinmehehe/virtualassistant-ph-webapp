"use client";

import { useEffect, useState } from "react";

function rowCheckboxes(formId: string) {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) return [] as HTMLInputElement[];
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[name="va_id"][type="checkbox"]'));
}

export function RecruiterTalentSelectionControl({
  formId,
  pageCount,
}: {
  formId: string;
  pageCount: number;
}) {
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const update = () => {
      setSelectedCount(rowCheckboxes(formId).filter((checkbox) => checkbox.checked).length);
    };
    update();
    form.addEventListener("change", update);
    return () => form.removeEventListener("change", update);
  }, [formId]);

  const allSelected = pageCount > 0 && selectedCount === pageCount;

  function togglePage() {
    for (const checkbox of rowCheckboxes(formId)) {
      checkbox.checked = !allSelected;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  return (
    <div className="talent-selection-control">
      <button type="button" className="btn btn-sm" onClick={togglePage} disabled={!pageCount}>
        {allSelected ? "Clear page" : "Select page (" + pageCount + ")"}
      </button>
      <span>{selectedCount ? selectedCount + " selected" : "No rows selected"}</span>
    </div>
  );
}
