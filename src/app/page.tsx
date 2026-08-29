import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, MessageSquareText, ShieldCheck, UsersRound, WandSparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { PublicAvatar } from "@/components/public-avatar";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { mergeUniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import { SERVICE_PAGES } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: { absolute: "Hire Virtual Assistants | Virtual Assistant Philippines" },
  description: "Virtual Assistant Philippines — hire vetted, screened Filipino VAs matched to your role. Browse approved talent or request a private shortlist today.",
  keywords: ["virtual assistant philippines", "hire filipino virtual assistant", "filipino va", "virtual assistant services philippines", "outsource to the philippines"],
  alternates: { canonical: canonicalPath("/") }
};

const GROUP_BLURBS: Record<string, string> = {
  "Admin & Operations": "Inbox, calendar, data, and the recurring coordination that quietly eats a founder's week.",
  "Healthcare": "Patient scheduling, records, insurance follow-up, and front-desk cover for clinics and practices.",
  "Marketing & Growth": "Content calendars, campaign execution, reporting, and the steady work between strategy reviews.",
  "Finance & Accounting": "Bookkeeping, invoicing, reconciliations, and month-end reporting kept current without chasing.",
  "Sales & CRM": "Prospect research, outreach sequences, appointment setting, and CRM records that stay accurate.",
  "Ecommerce": "Listings, orders, returns, supplier follow-up, and the stock detail that keeps a storefront honest.",
  "Real Estate": "Listing coordination, transaction paperwork, lead follow-up, and calendar management for agents.",
  "Customer & Front Desk": "Email, chat, and phone cover with response times you can actually hold people to.",
  "Creative & Content": "Editing, design support, and production work that keeps a publishing schedule moving.",
  "Executive Support": "Diary control, travel, briefing notes, and the follow-through after the meeting ends."
};

const roleGroups = Array.from(
  SERVICE_PAGES.reduce((groups, page) => {
    const list = groups.get(page.group) || [];
    list.push(page);
    groups.set(page.group, list);
    return groups;
  }, new Map<string, typeof SERVICE_PAGES>())
).filter(([group]) => GROUP_BLURBS[group]).sort((a, b) => b[1].length - a[1].length).slice(0, 6);

