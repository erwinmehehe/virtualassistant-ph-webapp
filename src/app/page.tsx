import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Globe2,
  Headphones,
  PhoneCall,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { PublicAvatar } from "@/components/public-avatar";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { mergeUniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { RoleBriefForm } from "@/components/role-brief-form";
import { FindMyVaWizard } from "@/components/find-my-va-wizard";
import { TalentShortlistBar } from "@/components/talent-shortlist";
import { VaCostCalculator } from "@/components/va-cost-calculator";
import "./premium-home.css";
import "./cro-hiring-tools.css";
import "./homepage-seo-evidence.css";
import "./homepage-growth.css";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Philippines | Hire Vetted Filipino VAs" },
  description:
    "Hire vetted Filipino virtual assistants with Virtual Assistant Philippines. Get matched by role, tools, schedule, and budget with recruiter support today.",
  keywords: [
    "virtual assistant philippines",
    "hire filipino virtual assistant",
    "filipino virtual assistant",
    "virtual assistant services philippines",
    "outsource to the philippines",
  ],
  alternates: { canonical: canonicalPath("/") },
  openGraph: {
    type: "website",
    title: "Virtual Assistant Philippines | Hire Vetted Filipino VAs",
    description:
      "Get matched with vetted Filipino virtual assistants for your role, tools, schedule, and budget.",
    url: canonicalPath("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Assistant Philippines | Hire Vetted Filipino VAs",
    description:
      "Get matched with vetted Filipino virtual assistants for your role, tools, schedule, and budget.",
  },
};

const BOOKING_URL = "/book-client-call";

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

const GROUP_DISPLAY_NAMES: Record<string, string> = {
  "Admin & Operations": "Administrative & Executive Virtual Assistants",
  Healthcare: "Healthcare Virtual Assistants",
  "Marketing & Growth": "Marketing & Social Media Virtual Assistants",
  "Finance & Accounting": "Bookkeeping & Finance Virtual Assistants",
  "Sales & CRM": "Sales & Lead Generation Virtual Assistants",
  Ecommerce: "Ecommerce Virtual Assistants",
  "Real Estate": "Real Estate Virtual Assistants",
  "Customer & Front Desk": "Customer Service Virtual Assistants",
  "Creative & Content": "Creative & Content Virtual Assistants",
  "Executive Support": "Executive Virtual Assistants",
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
  [
    "What does it cost to get started?",
    "Pricing depends on the role, experience level, working hours, schedule, and skills required. Share what you need and we will recommend a suitable hiring setup and show Virtual Assistant compensation and our service fee separately before you commit.",
  ],
  [
    "How fast can my virtual assistant start?",
    "Timelines depend on the role and candidate availability. A focused pool of screened candidates can make hiring much faster than starting a traditional recruitment search from scratch, and we confirm the expected timeline before you hire.",
  ],
  [
    "What if my virtual assistant is not the right fit?",
    "Tell Client Success as soon as something is not working. We review the role, expectations, and working relationship with you and help decide whether the issue can be resolved or a different candidate would be a better fit under your agreed service terms.",
  ],
  [
    "What hours do Filipino virtual assistants work?",
    "Schedules vary by candidate. We can match for Australian, US, UK, or other business-hour overlap, overnight coverage, or a fixed schedule depending on your operational needs.",
  ],
  [
    "How do I communicate with my virtual assistant?",
    "Use the tools your team already uses, including Slack, Microsoft Teams, email, Zoom, WhatsApp, Asana, ClickUp, Trello, or similar collaboration platforms.",
  ],
  [
    "Can I start with part-time support?",
    "Yes. Many businesses start with part-time support and increase hours as the role and workload grow.",
  ],
  [
    "Who handles payroll, tax, and employment administration?",
    "Responsibilities depend on the placement and service arrangement you choose. We explain the structure, service fees, and responsibilities clearly before you make a hiring commitment.",
  ],
  [
    "Can I change virtual assistants if the match is not working?",
    "Yes. If the working style or skill set is not right, we can review the situation with you and help identify a more suitable match under the terms of your placement.",
  ],
  [
    "Who owns the work my virtual assistant produces?",
    "Work ownership and confidentiality are covered in the applicable working and service agreements. Client deliverables should remain with the client business under the agreed terms.",
  ],
  [
    "How do you screen and vet candidates?",
    "Candidates are reviewed across professional experience, practical skills, communication, availability, work evidence, and recruiter evaluation before they are approved for client presentation.",
  ],
  [
    "Will my virtual assistant sign an NDA?",
    "Confidentiality requirements can be included before a Virtual Assistant receives access to your accounts, data, or internal systems.",
  ],
  [
    "What software and tools are your virtual assistants familiar with?",
    "Experience varies by candidate, but common platforms include Google Workspace, Microsoft 365, Slack, Asana, ClickUp, Notion, HubSpot, Shopify, Canva, Xero, QuickBooks, and similar business tools. We aim to match for your existing stack wherever possible.",
  ],
] as const;

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("public_va_directory")
    .select(
      "user_id,slug,full_name,avatar_url,headline,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate,schedule,availability_status",
    )
    .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
    .not("avatar_url", "is", null)
    .order("years_experience", { ascending: false })
    .order("weekly_hours", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(30);

  const featuredWithPhotos = (featured ?? [])
    .filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim())
    .slice(0, 6);
  const matchTalent = (featured ?? [])
    .filter((va: any) => va.slug)
    .map((va: any) => ({
      slug: va.slug,
      name: va.full_name,
      headline: va.headline,
      category: va.primary_category,
      categories: va.categories,
      weeklyHours: va.weekly_hours,
      hourlyRate: va.hourly_rate,
      yearsExperience: va.years_experience,
      schedule: va.schedule,
    }));

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "VirtualAssistant.com.ph",
      url: base,
      logo: `${base}/icon.svg`,
      description:
        "Philippines-focused recruiting and managed hiring for businesses looking for vetted Filipino Virtual Assistants.",
      areaServed: [
        { "@type": "Country", name: "Australia" },
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "United Kingdom" },
      ],
      knowsAbout: [
        "Virtual Assistant Philippines",
        "Filipino Virtual Assistants",
        "Virtual Assistant recruitment",
        "Administrative support",
        "Executive assistance",
        "Customer service",
        "Lead generation",
        "Ecommerce support",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          url: `${base}/contact`,
          availableLanguage: ["English"],
          areaServed: ["AU", "US", "GB"],
        },
      ],
      member: [
        { "@type": "Person", name: "Jervis Accad" },
        { "@type": "Person", name: "Bryan Batarina" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "VirtualAssistant.com.ph",
      url: base,
      inLanguage: "en",
      publisher: { "@id": `${base}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="pva-home">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />

        <section className="pva-hero">
          <div className="pva-grid-pattern" aria-hidden="true" />
          <div className="pva-orb pva-orb-a" aria-hidden="true" />
          <div className="pva-orb pva-orb-b" aria-hidden="true" />
          <div className="container pva-hero-grid">
            <div className="pva-hero-copy">
              <div className="pva-eyebrow">
                <span><ShieldCheck size={14} /> Vetted &amp; managed</span>
                <strong>Virtual Assistant Philippines for AU, US &amp; UK teams</strong>
              </div>
              <h1>
                Hire a Vetted Virtual Assistant <em>in the Philippines</em>
              </h1>
              <p className="pva-hero-lede">
                Get matched with a Filipino virtual assistant who fits your role, tools, schedule, and way of working.
              </p>
              <p className="pva-hero-sub">
                We shortlist vetted candidates, you choose who to hire, and Client Success helps make the handoff smooth from day one.
              </p>

              <div className="pva-hero-actions">
                <a className="pva-btn pva-btn-primary" href="#hero-hiring-form" data-track="hero_hiring_request">
                  Get your free VA match <ArrowRight size={18} />
                </a>
                <a className="pva-btn pva-btn-secondary" href={BOOKING_URL} data-track="booking_click">
                  <span className="pva-call-icon"><PhoneCall size={14} /></span> Discuss your VA needs
                </a>
              </div>

              <div className="pva-proof-row" aria-label="Candidate screening checks">
                <span><ClipboardCheck size={15} /> Skills tested</span>
                <span><Video size={15} /> Video reviewed</span>
                <span><ShieldCheck size={15} /> Recruiter approved</span>
                <span><CheckCircle2 size={15} /> You choose</span>
              </div>
            </div>

            <div id="hero-hiring-form" className="pva-hero-form-shell">
              <div className="pva-hero-form-badge"><ShieldCheck size={14} /> Private hiring request</div>
              <RoleBriefForm
                sourcePath="/"
                error={query.error}
                sent={Boolean(query.sent)}
                heading="Get your free virtual assistant match"
                subheading="Tell us what you need. We will review your role, schedule, tools, and budget to identify suitable candidates."
              />
            </div>
          </div>
        </section>

        <section className="pva-trust-strip" aria-label="Hiring advantages">
          <div className="container pva-trust-grid">
            <div><span>01</span><strong>Human vetted</strong><small>Recruiters review evidence, communication, and role fit.</small></div>
            <div><span>02</span><strong>Skills tested</strong><small>Practical screening helps separate claims from client-ready ability.</small></div>
            <div><span>03</span><strong>You choose</strong><small>Compare the shortlist, interview, and make the final decision.</small></div>
            <div><span>04</span><strong>Support after placement</strong><small>Client Success stays involved after your VA starts.</small></div>
          </div>
        </section>

        <section className="pva-section pva-soft">
          <div className="container">
            <FindMyVaWizard talent={matchTalent} />
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container">
            <div className="pva-section-head pva-section-head-row">
              <div>
                <span className="pva-kicker">Most experienced approved talent</span>
                <h2>Meet experienced Filipino virtual assistants.</h2>
                <p>Browse examples of approved talent. Your recruiter confirms current fit and availability before presenting anyone to you.</p>
              </div>
              <Link className="pva-text-link" href="/find-talent">Browse all talent <ArrowRight size={16} /></Link>
            </div>

            {featuredWithPhotos.length ? (
              <div className="pva-talent-grid">
                {featuredWithPhotos.map((va: any) => (
                  <article className="pva-talent-card" key={va.user_id}>
                    <div className="pva-talent-top">
                      <PublicAvatar name={va.full_name} src={va.avatar_url} />
                      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                        <span className="pva-approved"><BriefcaseBusiness size={14} /> {va.years_experience}+ yrs experience</span>
                        <span className="pva-approved"><BadgeCheck size={14} /> Approved</span>
                      </div>
                    </div>
                    <h3>{va.full_name}</h3>
                    <p className="pva-talent-title">{va.headline || va.primary_category || "Virtual Assistant"}</p>
                    <div className="pva-tags">
                      {mergeUniqueStrings(va.primary_category, va.categories)
                        .slice(0, 2)
                        .map((x, index) => <span key={`${String(x)}-${index}`}>{x}</span>)}
                    </div>
                    <div className="pva-talent-facts">
                      <span><Clock3 size={14} /> {va.weekly_hours ? `${va.weekly_hours} hrs/week available` : "Flexible availability"}</span>
                      {va.hourly_rate ? <span><CheckCircle2 size={14} /> ${Number(va.hourly_rate).toFixed(0)}/hr preferred</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pva-empty">Approved public profiles will appear here as experienced talent becomes available.</div>
            )}
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container pva-philippines-grid">
            <div className="pva-philippines-copy">
              <span className="pva-kicker">Why the Philippines</span>
              <h2>A global hub for experienced virtual assistants.</h2>
              <p>Filipino professionals have built a strong reputation for supporting international businesses. The advantage is more than cost: communication, adaptability, service mindset, and remote-work experience all matter when you are trusting someone with important day-to-day work.</p>
              <p>We match for the role itself, including the tools you use, the hours you need, the communication style that works for your team, and the level of ownership you expect.</p>
              <div className="pva-resource-links" aria-label="Virtual Assistant hiring resources">
                <Link href="/hire">Get your free VA match <ArrowRight size={13} /></Link>
                <Link href="/find-talent">Browse vetted Filipino VAs <ArrowRight size={13} /></Link>
                <Link href="/services">Virtual Assistant services <ArrowRight size={13} /></Link>
                <Link href="/pricing">Virtual Assistant pricing <ArrowRight size={13} /></Link>
                <Link href="/how-vetting-works">How we vet Virtual Assistants <ArrowRight size={13} /></Link>
                <Link href="/industries">Virtual Assistants by industry <ArrowRight size={13} /></Link>
                <Link href="/managed-vs-direct-hire">Managed VA vs. direct hire <ArrowRight size={13} /></Link>
                <Link href={BOOKING_URL}>Discuss your VA needs <ArrowRight size={13} /></Link>
              </div>
            </div>
            <div className="pva-reason-grid pva-why-grid">
              <article className="pva-reason-card"><span className="pva-reason-icon" aria-hidden="true">💬</span><h3>Fluent English</h3><p>Clear, professional written and spoken English helps make collaboration smoother with clients, customers, and internal teams.</p></article>
              <article className="pva-reason-card"><span className="pva-reason-icon" aria-hidden="true">🎯</span><h3>Attention to detail</h3><p>Careful execution means fewer mistakes, less back-and-forth, and more confidence when delegating recurring work.</p></article>
              <article className="pva-reason-card"><span className="pva-reason-icon" aria-hidden="true">🤝</span><h3>Service-first mindset</h3><p>Many Filipino professionals bring a strong customer-service culture with an emphasis on reliability, patience, and consistent support.</p></article>
              <article className="pva-reason-card"><span className="pva-reason-icon" aria-hidden="true">⚡</span><h3>Fast to adapt</h3><p>Experienced VAs are used to remote work, international clients, and learning new systems and workflows quickly.</p></article>
              <article className="pva-reason-card"><span className="pva-reason-icon" aria-hidden="true">💼</span><h3>Cost-effective support</h3><p>Access experienced professionals without many of the fixed overheads that come with adding another local employee.</p></article>
              <article className="pva-reason-card"><span className="pva-reason-icon" aria-hidden="true">🔧</span><h3>Already tool-proficient</h3><p>Many candidates already use Google Workspace, Slack, Asana, HubSpot, Shopify, Canva, Xero, QuickBooks, and similar tools.</p></article>
            </div>
          </div>
        </section>

        <section className="pva-section pva-seo-story">
          <div className="container pva-seo-story-grid">
            <div className="pva-seo-story-intro">
              <span className="pva-kicker">Virtual Assistant Philippines</span>
              <h2>Skilled remote support for growing businesses.</h2>
              <p>Hiring a virtual assistant in the Philippines is a practical way to add experienced support without immediately adding another full-time local employee.</p>
              <div className="pva-story-points">
                <div><strong>Flexible</strong><span>Start part-time or hire for full-time availability.</span></div>
                <div><strong>Role matched</strong><span>Match skills, tools, schedule, and working style.</span></div>
                <div><strong>Human screened</strong><span>Recruiters review candidates before client presentation.</span></div>
              </div>
            </div>
            <div className="pva-seo-story-copy">
              <p>Whether you run an ecommerce store, manage a growing client base, handle a busy sales pipeline, or simply need help keeping daily operations under control, a <strong>Filipino virtual assistant</strong> can take ownership of recurring work so you have more time to focus on the business itself.</p>
              <p>The Philippines has developed a strong reputation for <strong>virtual assistant services</strong> because of its large English-speaking workforce, established outsourcing industry, and professionals with experience supporting companies in Australia, the United States, the United Kingdom, and other international markets.</p>
              <p>Many Filipino virtual assistants already have experience with remote work, international clients, and common business software. That can reduce the amount of training needed before they start contributing.</p>
              <p>One of the biggest advantages when you <strong>hire a virtual assistant from the Philippines</strong> is flexibility. You may need someone for a few hours each week today and a larger commitment later. Your support can grow alongside your workload instead of forcing you into a larger hiring commitment before you are ready.</p>
              <p>An <Link href="/service/ecommerce">ecommerce virtual assistant</Link> can help with product listings, order administration, customer service, inventory updates, and supplier coordination. A <Link href="/service/social-media">social media virtual assistant</Link> can help schedule content, prepare graphics, manage comments, track campaigns, and keep your publishing calendar moving.</p>
              <p><strong>If you are spending too much time on work that someone else could reliably handle, it may be time to delegate.</strong></p>
            </div>
          </div>
        </section>

        <section className="pva-section pva-soft">
          <div className="container">
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">How it works</span>
              <h2>From hiring brief to a supported placement.</h2>
              <p>One managed workflow connects role design, recruiting, interviews, launch, and Client Success.</p>
            </div>
            <div className="pva-process-grid">
              <article><span className="pva-process-icon"><ClipboardCheck size={22} /></span><small>Step 1</small><h3>Tell us the role</h3><p>Share responsibilities, schedule, timezone, tools, budget, and what success should look like.</p></article>
              <article><span className="pva-process-icon"><SearchCheck size={22} /></span><small>Step 2</small><h3>We recruit and vet</h3><p>Recruiters review experience, practical skills, communication, availability, and role fit.</p></article>
              <article><span className="pva-process-icon"><CalendarCheck2 size={22} /></span><small>Step 3</small><h3>Review the shortlist</h3><p>Interview a focused group of client-ready candidates and choose who you want to hire.</p></article>
              <article><span className="pva-process-icon"><Headphones size={22} /></span><small>Step 4</small><h3>We manage the launch</h3><p>Managed placements continue with onboarding, Client Success check-ins, monitoring, and support after the start date.</p></article>
            </div>
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container">
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">Who is behind the workflow</span>
              <h2>Human recruiting and Client Success, not an anonymous marketplace.</h2>
              <p>Recruiters own the hire. Jervis Accad owns Client Success after placement, so there is a clear human responsible for launch, check-ins, recovery, retention, and account growth.</p>
            </div>
            <div className="pva-team-grid">
              <article className="pva-team-card">
                <div className="pva-team-person"><span className="pva-team-avatar">JA</span><div><small>Client Success Manager</small><strong>Jervis Accad</strong></div></div>
                <p>Owns the post-hire relationship, placement check-ins, early issue recovery, retention, and ongoing client success.</p>
              </article>
              <article className="pva-team-card">
                <div className="pva-team-person"><span className="pva-team-avatar">BB</span><div><small>Operations team</small><strong>Bryan Batarina</strong></div></div>
                <p>Supports the operating workflows that keep client, recruiter, and placement activity connected.</p>
              </article>
              <article className="pva-team-card pva-team-proof">
                <div className="pva-team-person"><span className="pva-team-avatar"><UsersRound size={17} /></span><div><small>Approval standard</small><strong>Human review before client presentation</strong></div></div>
                <p>Client shortlists are recruiter-curated. Automated matching can suggest candidates internally, but a human decides who is presented.</p>
              </article>
            </div>
            <div className="pva-team-actions"><Link className="pva-text-link" href="/about">About VirtualAssistant.com.ph <ArrowRight size={14} /></Link><Link className="pva-text-link" href="/how-vetting-works">See the vetting process <ArrowRight size={14} /></Link></div>
          </div>
        </section>

        <section className="pva-dark-section">
          <div className="container pva-dark-grid">
            <div className="pva-dark-copy">
              <span className="pva-dark-kicker"><Sparkles size={14} /> Hiring is only the beginning</span>
              <h2>The service continues after your new team member starts.</h2>
              <p>Recruiting gets the right person into the role. Client Success helps the placement launch well, catches problems early, and coordinates recovery or replacement when needed.</p>
              <ul>
                <li><CheckCircle2 size={17} /> Recruiting, vetting, matching, and client choice</li>
                <li><CheckCircle2 size={17} /> Structured placement readiness and onboarding</li>
                <li><CheckCircle2 size={17} /> Day 1 through Day 90 Client Success check-ins</li>
                <li><CheckCircle2 size={17} /> Monitoring, recovery, and replacement support</li>
              </ul>
              <div className="pva-dark-actions">
                <Link className="pva-btn pva-btn-light" href="/hire">Get your free VA match <ArrowRight size={17} /></Link>
                <Link className="pva-dark-link" href="/pricing">See transparent pricing</Link>
              </div>
            </div>

            <div className="pva-dashboard-mock" aria-label="Managed placement workflow preview">
              <div className="pva-dashboard-bar"><div><i /><i /><i /></div><span>Managed placement</span><small>Client Success</small></div>
              <div className="pva-dashboard-stats">
                <div><small>Recruiting</small><strong>Curated</strong><span>Role-ready shortlist</span></div>
                <div><small>Launch</small><strong>Structured</strong><span>Readiness + onboarding</span></div>
                <div><small>Support</small><strong>Ongoing</strong><span>Check-ins + recovery</span></div>
              </div>
              <div className="pva-pipeline">
                <div className="pva-pipeline-head"><strong>Placement journey</strong><span>One clear owner at each stage</span></div>
                {[
                  ["Recruiter handoff", "Ready", "Hiring context moves into Client Success"],
                  ["Placement launch", "Next", "Access, schedule, goals, and first-week plan"],
                  ["Ongoing health", "Active", "Client and VA pulses surface issues early"],
                ].map(([title, status, copy], index) => (
                  <div className="pva-pipeline-row" key={title}>
                    <span className="pva-pipeline-index">{index + 1}</span>
                    <div><strong>{title}</strong><small>{copy}</small></div>
                    <span className="pva-pipeline-status">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pva-section pva-soft">
          <div className="container">
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">Specialists, not generic profiles</span>
              <h2>Virtual Assistant services in the Philippines for the work you need done.</h2>
              <p>Explore role-specific Virtual Assistant services and see what each specialty can own for your team.</p>
            </div>
            <div className="pva-role-grid">
              {roleGroups.map(([group, pages]) => (
                <article key={group}>
                  <div className="pva-role-head"><span><Globe2 size={18} /></span><h3 className="pva-service-heading">{GROUP_DISPLAY_NAMES[group] || group}</h3></div>
                  <p>{GROUP_BLURBS[group]}</p>
                  <div className="pva-role-links">{pages.slice(0, 4).map((page) => <Link key={page.slug} href={`/service/${page.slug}`}>{page.name}</Link>)}</div>
                </article>
              ))}
            </div>
            <div className="pva-center-action"><Link className="pva-btn pva-btn-secondary" href="/services">View all Virtual Assistant services <ArrowRight size={17} /></Link></div>
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container" style={{ maxWidth: 1000 }}>
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">Cost comparison</span>
              <h2>See what a virtual assistant could save you.</h2>
              <p>Compare the estimated base labour cost of a Filipino virtual assistant with a local hire using your own hours and hourly rates. The calculator keeps agency fees and other overhead separate so the comparison stays transparent.</p>
            </div>
            <VaCostCalculator />
          </div>
        </section>

        <section className="pva-section pva-white pva-compare-section">
          <div className="container pva-compare-wrap">
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">Compare your options</span>
              <h2>Reliable support without the hiring headache.</h2>
              <p>Compare the practical trade-offs between a local employee, a managed Filipino Virtual Assistant, and coordinating multiple freelancers.</p>
            </div>
            <div className="pva-compare-grid pva-cost-options">
              <article className="pva-compare-card pva-compare-muted">
                <small>Option 01</small><h3>Local full-time staff</h3><p>Direct local employment can be the right fit for some roles, but it usually brings more fixed overhead and internal administration.</p>
                <ul><li><span>Benefits / payroll</span><strong>May apply</strong></li><li><span>Equipment</span><strong>Your team</strong></li><li><span>Recruiting</span><strong>Your team</strong></li><li><span>Flexibility</span><strong>Lower</strong></li></ul>
              </article>
              <article className="pva-compare-card pva-compare-featured">
                <span className="pva-mini-badge"><ShieldCheck size={13} /> Managed option</span><h3>Filipino Virtual Assistant</h3><p>Get remote support matched to your role while our recruiting team handles screening and Client Success supports the placement.</p>
                <ul><li><span>Schedule</span><strong>Part-time or full-time</strong></li><li><span>Recruiting</span><strong>Supported</strong></li><li><span>Workspace</span><strong>Remote</strong></li><li><span>Final choice</span><strong>You decide</strong></li></ul>
              </article>
              <article className="pva-compare-card pva-compare-muted">
                <small>Option 03</small><h3>Multiple freelancers</h3><p>Freelancers can work well for projects, but several providers can create fragmented communication, availability, and ownership.</p>
                <ul><li><span>Rates</span><strong>Variable</strong></li><li><span>Availability</span><strong>Provider dependent</strong></li><li><span>Communication</span><strong>Multiple contacts</strong></li><li><span>Management</span><strong>Your team</strong></li></ul>
              </article>
            </div>
          </div>
        </section>

        <section className="pva-section pva-white" id="faq">
          <div className="container pva-faq-grid">
            <div className="pva-faq-intro">
              <span className="pva-kicker">Questions, answered</span>
              <h2>What to know before you hire a Filipino Virtual Assistant.</h2>
              <p>Clear answers to the questions clients ask before sending a hiring brief.</p>
              <Link className="pva-text-link" href="/faq">View all FAQs <ArrowRight size={15} /></Link>
            </div>
            <div className="pva-faq-list">
              {faqs.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}<span>+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pva-final-cta">
          <div className="pva-final-orb" aria-hidden="true" />
          <div className="container pva-final-inner">
            <span className="pva-dark-kicker"><Star size={14} /> Ready when you are</span>
            <h2>Ready to stop doing everything yourself?</h2>
            <p>Tell us what you need help with and we will look for Filipino virtual assistants whose skills, experience, schedule, and working style fit your business.</p>
            <div className="pva-final-actions">
              <Link className="pva-btn pva-btn-light" href="/hire">Get your free VA match <ArrowRight size={17} /></Link>
              <Link className="pva-btn pva-btn-dark-outline" href={BOOKING_URL}>Discuss your VA needs</Link>
            </div>
            <div className="pva-final-proof"><span><Check size={14} /> Private brief</span><span><Check size={14} /> Human screening</span><span><Check size={14} /> Support after placement</span></div>
          </div>
        </section>
      </main>
      <TalentShortlistBar />
      <SiteFooter />
    </>
  );
}
