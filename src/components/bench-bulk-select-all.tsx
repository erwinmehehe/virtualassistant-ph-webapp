"use client";

export function BenchBulkSelectAll({ formId, checkboxName }: { formId: string; checkboxName: string }) {
  function selectAll() {
    const boxes = document.querySelectorAll<HTMLInputElement>(`input[form="${formId}"][name="${checkboxName}"]`);
    boxes.forEach((box) => { box.checked = true; });
  }

  return <button className="btn btn-sm" type="button" onClick={selectAll}>Select all</button>;
}
