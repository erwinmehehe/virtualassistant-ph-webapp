import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  FileText,
  HeartHandshake,
  PiggyBank,
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
import { MIN_HOURLY_RATE } from "@/lib/constants";

const BOOKING_PATH = "/book-client-call";

const faqs = [
  ["What does vetted mean?", "A public Virtual Assistant profile only appears after the candidate completes the required profile, category skills test, video introduction, recruiter review, and final approval workflow."],
  ["Do I have to sort through every applicant?", "No. Our recruiting team can screen the role and build a focused shortlist so you spend your time on the candidates worth interviewing."],
  ["How much does a Virtual Assistant cost?", "Virtual Assistant compensation varies by experience, specialty, tools, hours, and schedule. Ongoing hourly roles through our service cannot be budgeted below USD 5/hour. Our service fee is shown separately."],
  ["Can I request a specific Virtual Assistant?", "Yes. Open a public talent profile and request an introduction. The selected profile stays attached to your hiring request so our recruiting team has the right context."],
] as const;

const industryCards = [
  ["Entrepreneurs and startups", "Keep building while the daily operations run without you", "/industries/startups"],
  ["Coaches and consultants", "Admin, scheduling and client support handled", "/industries/professional-services-growth"],
  ["Ecommerce brands", "Listings, orders, customers and store management", "/services"],
  ["Real estate", "Listings, CRM, appointments and lead follow up", "/industries/real-estate-agents"],
  ["Digital agencies", "Research, reporting, content and client support", "/industries/professional-services-growth"],
  ["Healthcare providers", "Appointment booking, records and patient communication", "/industries/healthcare-dental"],
  ["Trades and construction", "Quotes, scheduling, invoicing and admin support", "/industries/construction-companies"],
  ["Accountants and CPAs", "Bookkeeping support, reconciliations and client chasing", "/services"],
  ["Legal and law firms", "Case files, intake, scheduling and document preparation", "/industries/law-firms"],
] as const;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function AttachedHomepage({ featured, openJobs, placementFee, managedMarkup }: { featured: any[]; openJobs: any[]; placementFee: number; managedMarkup: number }) {
  const heroTalent = featured.slice(0, 3);

  return <main id="main-content" className="att-home">
    <section className="att-hero">
      <div className="att-grid-pattern" aria-hidden="true" />
      <div className="att-orb att-orb-a" aria-hidden="true" />
      <div className="att-orb att-orb-b" aria-hidden="true" />
      <div className="container att-hero-grid">
        <div className="att-hero-copy">
          <div className="att-market-pill"><span className="att-flags"><i>🇦🇺</i><i>🇺🇸</i><i>🇬🇧</i></span><strong>Built for Australian, United States &amp; UK businesses</strong></div>
          <h1>Hire a Filipino VA <em>without the resume pile.</em></h1>
          <p className="att-lede">We recruit, vet, and match experienced Filipino virtual assistants to your business, so you spend your time interviewing stronger candidates instead of screening hundreds of applications.</p>
          <div className="att-hero-actions"><Link href="/hire" className="att-btn att-btn-primary">Hire a Virtual Assistant <ArrowRight size={18}/></Link></div>
          <p className="att-talk-first">Prefer to talk first? <Link href={BOOKING_PATH}>Book a 15-minute hiring call</Link></p>
          <div className="att-proof-row"><span><CheckCircle2 size={15}/> Recruiter screened</span><span><CheckCircle2 size={15}/> Skills tested</span><span><CheckCircle2 size={15}/> You choose who to hire</span></div>
        </div>

        <div className="att-candidate-stage" aria-label="Vetted virtual assistant profiles">
          <div className="att-save-card"><small>Build a lower-cost remote team</small><strong>Philippines-based talent</strong><span>Vetted before you interview</span></div>
          <div className="att-candidate-stack">
            {heroTalent.length ? heroTalent.map((va: any, index: number) => <article className={`att-candidate-card att-candidate-${index + 1}`} key={va.user_id}>
              <div className="att-candidate-photo"><PublicAvatar name={va.full_name} src={va.avatar_url}/></div>
              <div className="att-candidate-info"><span className="att-status">Available</span><h3>{va.full_name}</h3><p>{va.headline || va.primary_category || "Virtual Assistant"}</p><div className="att-stars">★★★★★</div><div className="att-candidate-chips">{mergeUniqueStrings(va.primary_category, va.categories, va.skills).slice(0, 2).map((item, i) => <span key={`${String(item)}-${i}`}>{item}</span>)}</div></div>
            </article>) : ["Executive Assistant", "Customer Support VA", "Marketing Virtual Assistant"].map((role, index) => <article className={`att-candidate-card att-candidate-${index + 1}`} key={role}><div className="att-placeholder-photo"><span>{index + 1}</span></div><div className="att-candidate-info"><span className="att-status">Approved</span><h3>Virtual Assistant</h3><p>{role}</p><div className="att-stars">★★★★★</div><div className="att-candidate-chips"><span>Vetted</span><span>Recruiter reviewed</span></div></div></article>)}
          </div>
          <div className="att-review-card"><span className="att-review-stars">★★★★★</span><strong>Human-reviewed talent</strong><small>Skills · video · recruiter scorecard</small></div>
          <div className="att-flower" aria-hidden="true">✦</div>
        </div>
      </div>
      <div className="att-hero-wave" aria-hidden="true"/>
      <a className="att-scroll-cue" href="#why-us" aria-label="Scroll to why us">↓</a>
    </section>

    <section className="shot-section shot-why" id="why-us">
      <div className="container">
        <div className="shot-heading">
          <span className="shot-pill shot-pill-purple"><Sparkles size={13}/> Why VirtualAssistant.com.ph</span>
          <h2>A recruiting service built <span className="shot-gradient">around<br/>the work you need done.</span></h2>
          <p>You do not need to learn a marketplace or manage a complicated hiring app. Tell us the role, then our team helps recruit, screen, shortlist, and support the placement.</p>
        </div>
        <div className="shot-benefit-grid">
          <article><span className="shot-icon shot-purple"><SearchCheck size={22}/></span><h3>Skip the resume pile</h3><p>Start with screened candidates worth interviewing, a focused shortlist instead of a pile of unqualified applications.</p></article>
          <article><span className="shot-icon shot-green"><BadgeCheck size={22}/></span><h3>Skills + communication checked</h3><p>Practical screening plus human recruiter review: experience, skills, communication, availability, and role fit.</p></article>
          <article><span className="shot-icon shot-orange"><UsersRound size={22}/></span><h3>You choose who you hire</h3><p>Compare profiles, interview, and make the final call. Your final decision, 100%.</p></article>
          <article><span className="shot-icon shot-pink"><HeartHandshake size={22}/></span><h3>Support after placement</h3><p>Managed hiring stays involved after your Virtual Assistant starts, not just an introduction.</p></article>
          <article><span className="shot-icon shot-blue"><ShieldCheck size={22}/></span><h3>Vetting you can verify</h3><p>Role profile, category skills test, video communication review, recruiter scorecard, and final approval before anyone goes public.</p></article>
          <article><span className="shot-icon shot-teal"><PiggyBank size={22}/></span><h3>Transparent by default</h3><p>Virtual Assistant compensation and our service fee are shown separately before anything is agreed. Fair floor: USD {MIN_HOURLY_RATE}/hour.</p></article>
        </div>
      </div>
    </section>

    <section className="shot-how" id="how-it-works">
      <div className="shot-dark-grid" aria-hidden="true"/>
      <div className="container">
        <div className="shot-heading shot-heading-dark">
          <span className="shot-pill shot-pill-dark"><CheckCircle2 size={13}/> How it works</span>
          <h2>Tell us what you need.<br/>We&apos;ll <span>handle the rest.</span></h2>
          <p>Share the responsibilities, hours, timezone, budget, and the systems your new Virtual Assistant will use. A short private brief is enough to start.</p>
        </div>
        <div className="shot-step-grid">
          <article><b>01</b><span className="shot-step-icon"><FileText size={22}/></span><h3>Send the workload</h3><p>Tell us the tasks, hours, timezone, tools, and budget. A short private brief is enough to start.</p><small><CheckCircle2 size={13}/> No account required</small></article>
          <article><b>02</b><span className="shot-step-icon"><SearchCheck size={22}/></span><h3>We recruit and screen</h3><p>We look for evidence that matches the actual role, not just a job title.</p><small><CheckCircle2 size={13}/> Screened before you interview</small></article>
          <article><b>03</b><span className="shot-step-icon"><Video size={22}/></span><h3>Interview the strongest fits</h3><p>You decide who to hire after reviewing the people we recommend.</p><small><CheckCircle2 size={13}/> 100% your decision</small></article>
          <article><b>04</b><span className="shot-step-icon"><HeartHandshake size={22}/></span><h3>Hire with ongoing support</h3><p>Managed hiring stays involved after your Virtual Assistant starts.</p><small><CheckCircle2 size={13}/> 30-day replacement support</small></article>
        </div>
      </div>
    </section>

    <section className="shot-section shot-compare">
      <div className="container">
        <div className="shot-heading">
          <span className="shot-pill shot-pill-green"><HeartHandshake size={13}/> The honest comparison</span>
          <h2>Hire a Filipino virtual<br/>assistant <span className="shot-gradient">without sorting<br/>through 200 applicants.</span></h2>
          <p>Most ways to hire a Filipino virtual assistant put the screening on you. This one does not, but you still choose the person.</p>
        </div>
        <div className="shot-compare-shell">
          <article><h3>Job marketplaces</h3><p>Post a role and get a hundred applications, most of them irrelevant. Profiles are self-reported, so screening, testing, and reference-checking are your problem. Cheapest upfront, most expensive in your time.</p></article>
          <article><h3>Traditional agencies</h3><p>Someone is assigned to you. You rarely meet alternatives, rates are bundled into one monthly figure, and swapping people means restarting the conversation.</p></article>
          <article className="shot-compare-featured"><h3>VirtualAssistant.com.ph ✓</h3><p>Every Filipino virtual assistant here has passed a skills test in their category, recorded a video introduction, and cleared a recruiter review before you see them. You interview and decide. Virtual Assistant compensation and our service fee are shown separately before you make a hiring commitment.</p></article>
        </div>
      </div>
    </section>

    <section className="shot-section shot-split">
      <div className="container shot-split-grid">
        <article className="shot-split-card shot-client-card">
          <span className="shot-split-badge shot-client-badge"><Building2 size={13}/> For clients</span>
          <h2>Describe the work. We shortlist against it.</h2>
          <p>Give us the specialty, the hours, the overlap you need and your budget. We recruit and screen against that brief, then send you candidates worth interviewing. No account required, and nothing is published.</p>
          <ul><li><CheckCircle2 size={17}/> Every candidate has passed a skills test, a video introduction and a recruiter review</li><li><CheckCircle2 size={17}/> Virtual Assistant compensation and our service fee are shown separately before anything is agreed</li><li><CheckCircle2 size={17}/> Prefer to browse first? See approved Virtual Assistants</li></ul>
          <Link href="/hire">Send your brief <ArrowRight size={16}/></Link>
        </article>
        <article className="shot-split-card shot-va-card">
          <span className="shot-split-badge shot-va-badge"><Sparkles size={13}/> For Filipino VAs</span>
          <h2>Looking for virtual assistant work?</h2>
          <p>Browse reviewed jobs, build one structured profile, and apply after approval. The same approved profile works for every role.</p>
          <ul><li><CheckCircle2 size={17}/> Reviewed jobs with published pay, clear scope, and a reviewed client brief</li><li><CheckCircle2 size={17}/> Category skills test plus video review that proves your value</li><li><CheckCircle2 size={17}/> USD {MIN_HOURLY_RATE}/hour floor on ongoing roles, fair pay enforced</li></ul>
          <Link href="/auth/join/va">Apply as a VA <ArrowRight size={16}/></Link>
        </article>
      </div>
    </section>

    <section className="shot-section shot-industries">
      <div className="container">
        <div className="shot-heading">
          <span className="shot-pill shot-pill-purple"><Building2 size={13}/> Industries</span>
          <h2>Virtual assistants<br/>for <span className="shot-gradient">every industry.</span></h2>
          <p>Tell us your sector. We recruit against the workflows that matter in it, the tools involved, and what to keep in house.</p>
        </div>
        <div className="shot-industry-grid">
          {industryCards.map(([title, copy, href]) => <Link href={href} key={title}><div><h3>{title}</h3><p>{copy}</p></div><span><ArrowUpRight size={19}/></span></Link>)}
        </div>
        <div className="shot-center-link"><Link href="/industries">View all industries <ArrowRight size={15}/></Link></div>
      </div>
    </section>

    <section className="att-section att-white"><div className="container"><div className="att-section-head att-row-head"><div><span>Approved talent</span><h2>Meet experienced Filipino virtual assistants.</h2><p>Public profiles appear only after the required screening and approval steps are completed.</p></div><Link href="/find-talent">Browse all talent <ArrowRight size={16}/></Link></div>{featured.length ? <div className="att-talent-grid">{featured.map((va: any) => <article className="att-talent-card" key={va.user_id}><div className="att-talent-avatar"><PublicAvatar name={va.full_name} src={va.avatar_url}/></div><h3>{va.full_name} <BadgeCheck size={16}/></h3><p>{va.headline || va.primary_category || "Virtual Assistant"}</p><div className="att-chip-row">{mergeUniqueStrings(va.primary_category, va.categories).slice(0, 2).map((x, index) => <span key={`${String(x)}-${index}`}>{x}</span>)}</div><div className="att-talent-meta"><span><BadgeCheck size={14}/> Approved · {va.years_experience}+ yrs</span><span><Clock3 size={14}/> {va.weekly_hours ? `${va.weekly_hours} hrs/week` : "Flexible"}</span></div><div className="att-talent-footer">{va.hourly_rate ? <strong>${Number(va.hourly_rate).toFixed(0)}<small>/hr</small></strong> : <span/>}<Link href={`/va/${va.slug}`}>View profile <ArrowRight size={14}/></Link></div></article>)}</div> : <div className="att-empty">Approved public profiles will appear here as experienced talent becomes available.</div>}</div></section>

    <section className="att-section att-white"><div className="container"><div className="att-section-head att-row-head"><div><span>Reviewed client opportunities</span><h2>Open Virtual Assistant jobs</h2><p>Remote roles with published pay and a reviewed client brief behind every listing.</p></div><Link href="/jobs">View job board <ArrowRight size={15}/></Link></div>{openJobs.length ? <div className="att-jobs-grid">{openJobs.map((job: any) => <Link href="/jobs" className="att-job-card" key={job.id}><div><span>{mergeUniqueStrings(job.categories)[0] || "Virtual Assistant"}</span>{(job.min_hourly_rate || job.max_hourly_rate) ? <strong>{job.min_hourly_rate ? `$${job.min_hourly_rate}` : ""}{job.max_hourly_rate ? `–$${job.max_hourly_rate}` : ""}<small>/hr</small></strong> : null}</div><h3>{job.title}</h3><p>{job.company_name || "Verified client"}{job.hours_per_week ? ` · ${job.hours_per_week} hrs/week` : ""}</p></Link>)}</div> : <div className="att-empty">New roles are reviewed before they are published. Check the job board for current openings.</div>}</div></section>

    <section className="att-section att-soft"><div className="container"><div className="att-section-head att-centered"><span>Transparent pricing</span><h2>Choose the level of hiring support you need.</h2><p>Virtual Assistant compensation and the service fee are shown separately before you make a hiring commitment.</p></div><div className="att-pricing-grid"><article className="att-price-card att-price-featured"><span className="att-price-badge">Recommended</span><Crown size={22}/><h3>Managed Virtual Assistant service</h3><p>Recruiting and vetting plus a structured operating layer after your VA starts.</p><strong>{managedMarkup > 0 ? `${managedMarkup}%` : "Custom quote"}</strong><ul><li><Check size={15}/> Recruiting, screening, and matching</li><li><Check size={15}/> Structured onboarding workroom</li><li><Check size={15}/> Replacement support</li></ul><Link href="/hire">Get a managed VA <ArrowRight size={14}/></Link></article><article className="att-price-card"><Zap size={22}/><h3>Direct hire</h3><p>We handle recruiting, screening, and matching. Your team manages the VA after the hire.</p><strong>{placementFee > 0 ? money(placementFee) : "Custom quote"}</strong><ul><li><Check size={15}/> Role review and candidate screening</li><li><Check size={15}/> Client-led interviews and final selection</li><li><Check size={15}/> One-time placement fee</li></ul><Link href="/hire">Start direct hire <ArrowRight size={14}/></Link></article></div><p className="att-pricing-note">Ongoing hourly roles cannot be budgeted below USD {MIN_HOURLY_RATE}/hour.</p></div></section>

    <section className="att-section att-white"><div className="container att-faq-grid"><div><span className="att-kicker">Questions, answered</span><h2>What to know before you hire.</h2><p>Clear expectations make better placements.</p><Link href="/faq">View all FAQs <ArrowRight size={14}/></Link></div><div>{faqs.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>

    <section className="att-final"><div className="container"><span><Star size={14}/> Ready when you are</span><h2>Build your shortlist around the role, not the resume pile.</h2><p>Send a private hiring brief or browse approved Filipino Virtual Assistants first.</p><div><Link href="/hire" className="att-btn att-btn-light">Start your hiring request <ArrowRight size={16}/></Link><Link href="/find-talent" className="att-btn att-btn-dark-outline">Browse approved talent</Link></div></div></section>
  </main>;
}