const faqs = [
  ["What does “vetted” mean?", "A public VA profile only appears after the candidate completes the required profile, category skills test, video introduction, recruiter review, and final approval workflow."],
  ["Do I have to sort through every applicant?", "No. You can browse approved talent, receive matched candidates, and manage a focused shortlist in your client workspace."],
  ["How much does a VA cost?", "VA compensation varies by experience, specialty, tools, hours, and schedule. Ongoing hourly roles on the platform cannot be posted below USD 5/hour. VirtualAssistant.com.ph service fees are separate and are shown before you publish a role."],
  ["Can I request a specific VA?", "Yes. Open a public talent profile and request an introduction. The selected profile stays attached to your signup path so you do not have to find the person again."],
  ["What happens after I send a match request?", "Your request stays private. It creates a draft the team can review with you before anything is published, then you can claim the draft in a client workspace and manage candidates there."]
] as const;

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: featured }] = await Promise.all([
    supabase.from("public_va_directory").select("user_id,slug,full_name,avatar_url,headline,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate").gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE).not("avatar_url", "is", null).limit(9),
  ]);

  const featuredWithPhotos = (featured ?? []).filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim()).slice(0, 3);

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "VirtualAssistant.com.ph",
      url: base,
      logo: `${base}/icon.svg`,
      description: "Hire vetted virtual assistants from the Philippines. Screened talent, private role briefs, and a clearer hiring process."
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "VirtualAssistant.com.ph",
      url: base,
      publisher: { "@id": `${base}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/find-talent?q={search_term_string}` },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${base}/#faq`,
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
    }
  ];

  return <><SiteHeader/><main id="main-content">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />
    <section className="hero"><div className="container hero-grid"><div><h1>Virtual Assistant Philippines</h1><p>We recruit, screen, and match experienced Filipino virtual assistants to your business — with ongoing placement support after they start, not just an introduction.</p><div className="row wrap hero-actions"><Link className="btn btn-primary btn-lg" href="/find-talent">Hire a VA <ArrowRight size={17}/></Link><Link className="btn btn-lg" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Post a Job</Link><Link className="btn btn-lg" href="/jobs">Find VA Jobs</Link></div><p className="small muted hero-trust-row">Skills tested &middot; Human vetted &middot; 2+ years experience &middot; 30-day replacement support</p><p className="supply-link">Need more hands-on recruiting and placement support? <Link href="/hire">See managed hiring.</Link></p></div>
      <div className="hero-panel proof-panel"><h2>What vetting covers</h2>{[[ClipboardCheck,"Role-specific profile","Experience, skills, tools, and availability"],[ShieldCheck,"Category skills test","Practical screening for the VA’s primary specialty"],[MessageSquareText,"Communication check","Short video plus human review"],[UsersRound,"Recruiter scorecard","Skills, judgment, reliability, and client readiness"],[CheckCircle2,"Final approval","Only approved, available VAs can appear publicly"]].map(([Icon,title,copy]:any)=><div className="proof-row" key={title}><span className="proof-icon"><Icon size={18}/></span><span><strong>{title}</strong><small>{copy}</small></span></div>)}</div></div></section>

    <section className="section section-white"><div className="container"><div className="section-head row-between wrap"><div><h2>Meet experienced, approved talent.</h2><p>Public discovery is limited to approved, available VAs with at least 2 years of professional experience.</p></div><Link className="btn" href="/find-talent">Browse all VAs <ArrowRight size={16}/></Link></div>{featuredWithPhotos.length ? <div className="grid-3">{featuredWithPhotos.map((va:any)=><article className="card talent-card homepage-talent-card" key={va.user_id}><div className="row"><PublicAvatar name={va.full_name} src={va.avatar_url}/><div><h3>{va.full_name}</h3><div className="muted small">{va.headline || va.primary_category || "Virtual Assistant"}</div></div></div><div className="pill-list">{mergeUniqueStrings(va.primary_category, va.categories).slice(0,2).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div><div className="talent-facts"><span>{va.years_experience}+ yrs experience</span><span>{va.weekly_hours ? `${va.weekly_hours} hrs/week available` : "Flexible availability"}</span>{va.hourly_rate ? <span>${Number(va.hourly_rate).toFixed(0)}/hr preferred</span> : null}</div><Link className="btn btn-primary" href={`/va/${va.slug}`}>View profile</Link></article>)}</div> : <div className="card empty">Approved public profiles will appear here as experienced talent becomes available.</div>}</div></section>

    <section className="section product-paths-section"><div className="container"><div className="section-head"><h2>A guided workflow for both sides of the marketplace.</h2><p>The workspace now makes the next action obvious instead of dropping clients or VAs into a blank dashboard.</p></div><div className="grid-2 product-path-grid"><div className="card product-path-card"><div className="product-path-icon"><WandSparkles size={20}/></div><h3>For clients: create a role in 4 steps</h3><p>Role & skills → scope & schedule → budget & support → review. Skill chips, budget guidance, local autosave, and a final review screen keep job posts clear without turning the form into a wall of fields.</p><div className="mini-step-row"><span>1 Role</span><span>2 Scope</span><span>3 Budget</span><span>4 Review</span></div><Link className="btn btn-primary" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Post your first job</Link></div><div className="card product-path-card"><div className="product-path-icon"><ShieldCheck size={20}/></div><h3>For VAs: know exactly what to finish</h3><p>Your overview includes an onboarding checklist and profile-strength meter. The profile editor updates strength live while you add experience, skills, tools, availability, rate, and proof.</p><div className="mini-strength"><div className="row-between"><strong>Profile strength</strong><span>80%</span></div><div className="progress"><span style={{width:"80%"}}/></div><small>Public discovery also requires 2+ years of experience and final approval.</small></div><Link className="btn" href="/auth/join/va">Build a VA profile</Link></div></div></div></section>


    <section className="section" id="how-it-works"><div className="container"><div className="section-head"><h2>From workload to shortlist in three steps.</h2><p>Start with a private match request or a specific VA profile. Create an account only when you are ready to manage the hiring process.</p></div><div className="process-grid">{[["01","Describe the work","Share the specialty, hours, timezone, budget, and recurring work this person should own."],["02","Compare focused candidates","Review approved profiles, staff-ranked matches, applications, or invites, then move the strongest fits into interviews."],["03","Confirm the hire","Agree the final rate, start date, schedule, and responsibilities before onboarding begins."]].map(([n,title,copy])=><div className="process-step" key={n}><div className="process-number">{n}</div><h3>{title}</h3><p className="muted">{copy}</p></div>)}</div></div></section>

    <section className="section section-alt"><div className="container">
      <div className="section-head"><h2>Hire a Filipino virtual assistant without sorting through 200 applicants.</h2><p>Most ways to hire a Filipino virtual assistant put the screening on you. This one does not — but you still choose the person.</p></div>
      <div className="grid-3 hiring-compare-grid">
        <article className="card">
          <h3>Job marketplaces</h3>
          <p>Post a role and get a hundred applications, most of them irrelevant. Profiles are self-reported, so screening, testing, and reference-checking are your problem. Cheapest upfront, most expensive in your time.</p>
        </article>
        <article className="card">
          <h3>Traditional agencies</h3>
          <p>Someone is assigned to you. You rarely meet alternatives, rates are bundled into one monthly figure, and swapping people means restarting the conversation.</p>
        </article>
        <article className="card hiring-compare-ours">
          <h3>VirtualAssistant.com.ph</h3>
          <p>Every Filipino virtual assistant here has passed a skills test in their category, recorded a video introduction, and cleared a recruiter review before you see them. You interview and decide. VA pay and our service fee are shown separately, before you publish the role.</p>
        </article>
      </div>
      <div className="row wrap hiring-compare-actions">
        <Link className="btn btn-primary" href="/find-talent">Browse VAs <ArrowRight size={16}/></Link>
        <Link className="btn" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Post a Job</Link>
      </div>
    </div></section>

    <section className="section seo-content-section"><div className="container">
      <div className="seo-content-layout">
        <div className="seo-content-main">
          <h2>Virtual assistant Philippines: what you get, and what it costs</h2>
          <p className="seo-content-lede">The Philippines is the largest source of English-speaking remote support staff in the world, and for good reason — but the country is not the hard part. Finding the right person in it is.</p>

          <h3>Why businesses hire virtual assistants in the Philippines</h3>
          <p>Filipino professionals work in English every day, in business cultures built around Western clients. Most have spent years inside the same tools your team already uses — Google Workspace, Slack, HubSpot, Xero, Shopify, Canva — so the ramp-up is about your process, not the software. The country runs on UTC+8, which gives you a working morning that overlaps Australia and Asia, and an overnight shift that means US and UK work is done before you open your laptop.</p>
          <p>The economics matter too, and they are honest ones: a skilled virtual assistant in the Philippines earns a good local living at a rate that is a fraction of a Western hire, because the cost of living differs — not because the work is worth less. Roles priced properly last for years. Roles priced at the floor churn in months.</p>

          <h3>What a virtual assistant actually takes off your plate</h3>
          <p>The work that suits this best is the work that repeats. Inbox and calendar control, so your day is not decided by whoever emailed last. Customer email and chat handled from a playbook, with the odd cases escalated rather than guessed. Bookkeeping kept current instead of reconstructed each quarter. Product listings, orders and returns. Prospect research, outreach follow-up and a CRM that stays accurate. Content calendars, scheduling, reporting.</p>
          <p>What does not suit it: one-off specialist judgment, or any process that does not exist yet. If nobody on your team could write down how the task is done, a new hire cannot pick it up remotely. Settle the process first, then hand over the layer around it.</p>

          <h3>What it costs to hire</h3>
          <p>General administrative, inbox and data work sits at roughly $5–8 an hour. Experienced specialists — executive assistants, customer support leads, ecommerce operations, bookkeepers — run about $8–12. Senior or heavily tool-specific roles go above that. Ongoing hourly roles cannot be posted below $5 an hour on this platform, and VA pay is always shown separately from our service fee, so you can see exactly what reaches the person doing the work.</p>

          <h3>How we screen before you meet anyone</h3>
          <p>Every virtual assistant listed here has completed a skills test in their category, recorded a video introduction, passed a recruiter review, and been approved before their profile becomes visible. That is four pieces of evidence gathered before you spend a minute interviewing. You still run the interview and you still make the decision — but you start from a shortlist that has already been filtered by someone whose job is filtering.</p>
        </div>

        <aside className="seo-content-aside">
          <div className="seo-fact-card">
            <span className="kicker">At a glance</span>
            <dl>
              <div><dt>Timezone</dt><dd>UTC+8 — overnight cover for the US and UK, same-day for Australia</dd></div>
              <div><dt>Typical rates</dt><dd>$5–8 admin · $8–12 specialist · $12+ senior</dd></div>
              <div><dt>Screening</dt><dd>Skills test, video intro, recruiter review, final approval</dd></div>
              <div><dt>After the hire</dt><dd>Ongoing placement support and 30-day replacement cover</dd></div>
            </dl>
            <Link className="btn btn-primary" href="/find-talent">Browse vetted VAs <ArrowRight size={15}/></Link>
            <Link className="btn" href="/pricing">See pricing</Link>
          </div>
        </aside>
      </div>
    </div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>Choose the level of hiring support you need.</h2><p>VA compensation and the VirtualAssistant.com.ph service fee are separate. Pricing is shown before you publish a role.</p></div><div className="grid-2"><div className="card service-card"><h3>Managed VA service <span className="badge badge-success">Recommended</span></h3><p>Recruiting and vetting plus a structured operating layer after the VA starts -- your VA is backed by our team for as long as you work together, not left on their own after day one.</p><ul className="check-list"><li>Recruiting, screening, and matching</li><li>Structured onboarding workroom</li><li>Ongoing placement support</li><li>30-day replacement support at no extra placement fee</li></ul><Link className="btn btn-primary" href="/hire">Get a managed VA <ArrowRight size={16}/></Link></div><div className="card service-card"><h3>Direct hire</h3><p>Prefer to manage the VA yourself after the hire? We still handle the recruiting, screening, and matching -- your team takes it from there.</p><ul className="check-list"><li>Role review and candidate screening</li><li>Approved talent and matching support</li><li>Client-led interviews and final selection</li><li>One-time placement fee, no ongoing support included</li></ul></div></div><div className="pricing-note"><strong>VA compensation:</strong> ongoing hourly roles cannot be posted below USD 5/hour. <Link href="/pricing">See pricing and estimate monthly cost.</Link> · <Link href="/managed-vs-direct-hire">Compare Managed VA vs. Direct Hire.</Link></div></div></section>

    <section className="section"><div className="container"><div className="section-head"><h2>Common questions before you get matched.</h2></div><div className="faq-list">{faqs.map(([q,a])=><details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div><div style={{marginTop:20}}><Link className="btn" href="/faq">View all FAQs</Link></div></div></section>

    <section className="section section-white va-closing-strip"><div className="container row-between wrap"><div><h2>Looking for virtual assistant work?</h2><p className="muted">Browse reviewed jobs, build one structured profile, and apply after approval.</p></div><div className="row wrap"><Link className="btn" href="/jobs">Browse jobs</Link><Link className="btn btn-primary" href="/auth/join/va">Apply as a VA</Link></div></div></section>
  </main><SiteFooter/></>;
}
