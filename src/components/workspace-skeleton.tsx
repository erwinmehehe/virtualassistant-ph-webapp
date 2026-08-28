// Shown while a workspace route resolves. The dashboards fan out to a dozen
// Supabase queries before they can paint, so without this the user stares at
// the previous page (or nothing) with no indication that work is happening.
export function WorkspaceSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="workspace-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your workspace…</span>
      <div className="skeleton-head">
        <span className="skeleton skeleton-line" style={{ width: 120, height: 12 }} />
        <span className="skeleton skeleton-line" style={{ width: "min(360px, 70%)", height: 26 }} />
        <span className="skeleton skeleton-line" style={{ width: "min(520px, 90%)", height: 14 }} />
      </div>
      <div className="skeleton skeleton-block" style={{ height: 108 }} />
      <div className="skeleton-grid">
        {Array.from({ length: cards }).map((_, i) => <div className="skeleton skeleton-block" key={i} style={{ height: 116 }} />)}
      </div>
      <div className="skeleton skeleton-block" style={{ height: 168 }} />
    </div>
  );
}
