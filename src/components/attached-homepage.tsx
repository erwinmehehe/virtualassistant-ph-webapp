import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Crown,
  FileText,
  Globe2,
  Headphones,
  MessageSquareText,
  PhoneCall,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Video,
  Zap,
} from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";
import { mergeUniqueStrings } from "@/lib/collections";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { MIN_HOURLY_RATE } from "@/lib/constants";

const BOOKING_PATH = "/book-client-call";

const GROUP_BLURBS: Record<string, string> = {
  "Admin & Operations": "Inbox, calendar, data, and recurring coordination that keeps the business moving.",
  Healthcare: "Patient scheduling, records, insurance follow-up, and dependable front-desk support.",
  "Marketing & Growth": "Content, campaigns, reporting, and the execution work between strategy reviews.",
  "Finance & Accounting": "Bookkeeping, invoicing, reconciliations, and month-end support kept current.",
  "Sales & CRM": "Prospect research, outreach, appointment setting, and CRM hygiene your team can trust.",
  Ecommerce: "Listings, orders, returns, supplier follow-up, and day-to-day storefront operations.",
  "Real Estate": "Listing coordination, transaction paperwork, lead follow-up, and calendar management.",
  "Customer & Front Desk": "Email, chat, and phone coverage with consistent service standards.",
  "Creative & Content": "Editing, design support, and production work that keeps publishing on schedule.",
  "Executive Support": "Calendar control, travel, briefing notes, and follow-through after meetings.",
};

const roleGroups = Array.from(
  SERVICE_PAGES.reduce((groups, page) => {
    const list = groups.get(page.group) || [];
    list.push(page);
    groups.set(page.group, list);
    return groups;
  }, new Map<string, typeof SERVICE_PAGES>()),
)
  .filter(([group]) => GROUP_BLURBS[group])
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 6);

