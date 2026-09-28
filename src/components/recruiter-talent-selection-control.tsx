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
  totalCount,
  filteredSelectionAllowed,
}: {
  formId: string;
  pageCount: number;
  totalCount: number;
  filteredSelectionAllowed: boolean;
}) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [allFiltered, setAllFiltered] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const update = (event?: Event) => {
      if (event?.target instanceof HTMLInputElement && event.target.name === "va_id") {
        setAllFiltered(false);
      }
      setSelectedCount(rowCheckboxes(formId).filter((checkbox) => checkbox.checked).length);
    };
    update();
    form.addEventListener("change", update);
    return () => form.removeEventListener("change", update);
  }, [formId]);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    form.dataset.selectionActive = selectedCount > 0 || allFiltered ? "true" : "false";
  }, [formId, selectedCount, allFiltered]);

  const allPageSelected = pageCount > 0 && selectedCount === pageCount;

  function setPageSelection(checked: boolean) {
    for (const checkbox of rowCheckboxes(formId)) checkbox.checked = checked;
    setSelectedCount(checked ? pageCount : 0);
  }

  function togglePage() {
    setAllFiltered(false);
    setPageSelection(!allPageSelected);
  }

  function toggleAllFiltered() {
    if (allFiltered) {
      setAllFiltered(false);
      setPageSelection(false);
      return;
    }
    if (!filteredSelectionAllowed) return;
    setPageSelection(true);
    setAllFiltered(true);
  }

  return (
    <div className="talent-selection-row">
      <input type="hidden" name="selection_scope" value={allFiltered ? "filtered" : ""} />
      <div className="talent-selection-control">
        <button type="button" className="btn btn-sm" onClick={togglePage} disabled={!pageCount}>
          {allPageSelected && !allFiltered ? "Clear page" : "Select page (" + pageCount + ")"}
        </button>
        {totalCount > pageCount ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleAllFiltered}
            disabled={!filteredSelectionAllowed}
            title={filteredSelectionAllowed ? undefined : "Narrow the filters before selecting all results."}
          >
            {allFiltered
              ? "Clear all results"
              : filteredSelectionAllowed
                ? "Select all " + totalCount + " results"
                : "All " + totalCount + " exceeds limit"}
          </button>
        ) : null}
        <span>
          {allFiltered
            ? "All " + totalCount + " filtered selected"
            : selectedCount
              ? selectedCount + " selected"
              : "No rows selected"}
        </span>
      </div>
    </div>
  );
}
