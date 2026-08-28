import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { BLOG_POSTS, blogHref } from "@/lib/blog";

const labels: Record<string, string> = {
  page_view: "Page views",
  hero_role_brief: "Hero to role brief",
  hero_browse_talent: "Hero to directory",
  directory_role_brief: "Directory to role brief",
  directory_profile_view: "Directory to profile",
  featured_profile_view: "Homepage to profile",
  talent_request_intro: "Profile to introduction",
  role_brief_submit: "Role brief submit clicks",
  role_brief_create_account: "Role brief to client account",
  job_apply: "VA application submit clicks",
  header_hire_va: "Header to role brief",
  account_created: "Completed account creations",
  blog_cta_match: "Blog to match request",
  blog_service_click: "Blog to service page",
  blog_related_click: "Blog to related guide",
  blog_tool_click: "Blog to free tool",
  tool_open: "Tool opens",
  tool_complete: "Tool completions",
  tool_cta_match: "Tool to hiring CTA",
  lead_submit: "Saved match requests",
  job_draft_created: "Private job drafts created",
  qualified_lead: "Client-claimed qualified leads"
};

type EventRow = {
  event_name: string;
  path: string;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type LeadRow = { id: string; source_page: string | null; created_at: string; status: string };

export default async function AdminAnalyticsPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: eventRows }, { data: leadRows }] = await Promise.all([
    admin.from("analytics_events").select("event_name,path,session_id,metadata,created_at").gte("created_at", since).order("created_at", { ascending: true }).limit(10000),
    admin.from("lead_intake").select("id,source_page,created_at,status").gte("created_at", since).order("created_at", { ascending: false })
  ]);

  const events = (eventRows || []) as EventRow[];
  const leads = (leadRows || []) as LeadRow[];
  const counts = new Map<string, number>();
  const sessions = new Set<string>();
  for (const event of events) {
    counts.set(event.event_name, (counts.get(event.event_name) || 0) + 1);
    if (event.session_id) sessions.add(event.session_id);
  }

  const roleBriefs = leads.filter((lead) => ["public_role_brief", "talent_introduction_request"].includes(lead.source_page || ""));
  const introBriefs = roleBriefs.filter((lead) => lead.source_page === "talent_introduction_request");
  const accountEvents = events.filter((event) => event.event_name === "account_created");
  const clientAccounts = accountEvents.filter((event) => event.metadata?.role === "client").length;
  const pageViews = counts.get("page_view") || 0;
  const roleClicks = (counts.get("hero_role_brief") || 0) + (counts.get("directory_role_brief") || 0) + (counts.get("header_hire_va") || 0);

  const blogPaths = new Set(BLOG_POSTS.map(blogHref));
  const isBlogPath = (path: string) => path === "/blog" || path === "/blog/" || path.startsWith("/blog/") || blogPaths.has(path.endsWith("/") ? path : `${path}/`);
  const blogSessions = new Set(events.filter((event) => event.event_name === "page_view" && isBlogPath(event.path) && event.session_id).map((event) => event.session_id as string));
  const fromBlogSession = (event: EventRow) => Boolean(event.session_id && blogSessions.has(event.session_id));
  const blogPageViews = events.filter((event) => event.event_name === "page_view" && isBlogPath(event.path)).length;
  const blogServiceClicks = events.filter((event) => event.event_name === "blog_service_click" && fromBlogSession(event)).length;
  const blogProfileViews = events.filter((event) => /^service_[a-z0-9_]+_profile$/.test(event.event_name) && fromBlogSession(event)).length;
  const blogMatchClicks = events.filter((event) => (event.event_name === "blog_cta_match" || /^service_[a-z0-9_]+_match$/.test(event.event_name)) && fromBlogSession(event)).length;
  const blogLeadSubmits = events.filter((event) => event.event_name === "lead_submit" && (fromBlogSession(event) || isBlogPath(event.path))).length;
  const blogQualified = events.filter((event) => event.event_name === "qualified_lead" && fromBlogSession(event)).length;

  const acquisitionFunnel = [
    ["Known sessions", sessions.size, "Unique first-party session IDs recorded"],
    ["Page views", pageViews, "All recorded public page views"],
    ["Role-brief CTA clicks", roleClicks, "Tracked header, hero, and directory entry clicks"],
    ["Saved role briefs", roleBriefs.length, "Server-side role brief records"],
    ["Client accounts created", clientAccounts, "Completed client signups recorded server-side"]
  ] as const;

  const contentFunnel = [
    ["Blog page views", blogPageViews, "Article and topic-hub page views"],
    ["Blog sessions", blogSessions.size, "Unique sessions that viewed blog content"],
    ["Service clicks", blogServiceClicks, "Blog visitors who clicked into a service page"],
    ["VA profile views", blogProfileViews, "Service profile clicks from blog-origin sessions"],
    ["Match CTA clicks", blogMatchClicks, "Match-request intent from blog-origin sessions"],
    ["Saved match requests", blogLeadSubmits, "Server-recorded lead submissions tied to blog attribution"],
    ["Qualified leads", blogQualified, "Blog-attributed leads claimed by a client account or qualified through the legacy admin flow"]
  ] as const;

  return <>
    <div className="page-head"><div><h1>Conversion analytics</h1><p>First-party acquisition and content-funnel signals for the last 30 days. Server-side lead records remain the conversion source of truth.</p></div><span className="badge">Since {dateShort(since)}</span></div>

    <div className="stats">{acquisitionFunnel.map(([label, value, description]) => <div className="stat-card" key={label}><span className="small muted">{label}</span><strong>{value}</strong><span className="small muted">{description}</span></div>)}</div>

    <section className="card" style={{ marginBottom: 18 }}><div className="section-head"><div><div className="kicker">Content to revenue</div><h2>Blog to qualified-lead funnel</h2><p>Uses the same anonymous session ID from first article view through service/profile interactions, match request, and admin conversion.</p></div></div><div className="stats">{contentFunnel.map(([label, value, description]) => <div className="stat-card" key={label}><span className="small muted">{label}</span><strong>{value}</strong><span className="small muted">{description}</span></div>)}</div></section>

    <div className="grid-2">
      <section className="card"><h3>Tracked acquisition events</h3><div className="table-wrap responsive-table"><table><thead><tr><th>Event</th><th>Count</th></tr></thead><tbody>{Object.entries(labels).map(([event, label]) => <tr key={event}><td data-label="Event"><strong>{label}</strong><div className="small muted">{event}</div></td><td data-label="Count">{counts.get(event) || 0}</td></tr>)}</tbody></table></div></section>
      <section className="card"><h3>Lead outcomes</h3><div className="stack"><div className="review-answer"><span className="small muted">Saved role briefs</span><strong className="score-big" style={{ display: "block" }}>{roleBriefs.length}</strong></div><div className="review-answer"><span className="small muted">Talent-specific introduction requests</span><strong style={{ fontSize: 24, display: "block" }}>{introBriefs.length}</strong></div><div className="review-answer"><span className="small muted">Private job drafts created</span><strong style={{ fontSize: 24, display: "block" }}>{leads.filter((lead) => lead.status === "converted").length}</strong></div><p className="small muted">Event counts measure interaction, not unique people. For experiments, compare session-based rates and keep server-side lead records as the conversion outcome.</p></div></section>
    </div>
  </>;
}