const faqs = [
  ["What does vetted mean?", "A public Virtual Assistant profile only appears after the candidate completes the required profile, category skills test, video introduction, recruiter review, and final approval workflow."],
  ["Do I have to sort through every applicant?", "No. Our recruiting team can screen the role and build a focused shortlist so you spend your time on the candidates worth interviewing."],
  ["How much does a Virtual Assistant cost?", "Compensation varies by experience, specialty, tools, hours, and schedule. Ongoing hourly roles through our service cannot be budgeted below USD 5/hour. Our service fee is shown separately."],
  ["Can I request a specific Virtual Assistant?", "Yes. Open a public talent profile and request an introduction. The selected profile stays attached to your hiring request so our recruiting team has the right context."],
  ["What happens after I send a hiring request?", "Your request stays private. Our recruiting team reviews the role, screens for fit, and follows up with the strongest next step. You do not need to create an account to get started."],
] as const;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function AttachedHomepage({
  featured,
  openJobs,
  placementFee,
  managedMarkup,
}: {
  featured: any[];
  openJobs: any[];
  placementFee: number;
  managedMarkup: number;
}) {
  return <main id="main-content" className="att-home">
    <section className="att-hero">
      <div className="att-grid-pattern" aria-hidden="true" />
      <div className="att-orb att-orb-a" aria-hidden="true" />
      <div className="att-orb att-orb-b" aria-hidden="true" />
      <div className="container att-hero-grid">
        <div className="att-hero-copy">
          <div className="att-eyebrow"><span><ShieldCheck size={13}/> Vetted</span><strong>Virtual Assistant Philippines — for Australian, US &amp; UK teams</strong></div>
          <h1>Hire a Vetted Virtual Assistant <em>in the Philippines</em></h1>
          <p className="att-lede">We recruit, screen, and match experienced Filipino virtual assistants to your business — with ongoing placement support after they start, not just an introduction.</p>
          <p className="att-sub">A clearer way for Australian, US, and UK businesses to build a reliable Filipino remote team.</p>
          <div className="att-hero-actions">
            <Link href="/hire" className="att-btn att-btn-primary">Start your hiring request <ArrowRight size={18}/></Link>
            <Link href={BOOKING_PATH} className="att-btn att-btn-secondary"><span><PhoneCall size={14}/></span> Book a 15-min call</Link>
          </div>
          <p className="att-talk-first">Prefer to talk first? <Link href={BOOKING_PATH}>Book a 15-minute hiring call</Link></p>
          <div className="att-country-row"><div>{["AU","US","UK"].map((c)=><span key={c}>{c}</span>)}</div><p>Built for Australian, US &amp; UK teams · no account required to start</p></div>
          <div className="att-proof-row">
            <span><ClipboardCheck size={15}/> Skills tested</span><span><Video size={15}/> Video reviewed</span><span><ShieldCheck size={15}/> Recruiter approved</span>
          </div>
        </div>

        <div className="att-hero-product" aria-label="Private hiring brief and shortlist preview">
          <div className="att-product-shell">
            <div className="att-window-bar"><div><i/><i/><i/></div><strong>Hiring brief · private</strong><span>Live</span></div>
            <div className="att-product-body">
              <div className="att-brief-head"><div><small><FileText size={14}/> Role brief</small><h2>Executive Assistant · AU overlap</h2><p>40 hrs/week · Notion + Slack · $8–12/hr</p></div><span><strong>3</strong><small>matches</small></span></div>
              <div className="att-brief-tags"><span>Calendar</span><span>Inbox</span><span>Operations</span><span>Meeting follow-up</span></div>
              <div className="att-shortlist-head"><strong>Recruiter shortlist</strong><span><Sparkles size={13}/> Human reviewed</span></div>
              {[{label:"Customer Support lead",match:"98%",rate:"$6/hr",tone:"indigo"},{label:"Executive / admin VA",match:"94%",rate:"$6/hr",tone:"green"},{label:"Social media manager",match:"91%",rate:"$8/hr",tone:"gold"}].map((item,index)=><div className="att-shortlist-row" key={item.label}><span className={`att-avatar-dot ${item.tone}`}>{index+1}</span><div><strong>{item.label}</strong><small>Skills test ✓ · Video ✓ · Recruiter review ✓</small></div><span className="att-match-score">{item.match}</span><b>{item.rate}</b></div>)}
              <div className="att-product-cta"><ShieldCheck size={18}/><div><strong>You choose who to interview</strong><small>Compare profiles, rates, availability and recruiter notes before deciding.</small></div><ArrowRight size={16}/></div>
            </div>
          </div>
          <div className="att-float att-float-a"><Star size={14}/><div><strong>Human-reviewed</strong><small>not an open marketplace</small></div></div>
          <div className="att-float att-float-b"><Clock3 size={14}/><div><strong>Less sorting</strong><small>more interviewing</small></div></div>
        </div>
      </div>
    </section>

    <section className="att-proof-strip"><div className="container att-proof-grid">
      <div><strong>01</strong><h3>Skip the resume pile</h3><p>Start with screened candidates worth interviewing.</p></div>
      <div><strong>02</strong><h3>Skills + communication checked</h3><p>Practical screening backed by human recruiter review.</p></div>
      <div><strong>03</strong><h3>You choose who you hire</h3><p>Compare profiles, interview, and make the final call.</p></div>
      <div><strong>04</strong><h3>Support after placement</h3><p>Managed hiring stays involved after your VA starts.</p></div>
    </div></section>

    <section className="att-section att-soft"><div className="container"><div className="att-section-head att-centered"><span>Why this is different</span><h2>Recruiter-led screening without losing control of the hire.</h2><p>Share the work once. We narrow the field, show the evidence, and keep you in control of the final decision.</p></div><div className="att-feature-grid">
      <article><span><ClipboardCheck size={22}/></span><small>01</small><h3>Tell us what you need</h3><p>Responsibilities, hours, timezone, budget, and the tools your new VA will use.</p></article>
      <article><span><SearchCheck size={22}/></span><small>02</small><h3>We screen for fit</h3><p>Recruiters review experience, practical skills, communication, availability, and role fit.</p></article>
      <article><span><CalendarCheck2 size={22}/></span><small>03</small><h3>Interview the shortlist</h3><p>Spend your interview time on stronger matches instead of sorting a large applicant pool.</p></article>
      <article><span><Headphones size={22}/></span><small>04</small><h3>Hire with ongoing support</h3><p>You make the final decision, and managed placements continue with support after the start date.</p></article>
    </div></div></section>

    <section className="att-dark"><div className="att-grid-pattern-light"/><div className="container"><div className="att-section-head att-centered att-dark-head"><span>How it works</span><h2>Tell us what you need. <em>We’ll handle the rest.</em></h2><p>One hiring workflow connects your private role brief, recruiter screening, interviews, and placement support.</p></div><div className="att-dashboard-preview">
      <div className="att-dashboard-top"><div><i/><i/><i/></div><span>app.virtualassistant.com.ph</span><b>Client portal</b></div>
      <div className="att-dashboard-grid"><div><small>For founders &amp; teams</small><h3>Your hiring command center.</h3><ul><li><CheckCircle2 size={17}/> Private candidate details, messages and hiring stages</li><li><CheckCircle2 size={17}/> Video introductions plus recruiter scorecards</li><li><CheckCircle2 size={17}/> Structured onboarding workroom for new placements</li><li><CheckCircle2 size={17}/> Ongoing account management when you need it</li></ul><Link href="/hire" className="att-btn att-btn-light">Start a hiring request <ArrowRight size={16}/></Link></div><div className="att-mini-pipeline">{[["Customer Support VA","Certified · Video ✓ · Recruiter scorecard ✓","Interview"],["Admin Support VA","Certified · Video ✓ · Recruiter scorecard ✓","Review"],["Marketing VA","Skills matched · Availability confirmed","Shortlisted"]].map(([name,copy,status],i)=><div key={name}><span>{i+1}</span><div><strong>{name}</strong><small>{copy}</small></div><b>{status}</b></div>)}</div></div>
    </div></div></section>

    <section className="att-section att-white"><div className="container"><div className="att-section-head att-row-head"><div><span>Approved talent</span><h2>Meet experienced Filipino virtual assistants.</h2><p>Public profiles appear only after the required screening and approval steps are completed.</p></div><Link href="/find-talent">Browse all talent <ArrowRight size={16}/></Link></div>
      {featured.length ? <div className="att-talent-grid">{featured.map((va:any)=><article className="att-talent-card" key={va.user_id}><div className="att-talent-avatar"><PublicAvatar name={va.full_name} src={va.avatar_url}/></div><h3>{va.full_name} <BadgeCheck size={16}/></h3><p>{va.headline || va.primary_category || "Virtual Assistant"}</p><div className="att-chip-row">{mergeUniqueStrings(va.primary_category,va.categories).slice(0,2).map((x,index)=><span key={`${String(x)}-${index}`}>{x}</span>)}</div><div className="att-talent-meta"><span><BadgeCheck size={14}/> Approved · {va.years_experience}+ yrs</span><span><Clock3 size={14}/> {va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Flexible"}</span></div><div className="att-talent-footer">{va.hourly_rate ? <strong>${Number(va.hourly_rate).toFixed(0)}<small>/hr</small></strong>:<span/>}<Link href={`/va/${va.slug}`}>View profile <ArrowRight size={14}/></Link></div></article>)}</div>:<div className="att-empty">Approved public profiles will appear here as experienced talent becomes available.</div>}
    </div></section>

    <section className="att-section att-soft"><div className="container"><div className="att-section-head att-centered"><span>Specialists, not generic profiles</span><h2>Hire around the work your business actually needs done.</h2><p>Explore role-specific Virtual Assistant services and see what each specialty can own for your team.</p></div><div className="att-role-grid">{roleGroups.map(([group,pages])=><article key={group}><div><span><Globe2 size={18}/></span><h3>{group}</h3></div><p>{GROUP_BLURBS[group]}</p>{pages.slice(0,4).map(page=><Link key={page.slug} href={`/service/${page.slug}`}>{page.name}<ArrowRight size={13}/></Link>)}</article>)}</div><div className="att-center-action"><Link href="/services" className="att-btn att-btn-secondary">View all Virtual Assistant services <ArrowRight size={16}/></Link></div></div></section>

    <section className="att-section att-white"><div className="container"><div className="att-section-head att-row-head"><div><span>Reviewed client opportunities</span><h2>Open Virtual Assistant jobs</h2><p>Remote roles with published pay and a reviewed client brief behind every listing.</p></div><Link href="/jobs">View job board <ArrowRight size={15}/></Link></div>{openJobs.length ? <div className="att-jobs-grid">{openJobs.map((job:any)=><Link href="/jobs" className="att-job-card" key={job.id}><div><span>{mergeUniqueStrings(job.categories)[0] || "Virtual Assistant"}</span>{(job.min_hourly_rate||job.max_hourly_rate)?<strong>{job.min_hourly_rate?`$${job.min_hourly_rate}`:""}{job.max_hourly_rate?`–$${job.max_hourly_rate}`:""}<small>/hr</small></strong>:null}</div><h3>{job.title}</h3><p>{job.company_name || "Verified client"}{job.hours_per_week?` · ${job.hours_per_week} hrs/week`:""}</p></Link>)}</div>:<div className="att-empty">New roles are reviewed before they are published. Check the job board for current openings.</div>}</div></section>

    <section className="att-section att-soft"><div className="container"><div className="att-section-head att-centered"><span>Transparent pricing</span><h2>Choose the level of hiring support you need.</h2><p>Virtual Assistant compensation and the service fee are shown separately before you make a hiring commitment.</p></div><div className="att-pricing-grid"><article className="att-price-card att-price-featured"><span className="att-price-badge">Recommended</span><Crown size={22}/><h3>Managed Virtual Assistant service</h3><p>Recruiting and vetting plus a structured operating layer after your VA starts.</p><strong>{managedMarkup > 0 ? `${managedMarkup}%` : "Custom quote"}</strong><ul><li><Check size={15}/> Recruiting, screening, and matching</li><li><Check size={15}/> Structured onboarding workroom</li><li><Check size={15}/> 30-day replacement support</li></ul><Link href="/hire">Get a managed VA <ArrowRight size={14}/></Link></article><article className="att-price-card"><Zap size={22}/><h3>Direct hire</h3><p>We handle recruiting, screening, and matching. Your team manages the VA after the hire.</p><strong>{placementFee > 0 ? money(placementFee) : "Custom quote"}</strong><ul><li><Check size={15}/> Role review and candidate screening</li><li><Check size={15}/> Client-led interviews and final selection</li><li><Check size={15}/> One-time placement fee</li></ul><Link href="/hire">Start direct hire <ArrowRight size={14}/></Link></article></div><p className="att-pricing-note">Ongoing hourly roles cannot be budgeted below USD {MIN_HOURLY_RATE}/hour.</p></div></section>

    <section className="att-section att-white"><div className="container att-faq-grid"><div><span className="att-kicker">Questions, answered</span><h2>What to know before you hire.</h2><p>Clear expectations make better placements. These are the questions clients ask most often before sending a role brief.</p><Link href="/faq">View all FAQs <ArrowRight size={14}/></Link></div><div>{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>

    <section className="att-final"><div className="att-grid-pattern-light"/><div className="container"><span><Star size={14}/> Ready when you are</span><h2>Build your shortlist around the role, not the resume pile.</h2><p>Send a private hiring brief or browse approved Filipino Virtual Assistants first. You stay in control of the final hiring decision.</p><div><Link href="/hire" className="att-btn att-btn-light">Start your hiring request <ArrowRight size={16}/></Link><Link href="/find-talent" className="att-btn att-btn-dark-outline">Browse approved talent</Link></div></div></section>
  </main>;
}
