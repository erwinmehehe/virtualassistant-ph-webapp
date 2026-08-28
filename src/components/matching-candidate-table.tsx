"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { mergeUniqueStrings } from "@/lib/collections";
import { matchLabel } from "@/lib/matching";

function availabilityLabel(value?: string | null) {
  if (!value) return "Not set";
  return String(value).replaceAll("_", " ");
}

type Row = {
  va: any;
  account: any;
  shortlist: any;
  score: number;
  confidence: number;
};

/**
 * The full vetted VA pool now runs 60+ rows (grew a lot from a recent bulk
 * approval pass), which made the raw table a long, easy-to-get-lost-in
 * scroll on the job matching page. Filtering client-side keeps the same
 * form/checkbox wiring the server action expects -- rows just don't render
 * when filtered out, they aren't removed from the pool the form can submit.
 */
export function MatchingCandidateTable({ pool, hideShortlistCandidateAction }: { pool: Row[]; hideShortlistCandidateAction: (formData: FormData) => void | Promise<void> }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((row) => {
      const haystack = [
        row.account?.full_name,
        row.va.headline,
        row.va.primary_category,
        ...(row.va.categories || []),
        ...(row.va.skills || [])
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [pool, query]);

  const visible = query || showAll ? filtered : filtered.slice(0, 20);

  return <>
    <div className="row-between wrap" style={{ margin: "0 0 12px", gap: 10 }}>
      <div className="field" style={{ margin: 0, flex: "1 1 340px" }}>
      <input
        type="search"
        placeholder={`Search ${pool.length} candidates by name, category, or skill...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search candidates"
      />
        {query ? <div className="small muted" style={{ marginTop: 6 }}>{filtered.length} of {pool.length} candidates match.</div> : <div className="small muted" style={{ marginTop: 6 }}>Showing the top {Math.min(20, pool.length)} ranked candidates first.</div>}
      </div>
      {!query && pool.length > 20 ? <button className="btn btn-sm" type="button" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show top 20" : `Show all ${pool.length}`}</button> : null}
    </div>
    <div className="table-wrap responsive-table matching-table"><table>
      <thead><tr><th><span className="sr-only">Select</span></th><th>Rank</th><th>VA</th><th>Match</th><th>Confidence</th><th>Availability</th><th>Hours</th><th>Rate</th><th>Shortlist</th></tr></thead>
      <tbody>{visible.map((row) => {
        const index = pool.indexOf(row);
        const selected = row.shortlist && ["proposed", "released"].includes(row.shortlist.shortlist_status);
        return <tr key={row.va.user_id} className={row.shortlist?.shortlist_status === "released" ? "released-match-row" : undefined}>
          <td data-label="Select"><label className="compare-check"><input type="checkbox" name="va_id" value={row.va.user_id} defaultChecked={selected}/><span className="sr-only">Select {row.account?.full_name || "VA"}</span></label></td>
          <td data-label="Rank"><strong>#{index + 1}</strong></td>
          <td data-label="VA"><strong>{row.account?.full_name || "VA candidate"}</strong><div className="small muted">{row.va.headline || row.va.primary_category || "Virtual Assistant"}</div><div className="pill-list compact-pills">{mergeUniqueStrings(row.va.primary_category, row.va.categories).slice(0, 2).map((x: string, i: number) => <span className="badge" key={`${x}-${i}`}>{x}</span>)}</div></td>
          <td data-label="Match"><div className="match-percent"><strong>{row.score}%</strong><span>{matchLabel(row.score)}</span></div><div className="match-meter" aria-label={`${row.score}% match`}><span style={{ width: `${row.score}%` }}/></div></td>
          <td data-label="Confidence"><strong>{row.confidence}%</strong><div className="small muted">criteria assessed</div></td>
          <td data-label="Availability"><span className={`badge ${row.va.availability_status === "available" ? "badge-success" : ""}`}>{availabilityLabel(row.va.availability_status)}</span>{row.va.directory_visible ? <div className="small muted">Public directory</div> : <div className="small muted">Private pool</div>}</td>
          <td data-label="Hours">{row.va.weekly_hours != null ? `${row.va.weekly_hours}/week` : "Not set"}</td>
          <td data-label="Rate">{row.va.hourly_rate != null ? `USD ${Number(row.va.hourly_rate).toFixed(2)}/hr` : "Not set"}</td>
          <td data-label="Shortlist">{row.shortlist?.shortlist_status === "released" ? <div className="stack-inline"><span className="badge badge-success"><CheckCircle2 size={13}/> Released</span><button className="text-button" type="submit" formAction={hideShortlistCandidateAction} name="remove_va_id" value={row.va.user_id}>Remove</button></div> : row.shortlist?.shortlist_status === "proposed" ? <div className="stack-inline"><span className="badge">Internal</span><button className="text-button" type="submit" formAction={hideShortlistCandidateAction} name="remove_va_id" value={row.va.user_id}>Remove</button></div> : <span className="small muted">—</span>}</td>
        </tr>;
      })}</tbody>
    </table></div>
  </>;
}
