import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronDown, Clock3, Mail, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { bulkRecruiterTalentAction } from "@/app/actions/recruiter-talent";
import { RecruiterViewPreference } from "@/components/recruiter-view-preference";
import { RecruiterTalentOperationsPanel } from "@/components/recruiter-talent-operations-panel";
import { RecruiterTalentSelectionControl } from "@/components/recruiter-talent-selection-control";
import { PublicAvatar } from "@/components/public-avatar";
import { requireRoleFast } from "@/lib/auth";
import { dateShort } from "@/lib/format";
import { VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { applyRecruiterTalentFilters, RECRUITER_BULK_LIMIT } from "@/lib/recruiter-talent-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { vettingStatusLabel } from "@/lib/vetting";
import { APPROVAL_MIN_COMPLETION, PUBLIC_VA_MIN_COMPLETION, publicVisibilityRequirements } from "@/lib/public-visibility";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "@/lib/privacy-consent";
import type {
  JobOptionRow,
  RecruiterTalentPageMetaRow,
  RecruiterTalentSummaryRow,
  RecruiterVaDirectoryRow,
} from "@/lib/workspace-rows";

const PAGE_SIZE = 25;

const SAVED_VIEWS = [
  { key: "all", label: "Talent pool", filters: { classification: "classified" } },
  { key: "incomplete_profiles", label: "Incomplete profiles", filters: { classification: "incomplete_profile" } },
  { key: "approval_ready", label: "Approval-ready", filters: { readiness: "approval_ready" } },
  { key: "available", label: "Available now", filters: { availability: "available" } },
  { key: "needs_review", label: "Needs recruiter review", filters: { stage: "recruiter_review" } },
  { key: "ready_to_classify", label: "Ready to classify", filters: { classification: "ready_to_classify" } },
  { key: "approval_cleanup", label: "Approval cleanup", filters: { readiness: "approval_cleanup" } },
  { key: "missing_photo", label: "Missing photo", filters: { photo: "no" } },
  { key: "approved_hidden", label: "Approved but hidden", filters: { readiness: "vetted_hidden" } },
  { key: "bench", label: "Bench / active pool", filters: { stage: "bench" } },
  { key: "stale_60", label: "Stale 60d+", filters: { stale: "60" } },
  { key: "zero_not_started", label: "0% / not started", filters: { classification: undefined, registration: "never_started" } },
  { key: "email_unconfirmed", label: "Email unconfirmed", filters: { classification: undefined, registration: "email_unconfirmed" } },
  { key: "profile_incomplete", label: "Profile incomplete", filters: { classification: undefined, registration: "profile_incomplete" } },
  { key: "missing_resume", label: "Missing resume", filters: { classification: undefined, resume: "no" } },
] as const;

const PRIMARY_SAVED_VIEW_KEYS = new Set(["all", "incomplete_profiles", "approval_ready", "available", "needs_review"]);


function num(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function listParam(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function qs(
  params: Record<string, string | undefined>,
  overrides: Record<string, string | number | string[] | undefined>,
) {
  const out = new URLSearchParams();
  const merged = { ...params, ...overrides } as Record<string, unknown>;
  for (const [key, value] of Object.entries(merged)) {
    if (Array.isArray(value)) {
      for (const item of value) if (String(item).trim()) out.append(key, String(item));
      continue;
    }
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
  await requireRoleFast("recruiter");
  const params = await searchParams;
  const admin = createAdminClient();
  const page = Math.max(1, num(params.page) || 1);
  const savedView = SAVED_VIEWS.find((item) => item.key === params.view);
  const sort = String(params.sort || "recent");
  const effective: Record<string, string | undefined> = {
    classification: "classified",
    ...params,
    ...(savedView?.filters || {})
  };
  const selectedCategories = listParam(effective.category);
  const categoryMatch = String(effective.category_match || "any") === "all" ? "all" : "any";
  const skillFilter = String(effective.skill || "").trim();

  // The shared filter helper works on the untyped Supabase builder (no generated DB types).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("recruiter_va_directory_health")
    .select("user_id,full_name,avatar_url,headline,primary_category,categories,skills,availability_status,stage,completion_score,missing_items,directory_visible,years_experience,hourly_rate,last_activity_at,email_verified,account_created_at,account_status,classification_status,classification_evidence_count,classification_missing,registration_health,email_confirmed,last_sign_in_at,has_private_address,has_resume,address_resume_status,address_resume_checked_at", { count: "exact" });

  if (sort === "completion") query = query.order("completion_score", { ascending: false }).order("last_activity_at", { ascending: false, nullsFirst: false });
  else if (sort === "experience") query = query.order("years_experience", { ascending: false, nullsFirst: false }).order("last_activity_at", { ascending: false, nullsFirst: false });
  else if (sort === "rate_low") query = query.order("hourly_rate", { ascending: true, nullsFirst: false });
  else if (sort === "rate_high") query = query.order("hourly_rate", { ascending: false, nullsFirst: false });
  else if (sort === "name") query = query.order("full_name", { ascending: true, nullsFirst: false });
  else query = query.order("last_activity_at", { ascending: false, nullsFirst: false });

  query = applyRecruiterTalentFilters(query, {
    q: effective.q,
    category: selectedCategories,
    category_match: categoryMatch,
    classification: effective.classification,
    registration: effective.registration,
    address: effective.address,
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
  const [
    { data: rowData, count, error },
    { data: roles, error: rolesError },
    { data: summaryData, error: summaryError },
    { count: neverStartedCount, error: neverStartedError },
    { count: emailUnconfirmedCount, error: emailUnconfirmedError },
    { count: profileIncompleteCount, error: profileIncompleteError },
    { count: missingResumeCount, error: missingResumeError },
    { count: missingAddressCount, error: missingAddressError },
    { count: addressReviewCount, error: addressReviewError },
  ] = await Promise.all([
    query.range(from, from + PAGE_SIZE - 1),
    admin
      .from("jobs")
      .select("id,title,company_name,status,client_id")
      .in("status", ["pending", "published"])
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("recruiter_talent_summary")
      .select("*")
      .eq("id", 1)
      .single(),
    admin.from("recruiter_va_registration_health").select("va_id", { count: "exact", head: true }).eq("registration_health", "never_started"),
    admin.from("recruiter_va_registration_health").select("va_id", { count: "exact", head: true }).eq("registration_health", "email_unconfirmed"),
    admin.from("recruiter_va_registration_health").select("va_id", { count: "exact", head: true }).eq("registration_health", "profile_incomplete"),
    admin.from("recruiter_va_registration_health").select("va_id", { count: "exact", head: true }).eq("has_resume", false),
    admin.from("recruiter_va_registration_health").select("va_id", { count: "exact", head: true }).eq("has_private_address", false),
    admin.from("recruiter_va_registration_health").select("va_id", { count: "exact", head: true }).eq("has_private_address", false).eq("address_resume_status", "review"),
  ]);
  if (error) throw error;
  if (rolesError) throw rolesError;
  if (summaryError) throw summaryError;
  if (neverStartedError) throw neverStartedError;
  if (emailUnconfirmedError) throw emailUnconfirmedError;
  if (profileIncompleteError) throw profileIncompleteError;
  if (missingResumeError) throw missingResumeError;
  if (missingAddressError) throw missingAddressError;
  if (addressReviewError) throw addressReviewError;

  const summary = summaryData as RecruiterTalentSummaryRow;
  const newAccountsCount = Number(summary.new_accounts_7d || 0);
  const recentZeroCount = Number(summary.recent_zero_7d || 0);
  const verifiedRecentZeroCount = Number(summary.verified_recent_zero_7d || 0);
  const stalled = Array.isArray(summary.stalled)
    ? summary.stalled as RecruiterVaDirectoryRow[]
    : [];

  const rows = (rowData || []) as RecruiterVaDirectoryRow[];
  const ids = rows.map((row) => row.user_id);
  let metaRows: RecruiterTalentPageMetaRow[] = [];
  if (ids.length) {
    const { data: pageMeta, error: pageMetaError } = await admin
      .from("recruiter_talent_page_meta")
      .select("*")
      .in("va_id", ids);
    if (pageMetaError) throw pageMetaError;
    metaRows = (pageMeta || []) as RecruiterTalentPageMetaRow[];
  }
  const reminderMap = new Map(metaRows.map((row) => [row.va_id, row]));
  const publicIds = new Set(metaRows.filter((row) => row.public_now).map((row) => row.va_id));
  const visibilityMap = new Map(metaRows.map((row) => [row.va_id, row]));
  const savedViewCounts = new Map<string, number>([
    ["all", Number(summary.talent_pool_count || 0)],
    ["incomplete_profiles", Number(summary.classification_incomplete_count || 0)],
    ["ready_to_classify", Number(summary.classification_ready_count || 0)],
    ["approval_ready", Number(summary.approval_ready_count || 0)],
    ["approval_cleanup", Number(summary.approval_cleanup_count || 0)],
    ["missing_photo", Number(summary.missing_photo_count || 0)],
    ["approved_hidden", Number(summary.approved_hidden_count || 0)],
    ["bench", Number(summary.bench_count || 0)],
    ["stale_60", Number(summary.stale_60_count || 0)],
    ["available", Number(summary.available_count || 0)],
    ["needs_review", Number(summary.needs_review_count || 0)],
    ["zero_not_started", Number(neverStartedCount || 0)],
    ["email_unconfirmed", Number(emailUnconfirmedCount || 0)],
    ["profile_incomplete", Number(profileIncompleteCount || 0)],
    ["missing_resume", Number(missingResumeCount || 0)],
    ["missing_address", Number(missingAddressCount || 0)],
    ["address_review", Number(addressReviewCount || 0)],
  ]);
  const primarySavedViews = SAVED_VIEWS.filter((view) => PRIMARY_SAVED_VIEW_KEYS.has(view.key));
  const secondarySavedViews = SAVED_VIEWS.filter((view) => !PRIMARY_SAVED_VIEW_KEYS.has(view.key));
  const secondaryViewActive = secondarySavedViews.some((view) => view.key === params.view);
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentUrl = `/workspace/recruiter/talent${qs(params, { page })}`;
  const affected = Number(params.affected || 0);
  const published = params.published === undefined ? null : Number(params.published || 0);
  const partialPublish = params.bulk_done === "approve_publish" && published !== null && published < affected;

  const filterHidden = <>
    {Object.entries({
      filter_q: effective.q,
      filter_classification: effective.classification,
      filter_registration: effective.registration,
      filter_address: effective.address,
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
    {selectedCategories.map((category) => <input key={category} type="hidden" name="filter_category" value={category} />)}
    <input type="hidden" name="filter_category_match" value={categoryMatch} />
  </>;

  const stages = ["profile", "test", "video", "recruiter_review", "finalist", "approved", "bench", "rejected"];
  const advancedFiltersActive = Boolean(
    selectedCategories.length
    || (effective.classification && effective.classification !== "classified")
    || effective.registration || effective.address || effective.photo || effective.resume || effective.skill || effective.min_experience
    || effective.max_rate || effective.availability || effective.stale
  );
  const readinessLabels: Record<string, string> = {
    zero: "Not started",
    incomplete: `Below ${APPROVAL_MIN_COMPLETION}%`,
    approval_ready: `Approval-ready (${APPROVAL_MIN_COMPLETION}%+)`,
    approval_cleanup: `Approved below ${APPROVAL_MIN_COMPLETION}%`,
    ready: `${PUBLIC_VA_MIN_COMPLETION}%+ with photo`,
    vetted_hidden: "Approved, not public"
  };
  const classificationLabels: Record<string, string> = {
    classified: "Classified talent",
    ready_to_classify: "Ready to classify",
    incomplete_profile: "Incomplete profile",
  };
  const directoryHeading = params.view === "incomplete_profiles"
    ? "Incomplete VA profiles"
    : params.view === "ready_to_classify"
      ? "Ready to classify"
      : params.view === "zero_not_started"
        ? "0% VA registrations"
        : params.view === "email_unconfirmed"
          ? "Unconfirmed VA emails"
          : params.view === "missing_address"
            ? "Missing addresses"
            : params.view === "address_review"
              ? "Resume address review"
              : "Talent pool";
  const directoryDescription = params.view === "incomplete_profiles"
    ? "Profiles without enough role evidence stay here until the VA adds enough information for reliable classification."
    : params.view === "ready_to_classify"
      ? "These profiles have enough evidence to classify but still need an automatic or recruiter-confirmed specialty."
      : params.view === "zero_not_started"
        ? "Email-confirmed VA accounts that never started profile setup. These stay outside the normal talent pool."
        : params.view === "email_unconfirmed"
          ? "VA registrations that have not confirmed their email address yet."
          : params.view === "missing_address"
            ? "Address is missing. Resume-backed recovery runs automatically when a safe labeled address is available."
            : params.view === "address_review"
              ? "A resume appears to contain a location, but it was not explicit enough to save automatically."
              : "Classified VAs stay in the working talent pool. Incomplete profiles are separated into their own rescue queue.";
  const activeFilters = [
    effective.q ? { key: "q", label: `Search: ${effective.q}` } : null,
    !params.view && effective.classification && effective.classification !== "classified"
      ? { key: "classification", label: classificationLabels[effective.classification] || effective.classification }
      : null,
    effective.registration ? { key: "registration", label: effective.registration === "email_unconfirmed" ? "Email unconfirmed" : effective.registration === "never_started" ? "Never started" : "Profile incomplete" } : null,
    effective.address ? { key: "address", label: effective.address === "review" ? "Resume address review" : "Missing address" } : null,
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


  return <div className="recruiter-talent-page">
    <RecruiterViewPreference storageKey="recruiter-talent-view-v1" view={params.view} sort={params.sort} />
    <div className="page-head">
      <div>
        <div className="kicker">Master VA directory</div>
        <h1>{directoryHeading}</h1>
        <p>{directoryDescription}</p>
      </div>
      <div className="row wrap">
        <Link className="btn" href="/workspace/recruiter/talent?stage=recruiter_review">Vetting queue</Link>
        <Link className="btn btn-primary" href="/workspace/recruiter/roles?view=needs_candidates&sort=urgent">Match roles</Link>
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
        {affected - (published || 0)} approved VA{affected - (published || 0) === 1 ? " is" : "s are"} still private because public-profile requirements or current publication consent are incomplete.
      </div>
    ) : null}
    {params.bulk_error ? <div className="alert">{params.bulk_error}</div> : null}

    {params.view === "bench" ? <RecruiterTalentOperationsPanel /> : null}

    <section className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <div className="dashboard-section-head">
        <div>
          <div className="kicker">Profile health</div>
          <h2>Fix the exact missing thing</h2>
          <p>Email confirmation, profile completion, and address are separate health signals. A VA can have one problem without being treated as 0% or incomplete everywhere.</p>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="stats">
        <Link className="stat-card" href="/workspace/recruiter/talent?view=email_unconfirmed">
          <span className="small muted">Email unconfirmed</span><strong>{Number(emailUnconfirmedCount || 0)}</strong><small className="muted">Auth confirmation only</small>
        </Link>
        <Link className="stat-card" href="/workspace/recruiter/talent?view=profile_incomplete">
          <span className="small muted">Profile incomplete</span><strong>{Number(profileIncompleteCount || 0)}</strong><small className="muted">Profile data still missing</small>
        </Link>
        <Link className="stat-card" href="/workspace/recruiter/talent?view=missing_resume">
          <span className="small muted">Missing resume</span><strong>{Number(missingResumeCount || 0)}</strong><small className="muted">Client-readiness blocker</small>
        </Link>
        <Link className="stat-card" href="/workspace/recruiter/talent?view=missing_address">
          <span className="small muted">Address missing</span><strong>{Number(missingAddressCount || 0)}</strong><small className="muted">Never public</small>
        </Link>
        <Link className="stat-card" href="/workspace/recruiter/talent?view=address_review">
          <span className="small muted">Resume address review</span><strong>{Number(addressReviewCount || 0)}</strong><small className="muted">Needs recruiter judgment</small>
        </Link>
      </div>
    </section>

    <section className="talent-onboarding-rescue">
      <div className="talent-onboarding-head">
        <div><div className="kicker">New VA onboarding</div><h2>Signup → profile rescue</h2><p>New accounts that are still at 0% belong here in Talent, not in a separate Categories dashboard. Email-verified accounts are prioritized first.</p></div>
        <div className="row wrap">
          <Link className="btn btn-sm" href="/workspace/recruiter/talent?view=zero_not_started">Open 0% accounts</Link>
          <Link className="btn btn-sm" href="/workspace/recruiter/talent?view=email_unconfirmed">Unconfirmed email</Link>
        </div>
      </div>
      <div className="talent-onboarding-stats">
        <div><span>New accounts · 7 days</span><strong>{newAccountsCount}</strong><small>Recent VA signups</small></div>
        <div><span>Recent 0% profiles · 7 days</span><strong>{recentZeroCount}</strong><small>Setup has not started</small></div>
        <div><span>Verified recent 0%</span><strong>{verifiedRecentZeroCount}</strong><small>Highest-priority rescue queue</small></div>
      </div>
      {stalled.length ? <div className="talent-onboarding-list">{stalled.map((row) => {
        const lastActiveDays = row.last_activity_at ? Math.max(0, Math.floor((Date.now() - new Date(row.last_activity_at).getTime()) / 86400000)) : null;
        return <Link href={"/workspace/recruiter/candidates/" + row.user_id} key={row.user_id}>
          <span className={row.email_verified ? "talent-onboarding-state verified" : "talent-onboarding-state"}>{row.email_verified ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}</span>
          <span><strong>{row.full_name || "VA account"}</strong><small>{row.email_verified ? "Email verified" : "Email not verified"} · {vettingStatusLabel(row.stage || "profile")}</small></span>
          <span>{lastActiveDays == null ? "Never active" : String(lastActiveDays) + "d ago"}</span>
        </Link>;
      })}</div> : <div className="talent-onboarding-clear"><CheckCircle2 size={16}/><span>No recent 0% VA accounts need onboarding rescue.</span></div>}
    </section>

    <div className="recruiter-saved-views" aria-label="Saved talent views">
      <div className="saved-view-head"><strong>Saved views</strong><span>Most-used recruiter queues</span></div>
      <div className="saved-view-list">
        {primarySavedViews.map((preset) => (
          <Link key={preset.key} className={(params.view || "all") === preset.key ? "saved-view active" : "saved-view"} href={`/workspace/recruiter/talent?view=${preset.key}&sort=${sort}`}>
            <span>{preset.label}</span><strong>{savedViewCounts.get(preset.key) || 0}</strong>
          </Link>
        ))}
      </div>
      <details className="saved-view-more" open={secondaryViewActive}>
        <summary><span>More views</span><ChevronDown size={14} /></summary>
        <div className="saved-view-list saved-view-list-secondary">
          {secondarySavedViews.map((preset) => (
            <Link key={preset.key} className={(params.view || "all") === preset.key ? "saved-view active" : "saved-view"} href={`/workspace/recruiter/talent?view=${preset.key}&sort=${sort}`}>
              <span>{preset.label}</span><strong>{savedViewCounts.get(preset.key) || 0}</strong>
            </Link>
          ))}
        </div>
      </details>
    </div>

    <form className="recruiter-filter-panel recruiter-filter-panel-clean" method="get">
      {params.view ? <input type="hidden" name="view" value={params.view} /> : null}
      <div className="filter-primary-row">
        <label className="directory-filter-search" aria-label="Search Virtual Assistants">
          <Search size={17} />
          <input name="q" defaultValue={effective.q} placeholder="Search name, role, specialty, skill, or tool" />
        </label>
        <label className="filter-field">
          <span>Stage</span>
          <select name="stage" defaultValue={effective.stage || ""}>
            <option value="">All stages</option>
            {stages.map((value) => <option key={value} value={value}>{vettingStatusLabel(value)}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <span>Availability</span>
          <select name="availability" defaultValue={effective.availability || ""}>
            <option value="">Any availability</option>
            <option value="available">Available now</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
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
        <button className="btn btn-primary filter-apply" type="submit"><Search size={15} /> Search</button>
        <Link className="filter-reset" href="/workspace/recruiter/talent?view=all&sort=recent"><X size={14} /> Clear</Link>
      </div>

      <details className="filter-more" open={advancedFiltersActive}>
        <summary><SlidersHorizontal size={15} /><span>More filters</span><ChevronDown size={15} className="filter-more-chevron" /></summary>
        <div className="filter-more-grid">
          <fieldset className="talent-category-filter">
            <legend>Specialties</legend>
            <div className="talent-category-filter-head">
              <small>Select multiple specialties to find hybrid VAs.</small>
              <label className="category-match-mode">
                <span>Match</span>
                <select name="category_match" defaultValue={categoryMatch}>
                  <option value="any">Any selected</option>
                  <option value="all">All selected</option>
                </select>
              </label>
            </div>
            <div className="talent-category-options">
              {VA_CATEGORIES.map((category) => (
                <label key={category} className={selectedCategories.includes(category) ? "talent-category-option selected" : "talent-category-option"}>
                  <input type="checkbox" name="category" value={category} defaultChecked={selectedCategories.includes(category)} />
                  <span>{vaCategoryLabel(category)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="filter-field"><span>Readiness</span><select name="readiness" defaultValue={effective.readiness || ""}><option value="">Any readiness</option><option value="zero">Not started</option><option value="incomplete">Below {APPROVAL_MIN_COMPLETION}%</option><option value="approval_ready">Approval-ready ({APPROVAL_MIN_COMPLETION}%+)</option><option value="approval_cleanup">Approved below {APPROVAL_MIN_COMPLETION}%</option><option value="ready">{PUBLIC_VA_MIN_COMPLETION}%+ with photo</option><option value="vetted_hidden">Approved, not public</option></select></label>
          <label className="filter-field"><span>Classification</span><select name="classification" defaultValue={effective.classification || ""}><option value="">Any classification state</option><option value="classified">Classified talent</option><option value="ready_to_classify">Ready to classify</option><option value="incomplete_profile">Incomplete profile</option></select></label>
          <label className="filter-field"><span>Registration</span><select name="registration" defaultValue={effective.registration || ""}><option value="">Any registration state</option><option value="never_started">Never started</option><option value="email_unconfirmed">Email unconfirmed</option><option value="profile_incomplete">Profile incomplete</option></select></label>
          <label className="filter-field"><span>Address</span><select name="address" defaultValue={effective.address || ""}><option value="">Any address state</option><option value="missing">Missing address</option><option value="review">Resume needs review</option></select></label>
          <label className="filter-field"><span>Photo</span><select name="photo" defaultValue={effective.photo || ""}><option value="">Any</option><option value="yes">Has photo</option><option value="no">Missing photo</option></select></label>
          <label className="filter-field"><span>Resume</span><select name="resume" defaultValue={effective.resume || ""}><option value="">Any</option><option value="yes">Has resume</option><option value="no">Missing resume</option></select></label>
          <label className="filter-field"><span>Activity</span><select name="stale" defaultValue={effective.stale || ""}><option value="">Any</option><option value="30">Inactive 30+ days</option><option value="60">Inactive 60+ days</option><option value="90">Inactive 90+ days</option></select></label>
          <label className="filter-field"><span>Min. experience</span><input type="number" min="0" name="min_experience" defaultValue={effective.min_experience} placeholder="Years" /></label>
          <label className="filter-field"><span>Max. hourly rate</span><input type="number" min="5" step="1" name="max_rate" defaultValue={effective.max_rate} placeholder="USD / hr" /></label>
        </div>
      </details>
      {activeFilters.length || selectedCategories.length ? (
        <div className="active-filter-row" aria-label="Active filters">
          <span className="active-filter-label">{activeFilters.length + selectedCategories.length} active</span>
          {selectedCategories.map((category) => (
            <Link
              key={category}
              className="active-filter-chip"
              href={`/workspace/recruiter/talent${qs(params, { category: selectedCategories.filter((item) => item !== category), page: 1 })}`}
            >
              {vaCategoryLabel(category)}<X size={12} />
            </Link>
          ))}
          {selectedCategories.length > 1 ? <span className="category-match-chip">{categoryMatch === "all" ? "Match all" : "Match any"}</span> : null}
          {activeFilters.map((filter) => (
            <Link key={filter.key} className="active-filter-chip" href={`/workspace/recruiter/talent${qs(params, { [filter.key]: undefined, page: 1 })}`}>
              {filter.label}<X size={12} />
            </Link>
          ))}
          <Link className="active-filter-clear" href="/workspace/recruiter/talent?view=all&sort=recent">Clear all</Link>
        </div>
      ) : null}
      <div className="filter-context-note"><strong>Classification gate:</strong> a VA needs at least two profile evidence signals, including at least one role signal from headline, summary, skills, or tools. Incomplete profiles stay out of the normal talent pool until that threshold is met and a specialty is assigned.</div>
    </form>

    <div className="row-between wrap" style={{ margin: "16px 0" }}>
      <span className="small muted"><strong>{total}</strong> matching VA{total === 1 ? "" : "s"} · page {page} of {pages}</span>
      <span className="small muted"><ShieldCheck size={14} style={{ verticalAlign: "-2px" }} /> Internal recruiter data</span>
    </div>

    <form id="recruiter-talent-bulk-form" action={bulkRecruiterTalentAction} className="stack">
      <input type="hidden" name="return_to" value={currentUrl} />
      {filterHidden}
      <RecruiterTalentSelectionControl
        formId="recruiter-talent-bulk-form"
        pageCount={rows.length}
        totalCount={total}
        filteredSelectionAllowed={total <= RECRUITER_BULK_LIMIT}
      />
      <div className="bulk-action-bar bulk-action-controls" aria-label="Actions for selected Virtual Assistants">
        <select name="bulk_action" required defaultValue="">
          <option value="" disabled>Action for selected VAs…</option>
          <option value="approve">Approve eligible ({APPROVAL_MIN_COMPLETION}%+)</option>
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
              const meta = visibilityMap.get(row.user_id);
              const publicProfile = meta ? {
                headline: meta.headline,
                bio: meta.bio,
                primary_category: meta.primary_category,
                skills: meta.skills || [],
                tools: meta.tools || [],
                years_experience: meta.years_experience,
                weekly_hours: meta.weekly_hours,
                hourly_rate: meta.hourly_rate,
                resume_path: meta.resume_path,
                portfolio_url: meta.portfolio_url,
                linkedin_url: meta.linkedin_url,
                availability_status: meta.availability_status || "",
                public_profile_consent: meta.public_profile_consent === true,
                public_profile_consent_at: meta.public_profile_consent_at,
                public_profile_consent_withdrawn_at: meta.public_profile_consent_withdrawn_at,
                public_profile_consent_version: meta.public_profile_consent_version,
              } : {};
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
              const classificationMissing = Array.isArray(row.classification_missing) ? row.classification_missing : [];
              const classificationStatus = String(row.classification_status || "incomplete_profile");
              const classificationMissingLabels: Record<string, string> = {
                headline: "headline",
                bio: "summary",
                skills: "3+ skills",
                tools: "2+ tools",
                industries: "industry",
              };
              const specialties = [...new Set([
                row.primary_category,
                ...(Array.isArray(row.categories) ? row.categories : []),
              ].filter((value): value is string => Boolean(value)))];
              const rowSkills = Array.isArray(row.skills) ? row.skills : [];
              const matchedCategories = selectedCategories.filter((category) => specialties.includes(category));
              const matchedSkill = skillFilter && rowSkills.some((skill) => skill.toLowerCase() === skillFilter.toLowerCase())
                ? skillFilter
                : "";
              const matchEvidence = [
                ...matchedCategories.map((category) => vaCategoryLabel(category)),
                ...(matchedSkill ? [`Skill: ${matchedSkill}`] : []),
              ];
              const hasPrivateAddress = Boolean(row.has_private_address);
              const registrationHealth = String(row.registration_health || "");
              const registrationLabel = registrationHealth === "email_unconfirmed"
                ? "Email unconfirmed"
                : registrationHealth === "never_started"
                  ? "Never started profile"
                  : registrationHealth === "profile_incomplete"
                    ? "Profile incomplete"
                    : "";
              const addressStatus = String(row.address_resume_status || "");
              const addressCopy = hasPrivateAddress
                ? "Address recorded"
                : addressStatus === "review"
                  ? "Resume address needs recruiter review"
                  : addressStatus === "no_match"
                    ? "No address found in resume"
                    : addressStatus === "unsupported"
                      ? "Resume format needs manual address review"
                      : addressStatus === "error"
                        ? "Resume address check failed"
                        : row.has_resume
                          ? "Address missing · resume pending"
                          : "Address missing · no resume source";

              return <tr key={row.user_id}>
                <td data-label="Select"><input type="checkbox" name="va_id" value={row.user_id} aria-label={`Select ${row.full_name || "VA"}`} /></td>
                <td data-label="Candidate">
                  <div className="candidate-identity-cell">
                    <PublicAvatar name={row.full_name || "VA"} src={row.avatar_url} size="sm" />
                    <div className="candidate-identity-copy">
                      <strong>{row.full_name || "VA account"}</strong>
                      <div className="small muted">{row.headline || row.primary_category || "Profile setup not started"}</div>
                      <div className="candidate-meta-line">{row.availability_status || "Availability not set"}</div>
                      {specialties.length ? <div className="talent-specialty-chips" aria-label="VA specialties">
                        {specialties.map((category) => <span key={category} className={category === row.primary_category ? "talent-specialty-chip primary" : "talent-specialty-chip"}>{vaCategoryLabel(category)}</span>)}
                      </div> : null}
                      {matchEvidence.length ? <div className="talent-match-reason"><strong>Matched because</strong><span>{matchEvidence.join(" · ")}</span></div> : null}
                    </div>
                  </div>
                </td>
                <td data-label="Status">
                  <div className="status-stack">
                    <span className="badge">{vettingStatusLabel(row.stage || "profile")}</span>
                    <span className={`visibility-label visibility-${visibility.toLowerCase().replaceAll(" ", "-")}`}>{visibility}</span>
                    {classificationStatus !== "classified" ? <span className={`classification-state classification-${classificationStatus}`}>
                      {classificationStatus === "ready_to_classify" ? "Ready to classify" : "Incomplete profile"}
                    </span> : null}
                    {!publicNow && approved ? <span className="public-blocker-copy">{publicMissing.length ? `Needs ${publicMissing.slice(0, 2).join(" · ")}${publicMissing.length > 2 ? ` +${publicMissing.length - 2}` : ""}` : "Eligible once visibility is enabled"}</span> : null}
                  </div>
                </td>
                <td data-label="Profile health">
                  <div className="readiness-cell">
                    <div className="readiness-line"><strong>{score}% complete</strong>{score >= APPROVAL_MIN_COMPLETION && !approved ? <span className="approval-ready-label">Approval-ready</span> : null}</div>
                    <div className="progress mini"><span style={{ width: `${score}%` }} /></div>
                    {registrationLabel ? <div className="classification-gap-copy"><strong>{registrationLabel}</strong>{registrationHealth === "never_started" && row.last_sign_in_at ? " · Signed in but setup was never started" : ""}</div> : null}
                    <div className="profile-issues">{missing.length ? `Needs: ${missing.slice(0, 2).join(" · ")}${missing.length > 2 ? ` +${missing.length - 2}` : ""}` : "No profile gaps flagged"}</div>
                    <div className={hasPrivateAddress ? "small muted" : "classification-gap-copy"}>{addressCopy}</div>
                    {classificationStatus === "incomplete_profile" ? <div className="classification-gap-copy">
                      Classification blocked · add {classificationMissing.slice(0, 3).map((key) => classificationMissingLabels[key] || key).join(" · ")}{classificationMissing.length > 3 ? ` +${classificationMissing.length - 3}` : ""}
                    </div> : classificationStatus === "ready_to_classify" ? <div className="classification-ready-copy">Enough profile evidence to classify</div> : null}
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
  </div>;
}
