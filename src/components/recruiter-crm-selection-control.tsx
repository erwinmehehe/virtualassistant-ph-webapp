"use client";

import { useEffect, useState } from "react";
import styles from "./recruiter-crm-selection-control.module.css";

function rowCheckboxes(formId: string) {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) return [] as HTMLInputElement[];
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[name="lead_id"][type="checkbox"]'));
}

export function RecruiterCrmSelectionControl({
  formId,
  rowCount,
}: {
  formId: string;
  rowCount: number;
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

  const allSelected = rowCount > 0 && selectedCount === rowCount;

  function setSelection(checked: boolean) {
    for (const checkbox of rowCheckboxes(formId)) checkbox.checked = checked;
    setSelectedCount(checked ? rowCount : 0);
  }

  return (
    <div className={styles.control} aria-live="polite">
      <button type="button" onClick={() => setSelection(!allSelected)} disabled={!rowCount}>
        {allSelected ? "Clear selection" : `Select all visible (${rowCount})`}
      </button>
      <span>{selectedCount ? `${selectedCount} selected` : "No clients selected"}</span>
    </div>
  );
}
