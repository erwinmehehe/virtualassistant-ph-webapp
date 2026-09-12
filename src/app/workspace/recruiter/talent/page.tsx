import Link from "next/link";
import { Clock3, Mail, Search, ShieldCheck } from "lucide-react";
import { bulkRecruiterTalentAction } from "@/app/actions/recruiter-talent";
import { requireRole } from "@/lib/auth";
import { dateShort } from "@/lib/format";
import { applyRecruiterTalentFilters } from "@/lib/recruiter-talent-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { vettingStatusLabel } from "@/lib/vetting";

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
  return `?${out.toString()}`;
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
  const [{ data: rows, count, error }, { data: roles }] = await Promise.all([
    query.range(from, from + PAGE_SIZE - 1),
    admin
      .from("jobs")
      .select("id,title,company_name,status")
      .in("status", ["pending", "published"])
      .order("created_at", { ascending: false })
      .limit(100)
  ]);
  if (error) throw error;

  const ids = (rows || []).map((row: any) => row.user_id);
  const [{ data: reminders }, { data: publicRows }] = ids.length
    ? await Promise.all([
        admin
          .from("va_profile_reminders")
          .select("va_id,last_sent_at,reminder_count")
          .in("va_id", ids),
        admin.from("public_va_directory").select("user_id").in("user_id", ids)
      ])
    : [{ data: [] }, { data: [] }];

  const reminderMap = new Map((reminders || []).map((row: any) => [row.va_id, row]));
  const publicIds = new Set((publicRows || []).map((row: any) => row.user_id));
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

    <form className="recruiter-filter-panel" method="get">
      <div className="directory-filter-search">
        <Search size={16} />
        <input name="q" defaultValue={params.q} placeholder="Search name, headline, category" />
      </div>
      <select name="stage" defaultValue={params.stage || ""}>
        <option value="">All stages</option>
        {stages.map((value) => <option key={value} value={value}>{vettingStatusLabel(value)}</option>)}
      </select>
      <select name="readiness" defaultValue={params.readiness || ""}>
        <option value="">Any readiness</option>
        <option value="zero">0% - Profile not started</option>
        <option value="incomplete">1-79% - Incomplete</option>
        <option value="ready">80%+ with a photo - Ready to approve</option>
        <option value="vetted_hidden">Approved but not public</option>
      </select>
      <select name="photo" defaultValue={params.photo || ""}>
        <option value="">Photo: any</option>
        <option value="yes">Has photo</option>
        <option value="no">Missing photo</option>
      </select>
      <select name="resume" defaultValue={params.resume || ""}>
        <option value="">Resume: any</option>
        <option value="yes">Has resume</option>
        <option value="no">Missing resume</option>
      </select>
      <input name="skill" defaultValue={params.skill} placeholder="Skill contains" />
      <input type="number" min="0" name="min_experience" defaultValue={params.min_experience} placeholder="Min years" />
      <input type="number" min="5" step="1" name="max_rate" defaultValue={params.max_rate} placeholder="Max $/hr" />
      <select name="availability" defaultValue={params.availability || ""}>
        <option value="">Availability: any</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
      <select name="stale" defaultValue={params.stale || ""}>
        <option value="">Activity: any</option>
        <option value="30">Stale 30+ days</option>
        <option value="60">Stale 60+ days</option>
        <option value="90">Stale 90+ days</option>
      </select>
      <button className="btn btn-primary" type="submit">Apply filters</button>
      <Link className="btn" href="/workspace/recruiter/talent">Reset</Link>
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
          <span><strong>Select all {total} filtered results</strong><small>Unchecked = only row checkboxes below</small></span>
        </label>
        <select name="bulk_action" required defaultValue="">
          <option value="" disabled>Bulk action…</option>
          <option value="approve">Approve eligible (80% + photo)</option>
          <option value="bench">Move approved to Bench</option>
          <option value="approve_publish">Approve + publish if public-ready</option>
          <option value="mark_reviewed">Mark profile edit reviewed</option>
          <option value="request_changes">Request profile changes</option>
          <option value="remind">Email completion reminder</option>
          <option value="hide">Hide from public directory</option>
          <option value="reject">Reject</option>
          <option value="assign">Assign to role</option>
        </select>
        <select name="job_id" defaultValue="">
          <option value="">Role for assignment…</option>
          {(roles || []).map((job: any) => <option key={job.id} value={job.id}>{job.title} — {job.company_name || job.status}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Apply</button>
      </div>

      <div className="table-wrap responsive-table">
        <table>
          <thead><tr><th></th><th>VA</th><th>Stage</th><th>Readiness</th><th>Missing</th><th>Experience / rate</th><th>Activity</th><th>Reminder</th><th></th></tr></thead>
          <tbody>
            {(rows || []).length ? (rows || []).map((row: any) => {
              const missing = Array.isArray(row.missing_items) ? row.missing_items : [];
              const reminder: any = reminderMap.get(row.user_id);
              const activity = row.last_activity_at ? Math.floor((Date.now() - new Date(row.last_activity_at).getTime()) / 86400000) : null;
              const publicNow = publicIds.has(row.user_id);
              const approved = ["approved", "bench"].includes(String(row.stage || ""));
              const visibility = publicNow ? "Public" : approved ? (row.directory_visible ? "Blocked from public" : "Hidden") : "Private";

              return <tr key={row.user_id}>
                <td data-label="Select"><input type="checkbox" name="va_id" value={row.user_id} aria-label={`Select ${row.full_name || "VA"}`} /></td>
                <td data-label="VA">
                  <strong>{row.full_name || "VA account"}</strong>
                  <div className="small muted">{row.headline || row.primary_category || "Profile setup not started"}</div>
                  <div className="small muted">{row.headline || row.primary_category ? `${row.availability_status || "Not set"}` : "Availability not set yet"} · {visibility}</div>
                </td>
                <td data-label="Stage"><span className="badge">{vettingStatusLabel(row.stage || "profile")}</span></td>
                <td data-label="Readiness"><div className="readiness-cell"><strong>{row.completion_score || 0}% ready</strong><div className="progress mini"><span style={{ width: `${row.completion_score || 0}%` }} /></div></div></td>
                <td data-label="Missing"><div className="pill-list compact-pills">{missing.length ? missing.slice(0, 4).map((item: string) => <span className="badge badge-warning" key={item}>{item}</span>) : <span className="badge badge-success">Complete</span>}{missing.length > 4 ? <span className="small muted">+{missing.length - 4}</span> : null}</div></td>
                <td data-label="Experience / rate">{row.years_experience ?? 0} yrs<div className="small muted">{row.hourly_rate ? `USD ${Number(row.hourly_rate).toFixed(2)}/hr` : "Rate missing"}</div></td>
                <td data-label="Activity">{activity == null ? <span className="small muted">Unknown</span> : <span className={activity >= 60 ? "badge badge-warning" : "small"}><Clock3 size={13} /> {activity}d ago</span>}</td>
                <td data-label="Reminder">{reminder?.last_sent_at ? <span className="small"><Mail size={13} /> {dateShort(reminder.last_sent_at)} · #{reminder.reminder_count}</span> : <span className="small muted">Never</span>}</td>
                <td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/candidates/${row.user_id}`}>Internal profile</Link></td>
              </tr>;
            }) : <tr><td colSpan={9}><div className="empty">No VAs match those filters.</div></td></tr>}
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
