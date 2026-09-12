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
  MessageSquareText,
  PhoneCall,
  SearchCheck,
  ShieldCheck,
  Sparkles,
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
import "./premium-home.css";

export const metadata: Metadata = {
  title: { absolute: "Hire Virtual Assistants | Virtual Assistant Philippines" },
  description:
    "Virtual Assistant Philippines — hire vetted, screened Filipino Virtual Assistants matched to your role. Browse approved talent or request a private shortlist today.",
  keywords: [
    "virtual assistant philippines",
    "hire filipino virtual assistant",
    "filipino virtual assistant",
    "virtual assistant services philippines",
    "outsource to the philippines",
  ],
  alternates: { canonical: canonicalPath("/") },
};

const BOOKING_URL = "https://calendar.app.google/FxedmioyeJhKras87";

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
  [
    "What does vetted mean?",
    "A public Virtual Assistant profile only appears after the candidate completes the required profile, category skills test, video introduction, recruiter review, and final approval workflow.",
  ],
  [
    "Do I have to sort through every applicant?",
    "No. Our recruiting team can screen the role and build a focused shortlist so you spend your time on the candidates worth interviewing.",
  ],
  [
    "How much does a Virtual Assistant cost?",
    "Virtual Assistant compensation varies by experience, specialty, tools, hours, and schedule. Ongoing hourly roles through our service cannot be budgeted below USD 5/hour. Our service fee is separate and shown before you make a hiring commitment.",
  ],
  [
    "Can I request a specific Virtual Assistant?",
    "Yes. Open a public talent profile and request an introduction. The selected profile stays attached to your hiring request so our recruiting team has the right context when following up.",
  ],
  [
    "What happens after I send a hiring request?",
    "Your request stays private. Our recruiting team reviews the role, screens for fit, and follows up with the strongest next step. You do not need to create an account to get started.",
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
  const [{ data: featured }] = await Promise.all([
    supabase
      .from("public_va_directory")
      .select(
        "user_id,slug,full_name,avatar_url,headline,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate",
      )
      .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
      .not("avatar_url", "is", null)
      .limit(9),
  ]);

  const featuredWithPhotos = (featured ?? [])
    .filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim())
    .slice(0, 3);

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
        "Hire vetted virtual assistants from the Philippines. Screened talent, private role briefs, and a clearer hiring process.",
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
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${base}/#faq`,
      mainEntity: faqs.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
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
                We recruit, screen, and match experienced Filipino virtual assistants to your business, with placement support after they start, not just an introduction.
              </p>
              <p className="pva-hero-sub">
                A clearer way to build a reliable Filipino remote team without sorting through hundreds of applications yourself.
              </p>

              <div className="pva-hero-actions">
                <a className="pva-btn pva-btn-primary" href="#hero-hiring-form" data-track="hero_hiring_request">
                  Start your hiring request <ArrowRight size={18} />
                </a>
                <a className="pva-btn pva-btn-secondary" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  <span className="pva-call-icon"><PhoneCall size={14} /></span> Book a 15-min call
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
                heading="Get a vetted shortlist"
                subheading="Share the role in about 60 seconds. No account required."
              />
            </div>
          </div>
        </section>

        <section className="pva-trust-strip" aria-label="Hiring advantages">
          <div className="container pva-trust-grid">
            <div><span>01</span><strong>Skip the resume pile</strong><small>Start with screened candidates worth interviewing.</small></div>
            <div><span>02</span><strong>Skills + communication checked</strong><small>Practical screening backed by human recruiter review.</small></div>
            <div><span>03</span><strong>You choose who you hire</strong><small>Compare profiles, interview, and make the final call.</small></div>
            <div><span>04</span><strong>Support after placement</strong><small>Managed hiring stays involved after your VA starts.</small></div>
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container">
            <div className="pva-section-head pva-section-head-row">
              <div>
                <span className="pva-kicker">Approved talent</span>
                <h2>Meet experienced Filipino virtual assistants.</h2>
                <p>Public profiles appear only after the required screening and approval steps are completed.</p>
              </div>
              <Link className="pva-text-link" href="/find-talent">Browse all talent <ArrowRight size={16} /></Link>
            </div>

            {featuredWithPhotos.length ? (
              <div className="pva-talent-grid">
                {featuredWithPhotos.map((va: any) => (
                  <article className="pva-talent-card" key={va.user_id}>
                    <div className="pva-talent-top">
                      <PublicAvatar name={va.full_name} src={va.avatar_url} />
                      <span className="pva-approved"><BadgeCheck size={14} /> Approved</span>
                    </div>
                    <h3>{va.full_name}</h3>
                    <p className="pva-talent-title">{va.headline || va.primary_category || "Virtual Assistant"}</p>
                    <div className="pva-tags">
                      {mergeUniqueStrings(va.primary_category, va.categories)
                        .slice(0, 2)
                        .map((x, index) => <span key={`${String(x)}-${index}`}>{x}</span>)}
                    </div>
                    <div className="pva-talent-facts">
                      <span><BriefcaseBusiness size={14} /> {va.years_experience}+ years experience</span>
                      <span><Clock3 size={14} /> {va.weekly_hours ? `${va.weekly_hours} hrs/week available` : "Flexible availability"}</span>
                      {va.hourly_rate ? <span><CheckCircle2 size={14} /> ${Number(va.hourly_rate).toFixed(0)}/hr preferred</span> : null}
                    </div>
                    <Link className="pva-card-link" href={`/va/${va.slug}`}>View profile <ArrowRight size={15} /></Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pva-empty">Approved public profiles will appear here as experienced talent becomes available.</div>
            )}
          </div>
        </section>

        <section className="pva-section pva-soft">
          <div className="container">
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">How it works</span>
              <h2>From workload to shortlist to hire, without the marketplace chaos.</h2>
              <p>One hiring workflow connects your brief, recruiter screening, interviews, and placement support.</p>
            </div>
            <div className="pva-process-grid">
              <article>
                <span className="pva-process-icon"><ClipboardCheck size={22} /></span><small>Step 1</small><h3>Tell us the role</h3><p>Share responsibilities, schedule, timezone, tools, budget, and what success should look like.</p>
              </article>
              <article>
                <span className="pva-process-icon"><SearchCheck size={22} /></span><small>Step 2</small><h3>We screen for fit</h3><p>Recruiters review experience, practical skills, communication, availability, and role fit.</p>
              </article>
              <article>
                <span className="pva-process-icon"><CalendarCheck2 size={22} /></span><small>Step 3</small><h3>Interview the shortlist</h3><p>Spend your interview time on stronger matches instead of sorting a large applicant pool.</p>
              </article>
              <article>
                <span className="pva-process-icon"><Headphones size={22} /></span><small>Step 4</small><h3>Hire with support</h3><p>You make the final decision, and managed placements continue with support after the start date.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="pva-dark-section">
          <div className="container pva-dark-grid">
            <div className="pva-dark-copy">
              <span className="pva-dark-kicker"><Sparkles size={14} /> Built for a real hiring team</span>
              <h2>A better view of what happens after you click “hire.”</h2>
              <p>Hiring should not disappear into email threads. The platform keeps the client, recruiter, and Virtual Assistant journey connected from brief through placement.</p>
              <ul>
                <li><CheckCircle2 size={17} /> Client role briefs and candidate shortlists</li>
                <li><CheckCircle2 size={17} /> Recruiter vetting and matching workflows</li>
                <li><CheckCircle2 size={17} /> Interview, proposal, onboarding, and workroom continuity</li>
                <li><CheckCircle2 size={17} /> Separate experiences for clients, recruiters, and VAs</li>
              </ul>
              <div className="pva-dark-actions">
                <Link className="pva-btn pva-btn-light" href="/hire">Start hiring <ArrowRight size={17} /></Link>
                <Link className="pva-dark-link" href="/how-vetting-works">See how vetting works</Link>
              </div>
            </div>

            <div className="pva-dashboard-mock" aria-label="Client hiring dashboard preview">
              <div className="pva-dashboard-bar">
                <div><i /><i /><i /></div><span>Client hiring workspace</span><small>Live workflow</small>
              </div>
              <div className="pva-dashboard-stats">
                <div><small>Role brief</small><strong>Reviewed</strong><span>Ready for matching</span></div>
                <div><small>Candidate pipeline</small><strong>Screened</strong><span>Recruiter curated</span></div>
                <div><small>Interviews</small><strong>Organized</strong><span>One place to decide</span></div>
              </div>
              <div className="pva-pipeline">
                <div className="pva-pipeline-head"><strong>Hiring pipeline</strong><span>One clear next step</span></div>
                {[
                  ["Recruiter screening", "Complete", "Skills + communication reviewed"],
                  ["Candidate shortlist", "Ready", "Strongest role matches surfaced"],
                  ["Client interviews", "Next", "Compare and choose your preferred VA"],
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
              <h2>Hire around the work your business actually needs done.</h2>
              <p>Explore role-specific Virtual Assistant services and see what each specialty can own for your team.</p>
            </div>
            <div className="pva-role-grid">
              {roleGroups.map(([group, pages]) => (
                <article key={group}>
                  <div className="pva-role-head"><span><Globe2 size={18} /></span><h3>{group}</h3></div>
                  <p>{GROUP_BLURBS[group]}</p>
                  <div className="pva-role-links">
                    {pages.slice(0, 4).map((page) => <Link key={page.slug} href={`/service/${page.slug}`}>{page.name}</Link>)}
                  </div>
                </article>
              ))}
            </div>
            <div className="pva-center-action"><Link className="pva-btn pva-btn-secondary" href="/services">View all Virtual Assistant services <ArrowRight size={17} /></Link></div>
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container pva-compare-wrap">
            <div className="pva-section-head">
              <span className="pva-kicker">Why this model works</span>
              <h2>Less applicant sorting. More informed hiring.</h2>
              <p>Most hiring options make you choose between an open marketplace and a black-box agency. This model keeps screening support without taking away your final decision.</p>
            </div>
            <div className="pva-compare-grid">
              <article><small>Open marketplaces</small><h3>You do the screening</h3><p>Large applicant pools can look efficient until your team is spending hours checking claims, communication, and fit.</p></article>
              <article><small>Traditional agencies</small><h3>You may see fewer options</h3><p>Some agency models bundle pricing and present a candidate without giving much visibility into the selection process.</p></article>
              <article className="pva-compare-featured"><span className="pva-mini-badge"><ShieldCheck size={13} /> Our approach</span><h3>We screen. You decide.</h3><p>Our recruiting team narrows the field, you interview the strongest matches, and compensation plus service fees are shown separately before commitment.</p></article>
            </div>
          </div>
        </section>

        <section className="pva-section pva-seo-section">
          <div className="container pva-seo-grid">
            <div>
              <span className="pva-kicker">Virtual Assistant Philippines</span>
              <h2>Why businesses build remote teams in the Philippines</h2>
              <p>Filipino professionals commonly work in English and support international businesses across administration, customer service, marketing, finance, ecommerce, real estate, healthcare, and specialist operational roles.</p>
              <p>The advantage is not simply lower cost. The real value comes from hiring someone with the right experience, communication style, tools, schedule, and ownership for the work your team needs to hand off.</p>
            </div>
            <div className="pva-seo-card">
              <h3>What should you budget?</h3>
              <p>Rates vary by experience, specialty, toolset, work schedule, and responsibility. Ongoing hourly roles through our service cannot be budgeted below USD 5/hour.</p>
              <p>Virtual Assistant compensation and our service fee are shown separately before you make a hiring commitment, so you can see what the VA earns and what the service costs.</p>
              <Link href="/pricing" className="pva-text-link">See pricing details <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>

        <section className="pva-section pva-white" id="faq">
          <div className="container pva-faq-grid">
            <div className="pva-faq-intro">
              <span className="pva-kicker">Questions, answered</span>
              <h2>What to know before you hire.</h2>
              <p>Clear expectations make better placements. These are the questions clients ask most often before sending a role brief.</p>
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
            <h2>Build your shortlist around the role, not the resume pile.</h2>
            <p>Send a private hiring brief or browse approved Filipino Virtual Assistants first. You stay in control of the final hiring decision.</p>
            <div className="pva-final-actions">
              <Link className="pva-btn pva-btn-light" href="/hire">Start your hiring request <ArrowRight size={17} /></Link>
              <Link className="pva-btn pva-btn-dark-outline" href="/find-talent">Browse approved talent</Link>
            </div>
            <div className="pva-final-proof"><span><Check size={14} /> Private brief</span><span><Check size={14} /> Human screening</span><span><Check size={14} /> No account required to start</span></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
