import Link from "next/link";
import { ChevronDown, Clock3, Mail, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { bulkRecruiterTalentAction } from "@/app/actions/recruiter-talent";
import { PublicAvatar } from "@/components/public-avatar";
import { requireRole } from "@/lib/auth";
import { dateShort } from "@/lib/format";
import { applyRecruiterTalentFilters } from "@/lib/recruiter-talent-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { vettingStatusLabel } from "@/lib/vetting";
import { APPROVAL_MIN_COMPLETION, PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import type { JobOptionRow, RecruiterVaDirectoryRow, VaProfileReminderRow } from "@/lib/workspace-rows";

const PAGE_SIZE = 25;

function num(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function qs(params: Record<string, string | undefined>, overrides: Record<string, string | number | undefined>) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value !== undefined && String(value) !== "") out.set(key, String(value));
  }
  const query = out.toString();
  return query ? `?${query}` : "";
}

export default async function RecruiterTalentDirectory({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("recruiter");
  const params = await searchParams;
  const admin = createAdminClient();
  const page = Math.max(1, num(params.page) || 1);

  // The shared filter helper works on the untyped Supabase builder (no generated DB types).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("recruiter_va_directory")
    .select("*", { count: "exact" })
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  query = applyRecruiterTalentFilters(query, {
    q: params.q,
    stage: params.stage,
    readiness: params.readiness,
    photo: params.photo,
    resume: params.resume,
    skill: params.skill,
    min_experience: params.min_experience,
    max_rate: params.max_rate,
    availability: params.availability,
    stale: params.stale
  });

  const from = (page - 1) * PAGE_SIZE;
  const [{ data: rowData, count, error }, { data: roles }] = await Promise.all([
    query.range(from, from + PAGE_SIZE - 1),
    admin
      .from("jobs")
      .select("id,title,company_name,status,client_id")
      .in("status", ["pending", "published"])
      .order("created_at", { ascending: false })
      .limit(100)
  ]);
  if (error) throw error;

  const rows = (rowData || []) as RecruiterVaDirectoryRow[];
  const ids = rows.map((row) => row.user_id);
  const [{ data: reminders }, { data: publicRows }] = ids.length
    ? await Promise.all([
        admin
          .from("va_profile_reminders")
          .select("va_id,last_sent_at,reminder_count")
          .in("va_id", ids),
        admin.from("public_va_directory").select("user_id").in("user_id", ids)
      ])
    : [{ data: [] }, { data: [] }];

  const reminderMap = new Map(((reminders || []) as VaProfileReminderRow[]).map((row) => [row.va_id, row]));
  const publicIds = new Set(((publicRows || []) as { user_id: string }[]).map((row) => row.user_id));
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentUrl = `/workspace/recruiter/talent${qs(params, { page })}`;
  const affected = Number(params.affected || 0);
  const published = params.published === undefined ? null : Number(params.published || 0);
  const partialPublish = params.bulk_done === "approve_publish" && published !== null && published < affected;

  const filterHidden = <>
    {Object.entries({
      filter_q: params.q,
      filter_stage: params.stage,
      filter_readiness: params.readiness,
      filter_photo: params.photo,
      filter_resume: params.resume,
      filter_skill: params.skill,
      filter_min_experience: params.min_experience,
      filter_max_rate: params.max_rate,
      filter_availability: params.availability,
      filter_stale: params.stale
    }).map(([name, value]) => <input key={name} type="hidden" name={name} value={value || ""} />)}
  </>;

  const stages = ["profile", "test", "video", "recruiter_review", "finalist", "approved", "bench", "rejected"];
  const advancedFiltersActive = Boolean(params.photo || params.resume || params.skill || params.min_experience || params.max_rate || params.availability || params.stale);
  const readinessLabels: Record<string, string> = {
    zero: "Not started",
    incomplete: `Below ${APPROVAL_MIN_COMPLETION}%`,
    approval_ready: `Approval-ready (${APPROVAL_MIN_COMPLETION}%+)`,
    ready: `${PUBLIC_VA_MIN_COMPLETION}%+ with photo`,
    vetted_hidden: "Approved, not public"
  };
  const activeFilters = [
    params.q ? { key: "q", label: `Search: ${params.q}` } : null,
    params.stage ? { key: "stage", label: `Stage: ${vettingStatusLabel(params.stage)}` } : null,
    params.readiness ? { key: "readiness", label: readinessLabels[params.readiness] || params.readiness } : null,
    params.photo ? { key: "photo", label: params.photo === "yes" ? "Has photo" : "Missing photo" } : null,
    params.resume ? { key: "resume", label: params.resume === "yes" ? "Has resume" : "Missing resume" } : null,
    params.skill ? { key: "skill", label: `Skill: ${params.skill}` } : null,
    params.min_experience ? { key: "min_experience", label: `${params.min_experience}+ yrs` } : null,
    params.max_rate ? { key: "max_rate", label: `Up to USD ${params.max_rate}/hr` } : null,
    params.availability ? { key: "availability", label: params.availability === "available" ? "Available" : "Unavailable" } : null,
    params.stale ? { key: "stale", label: `Inactive ${params.stale}+ days` } : null
  ].filter(Boolean) as { key: string; label: string }[];


  return <>
    <div className="page-head">
      <div>
        <div className="kicker">Master VA directory</div>
        <h1>All VA accounts</h1>
        <p>Recruiter-only view of every VA, regardless of public visibility. Filter the backlog, identify what is missing, and act in bulk.</p>
      </div>
      <div className="row wrap">
        <Link className="btn" href="/workspace/recruiter/queue">Vetting queue</Link>
        <Link className="btn btn-primary" href="/workspace/recruiter/matching">Match roles</Link>
      </div>
    </div>

    {params.shortlist_released ? <div className="success-banner">Selected reviewed VAs were sent to the client for review.</div> : null}
    {params.shortlist_error ? <div className="alert">{params.shortlist_error}</div> : null}
    {params.bulk_done ? (
      <div className="success-banner">
        Bulk action complete: {String(params.bulk_done).replaceAll("_", " ")} · {affected} affected
        {published !== null ? ` · ${published} actually public` : ""}.
      </div>
    ) : null}
    {partialPublish ? (
      <div className="alert">
        {affected - (published || 0)} approved VA{affected - (published || 0) === 1 ? " is" : "s are"} still blocked from the public directory by availability, experience, rate, photo, or profile-completion requirements.
      </div>
    ) : null}
    {params.bulk_error ? <div className="alert">{params.bulk_error}</div> : null}

    <form className="recruiter-filter-panel recruiter-filter-panel-clean" method="get">
      <div className="filter-primary-row">
        <label className="directory-filter-search" aria-label="Search Virtual Assistants">
          <Search size={17} />
          <input name="q" defaultValue={params.q} placeholder="Search VAs by name, role, or category" />
        </label>
        <label className="filter-field">
          <span>Stage</span>
          <select name="stage" defaultValue={params.stage || ""}>
            <option value="">All stages</option>
            {stages.map((value) => <option key={value} value={value}>{vettingStatusLabel(value)}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <span>Readiness</span>
          <select name="readiness" defaultValue={params.readiness || ""}>
            <option value="">Any readiness</option>
            <option value="zero">Not started</option>
            <option value="incomplete">Below {APPROVAL_MIN_COMPLETION}%</option>
            <option value="approval_ready">Approval-ready ({APPROVAL_MIN_COMPLETION}%+)</option>
            <option value="ready">{PUBLIC_VA_MIN_COMPLETION}%+ with photo</option>
            <option value="vetted_hidden">Approved, not public</option>
          </select>
        </label>
        <button className="btn btn-primary filter-apply" type="submit"><SlidersHorizontal size={15} /> Apply</button>
        <Link className="filter-reset" href="/workspace/recruiter/talent"><X size={14} /> Clear</Link>
      </div>

      <details className="filter-more" open={advancedFiltersActive}>
        <summary><SlidersHorizontal size={15} /><span>More filters</span><ChevronDown size={15} className="filter-more-chevron" /></summary>
        <div className="filter-more-grid">
          <label className="filter-field"><span>Photo</span><select name="photo" defaultValue={params.photo || ""}><option value="">Any</option><option value="yes">Has photo</option><option value="no">Missing photo</option></select></label>
          <label className="filter-field"><span>Resume</span><select name="resume" defaultValue={params.resume || ""}><option value="">Any</option><option value="yes">Has resume</option><option value="no">Missing resume</option></select></label>
          <label className="filter-field"><span>Availability</span><select name="availability" defaultValue={params.availability || ""}><option value="">Any</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
          <label className="filter-field"><span>Activity</span><select name="stale" defaultValue={params.stale || ""}><option value="">Any</option><option value="30">Inactive 30+ days</option><option value="60">Inactive 60+ days</option><option value="90">Inactive 90+ days</option></select></label>
          <label className="filter-field filter-field-wide"><span>Skill</span><input name="skill" defaultValue={params.skill} placeholder="e.g. SEO, bookkeeping" /></label>
          <label className="filter-field"><span>Min. experience</span><input type="number" min="0" name="min_experience" defaultValue={params.min_experience} placeholder="Years" /></label>
          <label className="filter-field"><span>Max. hourly rate</span><input type="number" min="5" step="1" name="max_rate" defaultValue={params.max_rate} placeholder="USD / hr" /></label>
        </div>
      </details>
      {activeFilters.length ? (
        <div className="active-filter-row" aria-label="Active filters">
          <span className="active-filter-label">{activeFilters.length} active</span>
          {activeFilters.map((filter) => (
            <Link key={filter.key} className="active-filter-chip" href={`/workspace/recruiter/talent${qs(params, { [filter.key]: undefined, page: 1 })}`}>
              {filter.label}<X size={12} />
            </Link>
          ))}
          <Link className="active-filter-clear" href="/workspace/recruiter/talent">Clear all</Link>
        </div>
      ) : null}
      <div className="filter-context-note"><strong>{APPROVAL_MIN_COMPLETION}%</strong> is enough for recruiter approval. A photo is only required for public visibility, together with the remaining public-directory requirements.</div>
    </form>

    <div className="row-between wrap" style={{ margin: "16px 0" }}>
      <span className="small muted"><strong>{total}</strong> matching VA{total === 1 ? "" : "s"} · page {page} of {pages}</span>
      <span className="small muted"><ShieldCheck size={14} style={{ verticalAlign: "-2px" }} /> Internal recruiter data</span>
    </div>

    <form action={bulkRecruiterTalentAction} className="stack">
      <input type="hidden" name="return_to" value={currentUrl} />
      {filterHidden}
      <div className="bulk-action-bar">
        <label className="bulk-scope">
          <input type="checkbox" name="selection_scope" value="filtered" />
          <span><strong>{total > 500 ? "Select first 500 filtered VAs" : `Select all ${total} filtered VAs`}</strong><small>{total > 500 ? "Narrow the filters for safer bulk actions." : "Leave off to act only on checked rows."}</small></span>
        </label>
        <select name="bulk_action" required defaultValue="">
          <option value="" disabled>Bulk action…</option>
          <option value="approve">Approve eligible (60%+)</option>
          <option value="bench">Move approved to Bench</option>
          <option value="approve_publish">Approve + publish if public-ready</option>
          <option value="mark_reviewed">Mark profile edit reviewed</option>
          <option value="request_changes">Request profile changes</option>
          <option value="remind">Email completion reminder</option>
          <option value="hide">Hide from public directory</option>
          <option value="reject">Reject</option>
          <option value="assign">Assign to role internally</option>
          <option value="send_client_review">Send approved VAs to client review</option>
        </select>
        <select name="job_id" defaultValue="">
          <option value="">Role (only for assignment / client review)…</option>
          {((roles || []) as JobOptionRow[]).map((job) => <option key={job.id} value={job.id}>{job.title} — {job.company_name || job.status}{job.client_id ? " · client linked" : " · internal only"}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Run action</button>
      </div>

      <div className="table-wrap responsive-table recruiter-talent-table">
        <table>
          <thead><tr><th></th><th>Candidate</th><th>Status</th><th>Profile health</th><th>Experience</th><th>Activity</th><th></th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => {
              const missing = Array.isArray(row.missing_items) ? row.missing_items : [];
              const reminder = reminderMap.get(row.user_id);
              const activity = row.last_activity_at ? Math.floor((Date.now() - new Date(row.last_activity_at).getTime()) / 86400000) : null;
              const publicNow = publicIds.has(row.user_id);
              const approved = ["approved", "bench"].includes(String(row.stage || ""));
              const visibility = publicNow ? "Public" : approved ? (row.directory_visible ? "Public blocked" : "Hidden") : "Private";
              const score = row.completion_score || 0;

              return <tr key={row.user_id}>
                <td data-label="Select"><input type="checkbox" name="va_id" value={row.user_id} aria-label={`Select ${row.full_name || "VA"}`} /></td>
                <td data-label="Candidate">
                  <div className="candidate-identity-cell">
                    <PublicAvatar name={row.full_name || "VA"} src={row.avatar_url} size="sm" />
                    <div className="candidate-identity-copy">
                      <strong>{row.full_name || "VA account"}</strong>
                      <div className="small muted">{row.headline || row.primary_category || "Profile setup not started"}</div>
                      <div className="candidate-meta-line">{row.availability_status || "Availability not set"}{row.primary_category && row.headline ? ` · ${row.primary_category}` : ""}</div>
                    </div>
                  </div>
                </td>
                <td data-label="Status">
                  <div className="status-stack">
                    <span className="badge">{vettingStatusLabel(row.stage || "profile")}</span>
                    <span className={`visibility-label visibility-${visibility.toLowerCase().replaceAll(" ", "-")}`}>{visibility}</span>
                  </div>
                </td>
                <td data-label="Profile health">
                  <div className="readiness-cell">
                    <div className="readiness-line"><strong>{score}% complete</strong>{score >= APPROVAL_MIN_COMPLETION && !approved ? <span className="approval-ready-label">Approval-ready</span> : null}</div>
                    <div className="progress mini"><span style={{ width: `${score}%` }} /></div>
                    <div className="profile-issues">{missing.length ? `Needs: ${missing.slice(0, 2).join(" · ")}${missing.length > 2 ? ` +${missing.length - 2}` : ""}` : "No profile gaps flagged"}</div>
                  </div>
                </td>
                <td data-label="Experience">{row.years_experience ?? 0} yrs<div className="small muted">{row.hourly_rate ? `USD ${Number(row.hourly_rate).toFixed(2)}/hr` : "Rate missing"}</div></td>
                <td data-label="Activity">
                  {activity == null ? <span className="small muted">Activity unknown</span> : <span className={activity >= 60 ? "activity-stale" : "small"}><Clock3 size={13} /> {activity}d ago</span>}
                  <div className="activity-reminder">{reminder?.last_sent_at ? <><Mail size={12} /> Reminded {dateShort(reminder.last_sent_at)}</> : "No reminder sent"}</div>
                </td>
                <td data-label="Action"><Link className="btn btn-sm" href={`/workspace/recruiter/candidates/${row.user_id}`}>View profile</Link></td>
              </tr>;
            }) : <tr><td colSpan={7}><div className="empty">No VAs match those filters.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </form>

    <div className="pagination">
      {page > 1 ? <Link className="btn btn-sm" href={`/workspace/recruiter/talent${qs(params, { page: page - 1 })}`}>← Previous</Link> : <span />}
      <span className="small muted">{total ? from + 1 : 0}-{Math.min(from + PAGE_SIZE, total)} of {total}</span>
      {page < pages ? <Link className="btn btn-sm" href={`/workspace/recruiter/talent${qs(params, { page: page + 1 })}`}>Next →</Link> : <span />}
    </div>
  </>;
}
