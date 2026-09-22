import Link from "next/link";
import { ChevronDown, Clock3, Mail, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { bulkRecruiterTalentAction } from "@/app/actions/recruiter-talent";
import { RecruiterViewPreference } from "@/components/recruiter-view-preference";
import { PublicAvatar } from "@/components/public-avatar";
import { requireRole } from "@/lib/auth";
import { dateShort } from "@/lib/format";
import { applyRecruiterTalentFilters } from "@/lib/recruiter-talent-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { vettingStatusLabel } from "@/lib/vetting";
import { APPROVAL_MIN_COMPLETION, PUBLIC_VA_MIN_COMPLETION, publicVisibilityRequirements } from "@/lib/public-visibility";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "@/lib/privacy-consent";
import type { JobOptionRow, RecruiterVaDirectoryRow, VaProfileReminderRow } from "@/lib/workspace-rows";

const PAGE_SIZE = 25;

const SAVED_VIEWS = [
  { key: "all", label: "All VAs", filters: {} },
  { key: "approval_ready", label: "Approval-ready", filters: { readiness: "approval_ready" } },
  { key: "missing_photo", label: "Missing photo", filters: { photo: "no" } },
  { key: "approved_hidden", label: "Approved but hidden", filters: { readiness: "vetted_hidden" } },
  { key: "stale_60", label: "Stale 60d+", filters: { stale: "60" } },
  { key: "available", label: "Available now", filters: { availability: "available" } },
  { key: "needs_review", label: "Needs recruiter review", filters: { stage: "recruiter_review" } }
] as const;


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
  const savedView = SAVED_VIEWS.find((item) => item.key === params.view);
  const sort = String(params.sort || "recent");
  const effective: Record<string, string | undefined> = {
    ...params,
    ...(savedView?.filters || {})
  };

  // The shared filter helper works on the untyped Supabase builder (no generated DB types).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("recruiter_va_directory")
    .select("*", { count: "exact" });

  if (sort === "completion") query = query.order("completion_score", { ascending: false }).order("last_activity_at", { ascending: false, nullsFirst: false });
  else if (sort === "experience") query = query.order("years_experience", { ascending: false, nullsFirst: false }).order("last_activity_at", { ascending: false, nullsFirst: false });
  else if (sort === "rate_low") query = query.order("hourly_rate", { ascending: true, nullsFirst: false });
  else if (sort === "rate_high") query = query.order("hourly_rate", { ascending: false, nullsFirst: false });
  else if (sort === "name") query = query.order("full_name", { ascending: true, nullsFirst: false });
  else query = query.order("last_activity_at", { ascending: false, nullsFirst: false });

  query = applyRecruiterTalentFilters(query, {
    q: effective.q,
    stage: effective.stage,
    readiness: effective.readiness,
    photo: effective.photo,
    resume: effective.resume,
    skill: effective.skill,
    min_experience: effective.min_experience,
    max_rate: effective.max_rate,
    availability: effective.availability,
    stale: effective.stale
  });

  const from = (page - 1) * PAGE_SIZE;
  const viewCountQueries = SAVED_VIEWS.map((preset) => {
    let countQuery: any = admin.from("recruiter_va_directory").select("user_id", { count: "exact", head: true });
    countQuery = applyRecruiterTalentFilters(countQuery, preset.filters);
    return countQuery;
  });
  const [{ data: rowData, count, error }, { data: roles }, ...viewCountResults] = await Promise.all([
    query.range(from, from + PAGE_SIZE - 1),
    admin
      .from("jobs")
      .select("id,title,company_name,status,client_id")
      .in("status", ["pending", "published"])
      .order("created_at", { ascending: false })
      .limit(100),
    ...viewCountQueries
  ]);
  if (error) throw error;

  const rows = (rowData || []) as RecruiterVaDirectoryRow[];
  const ids = rows.map((row) => row.user_id);
  const [{ data: reminders }, { data: publicRows }, { data: visibilityRows }] = ids.length
    ? await Promise.all([
        admin
          .from("va_profile_reminders")
          .select("va_id,last_sent_at,reminder_count")
          .in("va_id", ids),
        admin.from("public_va_directory").select("user_id").in("user_id", ids),
        admin.from("va_profiles").select("*").in("user_id", ids)
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const reminderMap = new Map(((reminders || []) as VaProfileReminderRow[]).map((row) => [row.va_id, row]));
  const publicIds = new Set(((publicRows || []) as { user_id: string }[]).map((row) => row.user_id));
  const visibilityMap = new Map((visibilityRows || []).map((row: any) => [row.user_id, row]));
  const savedViewCounts = new Map(SAVED_VIEWS.map((preset, index) => [preset.key, Number((viewCountResults[index] as any)?.count || 0)]));
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentUrl = `/workspace/recruiter/talent${qs(params, { page })}`;
  const affected = Number(params.affected || 0);
  const published = params.published === undefined ? null : Number(params.published || 0);
  const partialPublish = params.bulk_done === "approve_publish" && published !== null && published < affected;

  const filterHidden = <>
    {Object.entries({
      filter_q: effective.q,
      filter_stage: effective.stage,
      filter_readiness: effective.readiness,
      filter_photo: effective.photo,
      filter_resume: effective.resume,
      filter_skill: effective.skill,
      filter_min_experience: effective.min_experience,
      filter_max_rate: effective.max_rate,
      filter_availability: effective.availability,
      filter_stale: effective.stale
    }).map(([name, value]) => <input key={name} type="hidden" name={name} value={value || ""} />)}
  </>;

  const stages = ["profile", "test", "video", "recruiter_review", "finalist", "approved", "bench", "rejected"];
  const advancedFiltersActive = Boolean(effective.photo || effective.resume || effective.skill || effective.min_experience || effective.max_rate || effective.availability || effective.stale);
  const readinessLabels: Record<string, string> = {
    zero: "Not started",
    incomplete: `Below ${APPROVAL_MIN_COMPLETION}%`,
    approval_ready: `Approval-ready (${APPROVAL_MIN_COMPLETION}%+)`,
    ready: `${PUBLIC_VA_MIN_COMPLETION}%+ with photo`,
    vetted_hidden: "Approved, not public"
  };
  const activeFilters = [
    effective.q ? { key: "q", label: `Search: ${effective.q}` } : null,
    effective.stage ? { key: "stage", label: `Stage: ${vettingStatusLabel(effective.stage)}` } : null,
    effective.readiness ? { key: "readiness", label: readinessLabels[effective.readiness] || effective.readiness } : null,
    effective.photo ? { key: "photo", label: effective.photo === "yes" ? "Has photo" : "Missing photo" } : null,
    effective.resume ? { key: "resume", label: effective.resume === "yes" ? "Has resume" : "Missing resume" } : null,
    effective.skill ? { key: "skill", label: `Skill: ${effective.skill}` } : null,
    effective.min_experience ? { key: "min_experience", label: `${effective.min_experience}+ yrs` } : null,
    effective.max_rate ? { key: "max_rate", label: `Up to USD ${effective.max_rate}/hr` } : null,
    effective.availability ? { key: "availability", label: effective.availability === "available" ? "Available" : "Unavailable" } : null,
    effective.stale ? { key: "stale", label: `Inactive ${effective.stale}+ days` } : null
  ].filter(Boolean) as { key: string; label: string }[];


  return <>
    <RecruiterViewPreference storageKey="recruiter-talent-view-v1" view={params.view} sort={params.sort} />
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

    <div className="recruiter-saved-views" aria-label="Saved talent views">
      <div className="saved-view-head"><strong>Saved views</strong><span>One-click recruiter queues</span></div>
      <div className="saved-view-list">
        {SAVED_VIEWS.map((preset) => (
          <Link key={preset.key} className={params.view === preset.key ? "saved-view active" : "saved-view"} href={`/workspace/recruiter/talent?view=${preset.key}&sort=${sort}`}>
            <span>{preset.label}</span><strong>{savedViewCounts.get(preset.key) || 0}</strong>
          </Link>
        ))}
      </div>
    </div>

    <form className="recruiter-filter-panel recruiter-filter-panel-clean" method="get">
      {params.view ? <input type="hidden" name="view" value={params.view} /> : null}
      <div className="filter-primary-row">
        <label className="directory-filter-search" aria-label="Search Virtual Assistants">
          <Search size={17} />
          <input name="q" defaultValue={effective.q} placeholder="Search VAs by name, role, or category" />
        </label>
        <label className="filter-field">
          <span>Stage</span>
          <select name="stage" defaultValue={effective.stage || ""}>
            <option value="">All stages</option>
            {stages.map((value) => <option key={value} value={value}>{vettingStatusLabel(value)}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <span>Readiness</span>
          <select name="readiness" defaultValue={effective.readiness || ""}>
            <option value="">Any readiness</option>
            <option value="zero">Not started</option>
            <option value="incomplete">Below {APPROVAL_MIN_COMPLETION}%</option>
            <option value="approval_ready">Approval-ready ({APPROVAL_MIN_COMPLETION}%+)</option>
            <option value="ready">{PUBLIC_VA_MIN_COMPLETION}%+ with photo</option>
            <option value="vetted_hidden">Approved, not public</option>
          </select>
        </label>
        <button className="btn btn-primary filter-apply" type="submit"><SlidersHorizontal size={15} /> Apply</button>
        <label className="filter-field talent-sort-field">
          <span>Sort</span>
          <select name="sort" defaultValue={sort}>
            <option value="recent">Recently active</option>
            <option value="completion">Highest completion</option>
            <option value="experience">Most experience</option>
            <option value="rate_low">Lowest rate</option>
            <option value="rate_high">Highest rate</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <Link className="filter-reset" href="/workspace/recruiter/talent?view=all&sort=recent"><X size={14} /> Clear</Link>
      </div>

      <details className="filter-more" open={advancedFiltersActive}>
        <summary><SlidersHorizontal size={15} /><span>More filters</span><ChevronDown size={15} className="filter-more-chevron" /></summary>
        <div className="filter-more-grid">
          <label className="filter-field"><span>Photo</span><select name="photo" defaultValue={effective.photo || ""}><option value="">Any</option><option value="yes">Has photo</option><option value="no">Missing photo</option></select></label>
          <label className="filter-field"><span>Resume</span><select name="resume" defaultValue={effective.resume || ""}><option value="">Any</option><option value="yes">Has resume</option><option value="no">Missing resume</option></select></label>
          <label className="filter-field"><span>Availability</span><select name="availability" defaultValue={effective.availability || ""}><option value="">Any</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
          <label className="filter-field"><span>Activity</span><select name="stale" defaultValue={effective.stale || ""}><option value="">Any</option><option value="30">Inactive 30+ days</option><option value="60">Inactive 60+ days</option><option value="90">Inactive 90+ days</option></select></label>
          <label className="filter-field filter-field-wide"><span>Skill</span><input name="skill" defaultValue={effective.skill} placeholder="e.g. SEO, bookkeeping" /></label>
          <label className="filter-field"><span>Min. experience</span><input type="number" min="0" name="min_experience" defaultValue={effective.min_experience} placeholder="Years" /></label>
          <label className="filter-field"><span>Max. hourly rate</span><input type="number" min="5" step="1" name="max_rate" defaultValue={effective.max_rate} placeholder="USD / hr" /></label>
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
          <Link className="active-filter-clear" href="/workspace/recruiter/talent?view=all&sort=recent">Clear all</Link>
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
              const publicProfile: any = visibilityMap.get(row.user_id) || {};
              const activeConsent = publicProfile.public_profile_consent === true
                && Boolean(publicProfile.public_profile_consent_at)
                && !publicProfile.public_profile_consent_withdrawn_at
                && publicProfile.public_profile_consent_version === PUBLIC_PROFILE_CONSENT_VERSION;
              const publicRequirements = publicVisibilityRequirements(publicProfile, row.avatar_url);
              const publicMissing = publicRequirements.filter((item) => !item.done).map((item) => item.label);
              const visibility = publicNow
                ? "Public"
                : approved && !activeConsent
                  ? "Consent needed"
                  : approved && !row.directory_visible
                    ? "Publish switch off"
                    : approved
                      ? "Public blocked"
                      : "Private";
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
                    {!publicNow && approved ? <span className="public-blocker-copy">{publicMissing.length ? `Needs ${publicMissing.slice(0, 2).join(" · ")}${publicMissing.length > 2 ? ` +${publicMissing.length - 2}` : ""}` : "Eligible once visibility is enabled"}</span> : null}
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
