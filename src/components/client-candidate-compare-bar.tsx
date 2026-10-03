"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Columns3 } from "lucide-react";

export function ClientCandidateCompareBar({
  candidates,
}: {
  candidates: Array<{ id: string; label: string }>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const href = useMemo(() => {
    const params = new URLSearchParams();
    selected.slice(0, 4).forEach((id) => params.append("ids", id));
    return `/workspace/client/compare?${params.toString()}`;
  }, [selected]);

  if (candidates.length < 2) return null;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 4
          ? [...current, id]
          : current,
    );
  }

  return <div className="client-compare-picker">
    <div>
      <span className="small muted">Compare shortlist</span>
      <strong>Select 2–4 candidates</strong>
    </div>
    <div className="client-compare-picker-options" role="group" aria-label="Candidates to compare">
      {candidates.map((candidate) => (
        <label className={selected.includes(candidate.id) ? "selected" : ""} key={candidate.id}>
          <input
            type="checkbox"
            checked={selected.includes(candidate.id)}
            onChange={() => toggle(candidate.id)}
          />
          <span>{candidate.label}</span>
        </label>
      ))}
    </div>
    <Link
      className={`btn btn-sm ${selected.length >= 2 ? "btn-primary" : "disabled"}`}
      href={selected.length >= 2 ? href : "#recruiter-shortlist"}
      aria-disabled={selected.length < 2}
    >
      <Columns3 size={14}/> Compare {selected.length || ""}
    </Link>
  </div>;
}
