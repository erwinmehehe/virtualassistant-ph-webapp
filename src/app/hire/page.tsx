import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { submitRoleBriefAction } from "@/app/actions/leads";
import { VA_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { PublicAvatar } from "@/components/public-avatar";
import { AttributionFields } from "@/components/attribution-fields";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Hire a Virtual Assistant from the Philippines",
  description: "Tell us the role, hours, timezone, and budget. VirtualAssistant.com.ph uses your brief to help you meet vetted Filipino virtual assistants.",
  keywords: ["hire a virtual assistant", "hire filipino virtual assistant", "get matched with a virtual assistant"]
, alternates: { canonical: canonicalPath("/hire") }};

export default async function HirePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const talent = params.talent?.trim();
  const lead = params.lead?.trim();
  const sourcePath = params.source?.startsWith("/") && !params.source.startsWith("//") ? params.source : "/hire";
  const supabase = await createClient();
  const { data: requested } = talent ? await supabase.from("public_va_directory").select("slug,full_name,avatar_url,headline,primary_category").eq("slug", talent).maybeSingle() : { data: null };

  return <><SiteHeader/><main id="main-content" className="section"><div className="container hire-layout">
    <section>
      
      <h1 className="public-page-title">Get matched with the right VA.</h1>
      <p className="public-lede">Share the role, schedule, and budget. We will turn it into a private draft and use it to match you with vetted Filipino virtual assistants.</p>
      <div className="trust-list">
        {["Private by default. Nothing is published until you review it.", "No account required to send your brief; create one later to manage matches."].map((item, index) => <div className="trust-item" key={`${String(item)}-${index}`}><CheckCircle2 size={18}/><span>{item}</span></div>)}
      </div>
      {requested ? <div className="card requested-talent"><div className="row"><PublicAvatar name={requested.full_name} src={requested.avatar_url} size="sm"/><div><div className="small muted">Introduction requested for</div><strong>{requested.full_name}</strong><div className="small muted">{requested.headline || requested.primary_category}</div></div></div><Link className="small text-link" href={`/va/${requested.slug}`}>Review profile again</Link></div> : talent ? <div className="alert">We could not find that talent profile, but you can still send your role brief.</div> : null}
    </section>

    <section className="card lead-form-card">
      {params.sent ? <div className="success-state"><CheckCircle2 size={38}/><h2>Your private job draft is ready</h2><p>We saved your hiring request and created a private pending job draft. Create a client account to claim it, review the details, and manage candidates.</p><div className="stack"><Link className="btn btn-primary" href={`/auth/join/client?${new URLSearchParams({...(lead ? {lead} : {}), ...(talent ? {talent} : {})}).toString()}`} data-track="role_brief_create_account">Create client account and claim job</Link><Link className="btn" href="/find-talent">Keep browsing vetted VAs</Link></div></div> : <form action={submitRoleBriefAction} className="stack compact-hire-form">
        <div className="compact-hire-form-head"><h2>Get matched</h2><p className="small muted">About 60 seconds. Required fields are marked.</p></div>
        {params.error ? <div className="alert" role="alert">{params.error}</div> : null}
        {talent ? <input type="hidden" name="talent" value={talent}/> : null}
        <AttributionFields sourcePath={sourcePath} />
        <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
        <div className="field"><label htmlFor="category">What type of help do you need? *</label><select id="category" name="category" required defaultValue={requested?.primary_category || (VA_CATEGORIES.includes(params.category as any) ? params.category : "")}><option value="" disabled>Select a specialty</option>{VA_CATEGORIES.map((x,index)=><option key={`${String(x)}-${index}`}>{x}</option>)}</select></div>
        <div className="form-grid compact-form-grid">
          <div className="field"><label htmlFor="hours">Hours / week *</label><select id="hours" name="hours" required defaultValue=""><option value="" disabled>Select hours</option><option>Under 10 hours/week</option><option>10 to 20 hours/week</option><option>20 to 30 hours/week</option><option>30 to 40 hours/week</option><option>40+ hours/week</option></select></div>
          <div className="field"><label htmlFor="budget">Hourly budget *</label><select id="budget" name="budget" required defaultValue=""><option value="" disabled>Select budget</option><option>USD 5 to 8/hour</option><option>USD 8 to 12/hour</option><option>USD 12 to 18/hour</option><option>USD 18 to 25/hour</option><option>USD 25+/hour</option><option>Not sure yet</option></select></div>
        </div>
        <div className="form-grid compact-form-grid">
          <div className="field"><label htmlFor="timezone">Timezone / overlap *</label><input id="timezone" name="timezone" required placeholder="US Eastern, 3h overlap"/></div>
          <div className="field"><label htmlFor="start_time">Start date</label><select id="start_time" name="start_time" defaultValue=""><option value="">Flexible</option><option>As soon as possible</option><option>Within 2 weeks</option><option>Within 30 days</option><option>More than 30 days</option></select></div>
        </div>
        <div className="field"><label htmlFor="email">Work email *</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com"/></div>
        <div className="field"><label htmlFor="message">What should this VA own? *</label><textarea id="message" name="message" rows={3} required minLength={15} placeholder="Main tasks, tools, or must-have experience -- e.g. inbox and calendar management, CRM updates, and customer follow-up in HubSpot."/></div>
        <details className="hire-optional-details">
          <summary>Add name &amp; company <span>(optional)</span></summary>
          <div className="form-grid compact-form-grid">
            <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name"/></div>
            <div className="field"><label htmlFor="company">Company</label><input id="company" name="company" autoComplete="organization"/></div>
          </div>
        </details>
        <button className="btn btn-primary compact-hire-submit" type="submit" data-track="role_brief_submit">Get matched</button>
        <p className="small muted compact-hire-fineprint">This creates a private draft only. Nothing is published until you review it.</p>
      </form>}
    </section>
  </div></main><SiteFooter/></>;
}
