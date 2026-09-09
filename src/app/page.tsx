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
import { RoleBriefForm } from "@/components/role-brief-form";

export const metadata: Metadata = {
  title: { absolute: "Hire Virtual Assistants | Virtual Assistant Philippines" },
  description: "Virtual Assistant Philippines — hire vetted, screened Filipino Virtual Assistants matched to your role. Browse approved talent or request a private shortlist today.",
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
  ["What does “vetted” mean?", "A public Virtual Assistant profile only appears after the candidate completes the required profile, category skills test, video introduction, recruiter review, and final approval workflow."],
  ["Do I have to sort through every applicant?", "No. You can browse approved talent, receive matched candidates, and manage a focused shortlist in your client workspace."],
  ["How much does a Virtual Assistant cost?", "Virtual Assistant compensation varies by experience, specialty, tools, hours, and schedule. Ongoing hourly roles on the platform cannot be posted below USD 5/hour. VirtualAssistant.com.ph service fees are separate and are shown before you publish a role."],
  ["Can I request a specific Virtual Assistant?", "Yes. Open a public talent profile and request an introduction. The selected profile stays attached to your signup path so you do not have to find the person again."],
  ["What happens after I send a match request?", "Your request stays private. It creates a draft the team can review with you before anything is published, then you can claim the draft in a client workspace and manage candidates there."]
] as const;

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
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
    <section className="hero home-hero"><div className="container hero-grid hero-grid-form"><div className="home-hero-copy"><div className="home-hero-kicker">Virtual Assistant Philippines</div><h1>Hire a Vetted Virtual Assistant in the Philippines</h1><p className="home-hero-lede">We recruit, screen, and match experienced Filipino virtual assistants to your business — with ongoing placement support after they start, not just an introduction.</p><p className="hero-positioning">A clearer way for Australian, US, and UK businesses to build a reliable Filipino remote team.</p><div className="row wrap hero-actions"><Link className="btn btn-primary btn-lg" href="/hire">Get matched <ArrowRight size={17}/></Link><Link className="btn btn-lg" href="/find-talent">Browse approved Virtual Assistants</Link></div><div className="home-hero-proof"><span><CheckCircle2 size={15}/> Skills tested</span><span><CheckCircle2 size={15}/> Video reviewed</span><span><CheckCircle2 size={15}/> Recruiter approved</span></div></div>
      <RoleBriefForm sourcePath="/" error={query.error} sent={Boolean(query.sent)} heading="Get matched" subheading="About 60 seconds. Required fields are marked." /></div></section>

    <section className="home-trust-strip" aria-label="Why businesses hire through VirtualAssistant.com.ph"><div className="container home-trust-grid"><div className="home-trust-item"><strong>Skip the resume pile</strong><span>Start with screened candidates worth interviewing</span></div><div className="home-trust-item"><strong>Skills + communication checked</strong><span>Practical screening plus human recruiter review</span></div><div className="home-trust-item"><strong>You choose who you hire</strong><span>Compare profiles, interview, and make the final call</span></div><div className="home-trust-item"><strong>Support after placement</strong><span>Managed hiring stays involved after your Virtual Assistant starts</span></div></div></section>

    <section className="section section-white"><div className="container"><div className="section-head row-between wrap"><div><h2>Meet experienced, approved talent.</h2><p>Public discovery is limited to approved, available Virtual Assistants with at least 2 years of professional experience.</p></div><Link className="btn" href="/find-talent">Browse all Virtual Assistants <ArrowRight size={16}/></Link></div>{featuredWithPhotos.length ? <div className="grid-3">{featuredWithPhotos.map((va:any)=><article className="card talent-card homepage-talent-card" key={va.user_id}><div className="row"><PublicAvatar name={va.full_name} src={va.avatar_url}/><div><h3>{va.full_name}</h3><div className="muted small">{va.headline || va.primary_category || "Virtual Assistant"}</div></div></div><div className="pill-list">{mergeUniqueStrings(va.primary_category, va.categories).slice(0,2).map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div><div className="talent-facts"><span>{va.years_experience}+ yrs experience</span><span>{va.weekly_hours ? `${va.weekly_hours} hrs/week available` : "Flexible availability"}</span>{va.hourly_rate ? <span>${Number(va.hourly_rate).toFixed(0)}/hr preferred</span> : null}</div><Link className="btn btn-primary" href={`/va/${va.slug}`}>View profile</Link></article>)}</div> : <div className="card empty">Approved public profiles will appear here as experienced talent becomes available.</div>}</div></section>

    <section className="section product-paths-section"><div className="container"><div className="section-head"><h2>A recruiting service built around the work you need done.</h2><p>You do not need to learn a marketplace or manage a complicated hiring app. Tell us the role, then our team helps recruit, screen, shortlist, and support the placement.</p></div><div className="grid-2 product-path-grid"><div className="card product-path-card product-path-card-primary"><div className="product-path-icon"><WandSparkles size={20}/></div><h3>Tell us what you need</h3><p>Share the responsibilities, hours, timezone, budget, and the systems your new Virtual Assistant will use. A short private brief is enough to start.</p><div className="mini-step-row"><span>1 Brief</span><span>2 Recruit</span><span>3 Interview</span><span>4 Hire</span></div><Link className="btn btn-primary" href="/hire">Start your hiring request</Link></div><div className="card product-path-card product-path-card-secondary"><div className="product-path-icon"><ShieldCheck size={20}/></div><h3>We do the screening before you interview</h3><p>Our recruiting team checks relevant experience, practical skills, communication, availability, and role fit. You receive a focused shortlist instead of a pile of unqualified applications.</p><div className="mini-strength"><div className="row-between"><strong>Your final decision</strong><span>100%</span></div><div className="progress"><span style={{width:"100%"}}/></div><small>You interview the strongest matches and choose who joins your team.</small></div><Link className="btn" href="/how-vetting-works">See how screening works</Link></div></div></div></section>


    <section className="section" id="how-it-works"><div className="container"><div className="section-head"><h2>From workload to shortlist in three steps.</h2><p>Start with a private match request or a specific Virtual Assistant profile. Create an account only when you are ready to manage the hiring process.</p></div><div className="process-grid">{[["01","Describe the work","Share the specialty, hours, timezone, budget, and recurring work this person should own."],["02","Compare focused candidates","Review approved profiles, staff-ranked matches, applications, or invites, then move the strongest fits into interviews."],["03","Confirm the hire","Agree the final rate, start date, schedule, and responsibilities before onboarding begins."]].map(([n,title,copy])=><div className="process-step" key={n}><div className="process-number">{n}</div><h3>{title}</h3><p className="muted">{copy}</p></div>)}</div></div></section>

    <section className="section section-white" id="get-matched"><div className="container">
      <div className="home-lead-grid">
        <div className="home-lead-copy">
          <div className="kicker">Tell us the role</div>
          <h2>Describe the work. We shortlist against it.</h2>
          <p>Give us the specialty, the hours, the overlap you need and your budget. We recruit and screen against that brief, then send you candidates worth interviewing. No account required, and nothing is published.</p>
          <ul className="home-lead-points">
            <li>Every candidate has passed a skills test, a video introduction and a recruiter review</li>
            <li>Virtual Assistant compensation and our service fee are shown separately before anything is agreed</li>
            <li>Prefer to browse first? <Link className="text-link" href="/find-talent">See approved Virtual Assistants</Link></li>
          </ul>
          <div className="row wrap"><Link className="btn btn-primary" href="/hire">Send your brief <ArrowRight size={16}/></Link></div>
        </div>
        <div className="hero-panel proof-panel"><h2>What vetting covers</h2>{[[ClipboardCheck,"Role-specific profile","Experience, skills, tools, and availability"],[ShieldCheck,"Category skills test","Practical screening for the Virtual Assistant’s primary specialty"],[MessageSquareText,"Communication check","Short video plus human review"],[UsersRound,"Recruiter scorecard","Skills, judgment, reliability, and client readiness"],[CheckCircle2,"Final approval","Only approved, available Virtual Assistants can appear publicly"]].map(([Icon,title,copy]:any)=><div className="proof-row" key={title}><span className="proof-icon"><Icon size={18}/></span><span><strong>{title}</strong><small>{copy}</small></span></div>)}</div>
      </div>
    </div></section>

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
          <p>Every Filipino virtual assistant here has passed a skills test in their category, recorded a video introduction, and cleared a recruiter review before you see them. You interview and decide. Virtual Assistant compensation and our service fee are shown separately, before you publish the role.</p>
        </article>
      </div>
      <div className="row wrap hiring-compare-actions">
        <Link className="btn btn-primary" href="/find-talent">Browse Virtual Assistants <ArrowRight size={16}/></Link>
        <Link className="btn" href="/hire">Start Hiring</Link>
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
          <p>General administrative, inbox and data work sits at roughly $5–8 an hour. Experienced specialists — executive assistants, customer support leads, ecommerce operations, bookkeepers — run about $8–12. Senior or heavily tool-specific roles go above that. Ongoing hourly roles cannot be posted below $5 an hour through our service, and Virtual Assistant compensation is always shown separately from our service fee, so you can see exactly what reaches the person doing the work.</p>

          <h3>How we screen before you meet anyone</h3>
          <p>Every virtual assistant listed here has completed a skills test in their category, recorded a video introduction, passed a recruiter review, and been approved before their profile becomes visible. That is four pieces of evidence gathered before you spend a minute interviewing. You still run the interview and you still make the decision — but you start from a shortlist that has already been filtered by someone whose job is filtering.</p>

          <h3>Full-time, part-time, or project support</h3>
          <p>Most virtual assistant roles in the Philippines are hired full-time at 40 hours a week, and that is usually the right call when the work is genuinely daily — an inbox, a support queue, a storefront. Part-time at 20 hours suits bookkeeping, social media, and anything that runs in defined bursts. Below about 15 hours a week you are competing for someone's attention against their other clients, and reliability drops accordingly. If the work is genuinely small, it is often better to define it tightly and pay for a short, well-scoped engagement than to stretch a few hours across five days.</p>

          <h3>Working hours, overlap, and how communication really works</h3>
          <p>The most common mistake is assuming you need someone online whenever you are. You rarely do. What you need is an agreed overlap window — commonly four hours — where questions get answered in real time, and clear rules for everything outside it. A well-run remote role has a daily written handover, a place where status lives that is not a chat thread, and an explicit list of what the Virtual Assistant can decide alone versus what waits for you.</p>
          <p>Filipino professionals are widely used to night-shift schedules for US clients, and many prefer them. That said, a permanent overnight shift carries a real cost in retention. If your work genuinely allows it, a partial overlap that lets someone keep a normal life is the cheaper decision over two years.</p>

          <h3>What separates a good hire from a bad one</h3>
          <p>Not the résumé. The strongest signal is whether someone can describe a real piece of work end to end: where the request came from, what they did with it, what they did when it went wrong, and how they knew it was finished. Ask for a specific example rather than a rating out of ten. Ask what they escalated recently and why. Someone who has genuinely owned a process will answer in concrete detail; someone who has only assisted will answer in generalities.</p>
          <p>Tool familiarity is worth less than people expect. Knowing the name of your CRM is not the same as knowing your pipeline stages. Screen for judgment and communication first — those transfer. Tools can be taught in a fortnight.</p>

          <h3>How hiring works here</h3>
          <p>You start with a private hiring brief describing the work, schedule, timezone overlap, and budget. Our recruiting team uses that brief to source, screen, and shortlist people who fit the role. We then help you review the strongest candidates and move the right people into interviews without asking you to manage a marketplace.</p>
          <p>From there you interview, choose, and agree terms. The Client Portal is available for private candidate details, messages, hiring stages, onboarding, and ongoing account management when you need it. If the placement does not work out in the first 30 days, replacement is covered without a second placement fee.</p>

          <h3>Getting the first 30 days right</h3>
          <p>Start narrower than feels necessary. Two or three recurring tasks, real examples of finished work, and access only to the systems those tasks need. Keep a short daily check-in while the process is new, then step it down to weekly once the basics are consistent. Ask your Virtual Assistant to write down every recurring question and turn the repeat answers into a checklist — after a month, that document is worth more than any onboarding plan you could have written in advance, because it was built from the questions that actually came up.</p>
          <p>By the end of the first month you should be reviewing the role through outputs rather than activity: what was completed, what is blocked, what is waiting on a decision from you. If you still need to watch how someone spends their hours, the problem is usually the scope, not the person.</p>
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
            <Link className="btn btn-primary" href="/find-talent">Browse vetted Virtual Assistants <ArrowRight size={15}/></Link>
            <Link className="btn" href="/pricing">See pricing</Link>
          </div>
        </aside>
      </div>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head"><h2>What a full time hire actually costs, side by side.</h2><p>An illustrative example for a 40 hour a week role, showing the overhead that never appears on a local salary line.</p></div>
      <div className="cost-compare-wrap">
        <table className="cost-compare-table">
          <thead><tr><th>Cost item</th><th>Filipino virtual assistant</th><th>Local full time hire</th></tr></thead>
          <tbody>
            <tr><td>Hourly rate</td><td>Around $9</td><td>$25 to $35</td></tr>
            <tr><td>Annual cost at 40 hours</td><td>Around $16,800</td><td>$52,000 to $72,000</td></tr>
            <tr><td>Benefits and superannuation</td><td>Not required</td><td>Required</td></tr>
            <tr><td>Office space and equipment</td><td>Not required</td><td>Required</td></tr>
            <tr><td>Recruitment cost</td><td>Included</td><td>Agency fee or your time</td></tr>
            <tr><td>Time to start</td><td>Days</td><td>Weeks to months</td></tr>
            <tr><td>Flexibility</td><td>Part time or full time</td><td>Fixed salary commitment</td></tr>
          </tbody>
        </table>
      </div>
      <p className="small muted cost-compare-note">Illustrative only. Actual virtual assistant rates run $5 to $20 an hour depending on scope and experience, and local salaries vary by market. Compare the work you need before comparing hourly numbers. <Link className="text-link" href="/tools/virtual-assistant-cost-calculator">Estimate your own numbers</Link></p>

      <div className="hiring-option-grid">
        <article className="hiring-option-card"><h3>Local full time staff</h3><p>Highest total cost once salary, benefits, office and recruitment are counted. Slowest to start, hardest to scale down.</p></article>
        <article className="hiring-option-card best"><span className="badge badge-success">Best value for most</span><h3>Filipino virtual assistant</h3><p>One vetted person, part time or full time, with no benefits, office or recruitment overhead. Live in days rather than months.</p></article>
        <article className="hiring-option-card"><h3>Multiple freelancers</h3><p>Cheapest per task and the least predictable. Fragmented communication, no guaranteed availability, and onboarding repeated for every provider.</p></article>
      </div>
    </div></section>

    <section className="section section-alt"><div className="container">
      <div className="section-head"><h2>Virtual assistants for every industry.</h2><p>Each page covers the workflows that matter in that sector, the tools involved, and what to keep in house.</p></div>
      <div className="industry-segment-grid">
        {[["entrepreneurs","Entrepreneurs and startups","Keep building while the daily operations run without you"],
          ["coaches","Coaches and consultants","Admin, scheduling and client support handled"],
          ["ecommerce-stores","Ecommerce brands","Listings, orders, customers and store management"],
          ["real-estate-agents","Real estate","Listings, CRM, appointments and lead follow up"],
          ["professional-services-growth","Digital agencies","Research, reporting, content and client support"],
          ["medical-practices","Healthcare providers","Appointment booking, records and patient communication"],
          ["construction-companies","Trades and construction","Quotes, scheduling, invoicing and admin support"],
          ["accountants-cpas","Accountants and CPAs","Bookkeeping support, reconciliations and client chasing"],
          ["law-firms","Legal and law firms","Case files, intake, scheduling and document preparation"]].map(([slug,label,copy]) =>
          <Link className="industry-segment-card" href={`/industries/${slug}`} key={slug}><strong>{label}</strong><small>{copy}</small></Link>)}
      </div>
      <div className="row wrap" style={{marginTop:20}}><Link className="btn" href="/industries">View all industries</Link></div>
    </div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>Choose the level of hiring support you need.</h2><p>Virtual Assistant compensation and the VirtualAssistant.com.ph service fee are separate. Pricing is explained before you make a hiring commitment.</p></div><div className="grid-2"><div className="card service-card"><h3>Managed Virtual Assistant service <span className="badge badge-success">Recommended</span></h3><p>Recruiting and vetting plus a structured operating layer after the Virtual Assistant starts -- your Virtual Assistant is backed by our team for as long as you work together, not left on their own after day one.</p><ul className="check-list"><li>Recruiting, screening, and matching</li><li>Structured onboarding workroom</li><li>Ongoing placement support</li><li>30-day replacement support at no extra placement fee</li></ul><Link className="btn btn-primary" href="/hire">Get a managed Virtual Assistant <ArrowRight size={16}/></Link></div><div className="card service-card"><h3>Direct hire</h3><p>Prefer to manage the Virtual Assistant yourself after the hire? We still handle the recruiting, screening, and matching -- your team takes it from there.</p><ul className="check-list"><li>Role review and candidate screening</li><li>Approved talent and matching support</li><li>Client-led interviews and final selection</li><li>One-time placement fee, no ongoing support included</li></ul></div></div><div className="pricing-note"><strong>Virtual Assistant compensation:</strong> ongoing hourly roles cannot be posted below USD 5/hour. <Link href="/pricing">See pricing and estimate monthly cost.</Link> · <Link href="/managed-vs-direct-hire">Compare Managed Virtual Assistant vs. Direct Hire.</Link></div></div></section>

    <section className="section"><div className="container"><div className="section-head"><h2>Common questions before you get matched.</h2></div><div className="faq-list">{faqs.map(([q,a])=><details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div><div style={{marginTop:20}}><Link className="btn" href="/faq">View all FAQs</Link></div></div></section>

    <section className="section section-white va-closing-strip"><div className="container row-between wrap"><div><h2>Looking for virtual assistant work?</h2><p className="muted">Browse reviewed jobs, build one structured profile, and apply after approval.</p></div><div className="row wrap"><Link className="btn" href="/jobs">Browse jobs</Link><Link className="btn btn-primary" href="/auth/join/va">Apply as a Virtual Assistant</Link></div></div></section>
  </main><SiteFooter/></>;
}
