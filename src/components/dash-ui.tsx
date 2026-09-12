import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Presentational pieces for the workspace dashboards, ported from the premium
 * redesign.
 *
 * The redesign was written in Tailwind. This app has no Tailwind, and adding it
 * is not free: its .container utility would collide with the container class
 * used on every public page. These render the same design through the dash-*
 * classes in globals.css instead.
 *
 * None of them hold state, so there is no "use client". They render on the
 * server, which keeps the dashboards querying Supabase directly rather than
 * fetching from API routes in the browser the way the redesign did.
 */

export type Tone = "indigo" | "amber" | "emerald" | "sky" | "rose" | "violet" | "slate";

const RING_COLOR: Record<Tone, string> = {
  indigo: "#6172f3",
  amber: "#f79009",
  emerald: "#12b76a",
  sky: "#0ea5e9",
  rose: "#f04438",
  violet: "#7a5af8",
  slate: "#98a2b3"
};

export function DashHeader({ kicker, title, subtitle, actions }: { kicker?: string; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="dash-header">
      <div>
        {kicker ? <div className="dash-kicker">{kicker}</div> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="dash-header-actions">{actions}</div> : null}
    </div>
  );
}

/**
 * The redesign's stat cards carried trend deltas ("+21% vs Q4") that had no
 * data behind them. The chip here states the current condition instead, which
 * is something every count can honestly say about itself.
 */
export function StatCard({
  label,
  value,
  sub,
  chip,
  icon,
  tone = "indigo",
  href
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  chip?: { label: string; tone: "good" | "warn" | "neutral" };
  icon: ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <span className={`dash-stat-bar tone-${tone}`} aria-hidden="true" />
      <div className="dash-stat-top">
        <div>
          <p className="dash-stat-label">{label}</p>
          <p className="dash-stat-value">{value}</p>
          {sub ? <p className="dash-stat-sub">{sub}</p> : null}
        </div>
        <span className={`dash-stat-icon tone-${tone}`} aria-hidden="true">{icon}</span>
      </div>
      {chip ? <span className={`dash-chip-status ${chip.tone}`}>{chip.label}</span> : null}
    </>
  );
  return href ? <Link className="dash-stat" href={href}>{body}</Link> : <div className="dash-stat">{body}</div>;
}

export function Panel({ title, subtitle, action, children, className }: { title?: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`dash-panel${className ? ` ${className}` : ""}`}>
      {title || action ? (
        <div className="dash-panel-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function BarChart({ data, label, height = 120 }: { data: { label: string; value: number; highlight?: boolean }[]; label: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const summary = `${label}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  return (
    <figure className="dash-bars" role="img" aria-label={summary}>
      <div className="dash-bars-plot" style={{ height }}>
        {data.map((d) => (
          <div className="dash-bars-col" key={d.label} title={`${d.label}: ${d.value}`}>
            {d.value ? <span className="dash-bars-value">{d.value}</span> : null}
            {/* Scaled to 85% so the value label above the tallest bar still fits. */}
            <div className={`dash-bars-bar${d.highlight ? " highlight" : ""}`} style={{ height: `${d.value ? Math.max((d.value / max) * 85, 5) : 2}%` }} />
          </div>
        ))}
      </div>
      <div className="dash-bars-axis" aria-hidden="true">{data.map((d) => <span key={d.label}>{d.label}</span>)}</div>
    </figure>
  );
}

export function ProgressRing({ pct, size = 64, stroke = 7, tone = "indigo", label }: { pct: number; size?: number; stroke?: number; tone?: Tone; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <span className="dash-ring" style={{ width: size, height: size }} role="img" aria-label={label ?? `${clamped}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e8ecf4" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={RING_COLOR[tone]} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * clamped) / 100} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="dash-ring-label" aria-hidden="true">{clamped}</span>
    </span>
  );
}

export function Pill({ tone = "slate", children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className={`dash-pill tone-${tone}`}>{dot ? <span className="dash-pill-dot" aria-hidden="true" /> : null}{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  open: "emerald", published: "emerald", active: "emerald", hired: "emerald", qualified: "emerald", approved: "emerald",
  pending: "amber", reviewing: "amber", recruiter_review: "amber",
  shortlisted: "indigo", contacted: "indigo", finalist: "indigo",
  interview: "violet",
  new: "sky",
  draft: "slate", rejected: "slate", paused: "slate", closed: "slate", withdrawn: "slate"
};

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={STATUS_TONE[status] ?? "slate"}>{status.replaceAll("_", " ")}</Pill>;
}

export function Empty({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="dash-empty">
      <p className="dash-empty-title">{title}</p>
      <p>{desc}</p>
      {action}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "success" | "warn" | "error"; children: ReactNode }) {
  return <div className={`dash-notice ${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function SignalList({ items }: { items: { label: string; count: number; href: string; icon: ReactNode; hint?: string }[] }) {
  return (
    <div className="dash-signals">
      {items.map((item) => (
        <Link className="dash-signal" href={item.href} key={item.label}>
          <span className="dash-signal-icon" aria-hidden="true">{item.icon}</span>
          <span className="dash-signal-copy"><strong>{item.label}</strong>{item.hint ? <small>{item.hint}</small> : null}</span>
          <span className={`dash-signal-count${item.count ? " has" : ""}`}>{item.count}</span>
        </Link>
      ))}
    </div>
  );
}
