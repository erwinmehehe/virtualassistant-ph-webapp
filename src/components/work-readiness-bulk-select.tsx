"use client";

export function WorkReadinessBulkSelect({ formId = "work-readiness-bulk" }: { formId?: string }) {
  function setAll(checked: boolean) {
    const boxes = document.querySelectorAll<HTMLInputElement>(`input[form="${formId}"][name="va_id"]`);
    boxes.forEach((box) => { box.checked = checked; });
  }

  return <div className="row wrap">
    <button className="btn btn-sm" type="button" onClick={() => setAll(true)}>Select visible</button>
    <button className="btn btn-sm" type="button" onClick={() => setAll(false)}>Clear</button>
  </div>;
}
