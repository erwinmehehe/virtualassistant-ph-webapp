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
import { TalentShortlistBar, TalentShortlistButton } from "@/components/talent-shortlist";
import { VaCostCalculator } from "@/components/va-cost-calculator";
import "./premium-home.css";
import "./cro-hiring-tools.css";
import "./homepage-seo-evidence.css";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Philippines | Hire Vetted Filipino VAs" },
  description:
    "Hire vetted Filipino virtual assistants matched to your role. Browse approved talent or request a private shortlist from our Philippines recruiting team.",
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
    description: "Hire vetted Filipino virtual assistants matched to your role. Browse approved talent or request a private shortlist from our Philippines recruiting team.",
    url: canonicalPath("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Assistant Philippines | Hire Vetted Filipino VAs",
    description: "Hire vetted Filipino virtual assistants matched to your role. Browse approved talent or request a private shortlist from our Philippines recruiting team.",
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
    "How much does a Virtual Assistant in the Philippines cost?",
    "Compensation varies by experience, specialty, tools, hours, and schedule. Ongoing hourly roles through our service cannot be budgeted below USD 6/hour, and the service fee is shown separately before you make a hiring commitment.",
  ],
  [
    "How do you vet Filipino Virtual Assistants?",
    "Public profiles only appear after the candidate completes the required profile, category skills test, video introduction, recruiter review, and final approval workflow.",
  ],
  [
    "Can a Filipino Virtual Assistant work US, UK, or Australian business hours?",
    "Availability varies by candidate. Public profiles show weekly availability, and the hiring brief captures timezone and schedule so the recruiting team can match and confirm coverage before you interview.",
  ],
  [
    "What tasks can a Filipino Virtual Assistant handle?",
    "Common roles include administrative and executive support, customer service, sales and lead generation, marketing, ecommerce, bookkeeping and finance support, real estate, healthcare support, and creative or technical work.",
  ],
  [
    "Can I interview candidates before hiring?",
    "Yes. We screen and narrow the field, but you choose who to interview and you make the final hiring decision.",
  ],
  [
    "Do I have to sort through every applicant?",
    "No. Our recruiting team can review the role and build a focused shortlist so you spend your time on stronger matches instead of a large applicant pool.",
  ],
  [
    "What happens after I send a hiring request?",
    "Your request stays private. Our recruiting team reviews the role, screens for fit, and follows up with the strongest next step. You do not need to create an account to get started.",
  ],
] as const;

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getMedian(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: featured }, { data: insightRows }] = await Promise.all([
    supabase
      .from("public_va_directory")
      .select(
        "user_id,slug,full_name,avatar_url,headline,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate,schedule,availability_status",
      )
      .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
      .not("avatar_url", "is", null)
      .order("years_experience", { ascending: false })
      .order("weekly_hours", { ascending: false })
      .order("full_name", { ascending: true })
      .limit(30),
    supabase
      .from("public_va_directory")
      .select("years_experience,weekly_hours,primary_category")
      .limit(200),
  ]);

  const featuredWithPhotos = (featured ?? [])
    .filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim())
    .slice(0, 6);
  const matchTalent = (featured ?? []).filter((va: any) => va.slug).map((va: any) => ({
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

  const talentRows = (insightRows ?? []).filter((va: any) => Number.isFinite(Number(va.years_experience)));
  const experienceValues = talentRows.map((va: any) => Number(va.years_experience));
  const approvedProfileCount = talentRows.length;
  const medianExperience = getMedian(experienceValues);
  const tenPlusYears = talentRows.filter((va: any) => Number(va.years_experience) >= 10).length;
  const fullTimeAvailable = talentRows.filter((va: any) => Number(va.weekly_hours) >= 40).length;
  const fullTimeShare = approvedProfileCount ? Math.round((fullTimeAvailable / approvedProfileCount) * 100) : 0;
  const categoryCounts = new Map<string, number>();
  for (const va of talentRows as any[]) {
    const category = typeof va.primary_category === "string" ? va.primary_category.trim() : "";
    if (!category) continue;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4);

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
        { "@type": "Person", name: "Jervis" },
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
                <a className="pva-btn pva-btn-secondary" href={BOOKING_URL} data-track="booking_click">
                  <span className="pva-call-icon"><PhoneCall size={14} /></span> Book a client call
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
                <p>Showing six approved profiles with the most years of experience, ranked from highest to lowest.</p>
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
                    <div className="cro-directory-actions"><Link className="pva-card-link" href={`/va/${va.slug}`}>View profile <ArrowRight size={15} /></Link><TalentShortlistButton talent={{ slug: va.slug, name: va.full_name, headline: va.headline }} /></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pva-empty">Approved public profiles will appear here as experienced talent becomes available.</div>
            )}
          </div>
        </section>

        <section className="pva-section pva-evidence-section">
          <div className="container">
            <div className="pva-section-head">
              <span className="pva-kicker">Live approved talent data</span>
              <h2>What our Filipino Virtual Assistant talent pool looks like right now.</h2>
              <p>These figures are calculated from profiles currently visible in the approved public directory, not hand-written marketing estimates.</p>
            </div>
            <div className="pva-insight-grid">
              <article className="pva-insight-card"><strong>{approvedProfileCount}</strong><span>approved public profiles in the current directory</span></article>
              <article className="pva-insight-card"><strong>{Number.isInteger(medianExperience) ? medianExperience : medianExperience.toFixed(1)}</strong><span>median years of experience across approved profiles</span></article>
              <article className="pva-insight-card"><strong>{tenPlusYears}</strong><span>approved profiles with 10+ years of experience</span></article>
              <article className="pva-insight-card"><strong>{fullTimeShare}%</strong><span>listing at least 40 hours/week of availability</span></article>
            </div>
            <div className="pva-category-proof">
              <div>
                <h3>Most represented specialties</h3>
                <p>The mix changes as candidates complete screening and public approval. Counts below come from the same live directory data.</p>
              </div>
              <div className="pva-category-list">
                {topCategories.map(([category, count]) => <span key={category}>{category} · {count}</span>)}
              </div>
            </div>
            <p className="pva-evidence-note">Public-profile totals can change as availability and approval status change. <Link className="pva-text-link" href="/find-talent">Browse the current approved talent pool <ArrowRight size={14} /></Link></p>
          </div>
        </section>

        <section className="pva-section pva-white">
          <div className="container pva-philippines-grid">
            <div className="pva-philippines-copy">
              <span className="pva-kicker">Virtual Assistant Philippines</span>
              <h2>Why hire a Virtual Assistant in the Philippines?</h2>
              <p>Filipino professionals support international businesses across administration, executive assistance, customer service, lead generation, marketing, ecommerce, finance, real estate, healthcare support, and specialist operational roles.</p>
              <p>The advantage is not simply lower cost. The better hiring outcome comes from matching the right experience, communication style, tools, schedule, and ownership to the work your team needs to hand off.</p>
              <p>Our model combines a public talent directory with human recruiting, so you can <Link href="/find-talent">browse vetted Filipino Virtual Assistants</Link> or <Link href="/hire">send a private hiring brief</Link> and have the team build a focused shortlist around the role.</p>
              <div className="pva-resource-links" aria-label="Virtual Assistant hiring resources">
                <Link href="/hire">Hire a Virtual Assistant <ArrowRight size={13} /></Link>
                <Link href="/find-talent">Browse vetted Filipino VAs <ArrowRight size={13} /></Link>
                <Link href="/services">Virtual Assistant services <ArrowRight size={13} /></Link>
                <Link href="/pricing">Virtual Assistant pricing <ArrowRight size={13} /></Link>
                <Link href="/how-vetting-works">How we vet Virtual Assistants <ArrowRight size={13} /></Link>
                <Link href="/industries">Virtual Assistants by industry <ArrowRight size={13} /></Link>
                <Link href="/managed-vs-direct-hire">Managed VA vs. direct hire <ArrowRight size={13} /></Link>
                <Link href={BOOKING_URL}>Book a hiring consultation <ArrowRight size={13} /></Link>
              </div>
            </div>
            <div className="pva-reason-grid">
              <article className="pva-reason-card"><h3>Experienced remote professionals</h3><p>The approved directory includes candidates with long operating histories, including profiles with 10+ years of work experience.</p></article>
              <article className="pva-reason-card"><h3>International schedule matching</h3><p>Availability and timezone requirements are part of the role brief, so schedule fit can be checked before a client spends time interviewing.</p></article>
              <article className="pva-reason-card"><h3>Recruiter-screened, client-chosen</h3><p>The recruiting team reviews candidate evidence and role fit. You still interview the shortlist and make the final hiring decision.</p></article>
            </div>
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

        <section className="pva-section pva-white">
          <div className="container">
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">Who is behind the workflow</span>
              <h2>Human recruiting and operations, not an anonymous marketplace.</h2>
              <p>Jervis and Bryan Batarina are active members of the platform operations team. Candidate approval still requires human recruiter review before a profile becomes publicly visible.</p>
            </div>
            <div className="pva-team-grid">
              <article className="pva-team-card">
                <div className="pva-team-person"><span className="pva-team-avatar">J</span><div><small>Operations team</small><strong>Jervis</strong></div></div>
                <p>Supports the operational workflow connecting client requests, recruiter activity, and hiring follow-through inside the platform.</p>
              </article>
              <article className="pva-team-card">
                <div className="pva-team-person"><span className="pva-team-avatar">BB</span><div><small>Operations team</small><strong>Bryan Batarina</strong></div></div>
                <p>Supports the platform operations behind client and recruiter workflows as hiring activity moves from brief to placement.</p>
              </article>
              <article className="pva-team-card pva-team-proof">
                <div className="pva-team-person"><span className="pva-team-avatar"><UsersRound size={17} /></span><div><small>Approval standard</small><strong>Human review before public visibility</strong></div></div>
                <p>Public profiles are not automatically published from a signup. Required screening and approval steps must be completed first.</p>
              </article>
            </div>
            <div className="pva-team-actions"><Link className="pva-text-link" href="/about">About VirtualAssistant.com.ph <ArrowRight size={14} /></Link><Link className="pva-text-link" href="/how-vetting-works">See the vetting process <ArrowRight size={14} /></Link></div>
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
              <h2>Virtual Assistant services in the Philippines for the work you need done.</h2>
              <p>Explore role-specific Virtual Assistant services and see what each specialty can own for your team.</p>
            </div>
            <div className="pva-role-grid">
              {roleGroups.map(([group, pages]) => (
                <article key={group}>
                  <div className="pva-role-head"><span><Globe2 size={18} /></span><h3 className="pva-service-heading">{GROUP_DISPLAY_NAMES[group] || group}</h3></div>
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
          <div className="container" style={{maxWidth: 900}}>
            <div className="pva-section-head pva-centered">
              <span className="pva-kicker">Budget before the call</span>
              <h2>Estimate what your Virtual Assistant budget could look like.</h2>
              <p>Set hours and an hourly rate to get a simple monthly compensation estimate before you request candidates.</p>
            </div>
            <VaCostCalculator />
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

        <section className="pva-section pva-white" id="faq">
          <div className="container pva-faq-grid">
            <div className="pva-faq-intro">
              <span className="pva-kicker">Questions, answered</span>
              <h2>What to know before you hire a Filipino Virtual Assistant.</h2>
              <p>Clear answers to the commercial questions clients ask before sending a hiring brief.</p>
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
      <TalentShortlistBar />
      <SiteFooter />
    </>
  );
}
