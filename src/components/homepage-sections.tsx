import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CalendarCheck2,
  Check,
  CheckCircle2,
  CircleX,
  CircleMinus,
  ClipboardCheck,
  Clock3,
  Headphones,
  HeartPulse,
  Home,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Rocket,
  Scale,
  SearchCheck,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";
import { VaCostCalculator } from "@/components/va-cost-calculator";
import { mergeUniqueStrings } from "@/lib/collections";
import { INDUSTRIES } from "@/lib/industries";

/**
 * Everything on the homepage below the hero, in one visual system.
 *
 * Replaces fourteen sections that had accumulated in two styles -- the older
 * pva-* blocks and a later editorial CSS module that restyled some of them with
 * !important overrides. Two were outright duplicates: a second "Virtual
 * Assistant services in the Philippines" grid, and a second hiring comparison.
 * Styles live in src/app/homepage-sections.css under an hs-* namespace.
 *
 * The hero and the trust strip directly under it are intentionally not here.
 */

type Icon = typeof ArrowRight;
type Faq = readonly [string, string];

type FeaturedVa = {
  user_id: string;
  slug?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  primary_category?: string | null;
  categories?: string[] | null;
  weekly_hours?: number | null;
  years_experience?: number | null;
  hourly_rate?: number | null;
};

function Kicker({ children }: { children: React.ReactNode }) {
  return <span className="hs-kicker">{children}</span>;
}

function Chip({ icon: Icon, tone, size = 24 }: { icon: Icon; tone: number; size?: number }) {
  return <span className={`hs-chip hs-chip-${(tone % 4) + 1}`} aria-hidden="true"><Icon size={size} /></span>;
}

/* -------------------------------------------------------------------------- */
/* 1. Services                                                                */
/* -------------------------------------------------------------------------- */

const SERVICE_AREAS: { label: string; href: string; icon: Icon }[] = [
  { label: "Executive Assistance", href: "/service/general-virtual-assistant", icon: BriefcaseBusiness },
  { label: "Customer Support", href: "/service/customer-service", icon: Headphones },
  { label: "Ecommerce Support", href: "/service/ecommerce", icon: ShoppingCart },
  { label: "Bookkeeping & Accounting", href: "/service/bookkeeping", icon: Calculator },
  { label: "Digital Marketing", href: "/service/digital-marketing-virtual-assistant", icon: BarChart3 },
  { label: "Real Estate Support", href: "/service/real-estate", icon: Home },
  { label: "Lead Generation", href: "/service/lead-generation", icon: Users },
  { label: "Social Media Management", href: "/service/social-media", icon: MessageCircle },
  { label: "And More", href: "/services", icon: MoreHorizontal },
];

export function ServicesSection() {
  return (
    <section className="hs-section hs-band-white" aria-labelledby="hs-services-title">
      <div className="container hs-services">
        <div>
          <Kicker>More than tasks. Real business support.</Kicker>
          <h2 className="hs-h2" id="hs-services-title">Virtual Assistant Services in the Philippines</h2>
          <div className="hs-prose">
            <p>Filipino virtual assistants support businesses with recurring administrative, operational, customer service, and marketing work that does not need to remain with an owner or local employee.</p>
            <p>At VirtualAssistant.com.ph, we match businesses with virtual assistants based on the actual work they need handled rather than simply forwarding a list of applicants. Candidates can be screened for relevant experience, tools, communication skills, working hours, and timezone overlap before you spend time interviewing.</p>
            <p>You can hire support for executive assistance, customer service, ecommerce operations, bookkeeping, lead generation, digital marketing, real estate support, and other remote business functions.</p>
          </div>
          <Link className="hs-btn hs-btn-primary" href="/services">Explore our services <ArrowRight size={16} /></Link>
        </div>

        <div className="hs-tiles-3" aria-label="Virtual Assistant service areas">
          {SERVICE_AREAS.map(({ label, href, icon }, index) => (
            <Link key={label} href={href} className="hs-tile">
              <Chip icon={icon} tone={index} />
              <strong>{label}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Why the Philippines                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A 9am-5pm business day in each market, shown on a 24-hour Manila clock.
 *
 * Manila is UTC+8 with no daylight saving. Sydney AEST is UTC+10, London GMT is
 * UTC+0, New York EST is UTC-5, so in standard time:
 *   Sydney   09:00-17:00 -> Manila 07:00-15:00
 *   London   09:00-17:00 -> Manila 17:00-01:00 (next day)
 *   New York 09:00-17:00 -> Manila 22:00-06:00 (next day)
 * Shifts that cross midnight are drawn as two segments. Daylight saving in the
 * client's market moves each window by one hour, which the note states.
 */
const SHIFTS: { code: string; city: string; manila: string; segments: [number, number][] }[] = [
  { code: "AU", city: "Sydney", manila: "7:00 AM - 3:00 PM", segments: [[7, 15]] },
  { code: "UK", city: "London", manila: "5:00 PM - 1:00 AM", segments: [[17, 24], [0, 1]] },
  { code: "US", city: "New York", manila: "10:00 PM - 6:00 AM", segments: [[22, 24], [0, 6]] },
];

function WorkingHoursCard() {
  return (
    <aside className="hs-tz" aria-labelledby="hs-tz-title">
      <div className="hs-tz-head">
        <Chip icon={Clock3} tone={1} size={20} />
        <div>
          <strong id="hs-tz-title">Your VA works your business hours</strong>
          <small>A 9am-5pm day in each market, shown in Manila time</small>
        </div>
      </div>

      <ul className="hs-tz-rows">
        {SHIFTS.map(({ code, city, manila, segments }) => (
          <li key={code}>
            <div className="hs-tz-label">
              <span className="hs-tz-code">{code}</span>
              <span className="hs-tz-city">{city} business day</span>
              <strong>{manila}</strong>
            </div>
            <div className="hs-tz-track" aria-hidden="true">
              <span className="hs-tz-night" style={{ left: 0, width: "25%" }} />
              <span className="hs-tz-night" style={{ left: "75%", width: "25%" }} />
              {segments.map(([from, to]) => (
                <span key={from} className="hs-tz-bar" style={{ left: `${(from / 24) * 100}%`, width: `${((to - from) / 24) * 100}%` }} />
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="hs-tz-axis" aria-hidden="true">
        <span style={{ left: "0%" }}>12am</span>
        <span style={{ left: "25%" }}>6am</span>
        <span style={{ left: "50%" }}>12pm</span>
        <span style={{ left: "75%" }}>6pm</span>
        <span style={{ left: "100%" }}>12am</span>
      </div>

      <p className="hs-tz-note">Manila time, UTC+8. Standard time shown; windows move by an hour while your market is on daylight saving. Shaded areas are night in Manila.</p>
    </aside>
  );
}

const REASONS = [
  ["Fluent English", "Clear written and spoken English for clients, customers, and teams."],
  ["Attention to detail", "Careful execution means fewer mistakes and less back-and-forth."],
  ["Service-first mindset", "A strong customer-service culture built on reliability and patience."],
  ["Fast to adapt", "Used to remote work, international clients, and new systems."],
  ["Cost-effective support", "Experienced help without the fixed overhead of another local hire."],
  ["Already tool-proficient", "Google Workspace, Slack, Asana, HubSpot, Shopify, Canva, Xero, QuickBooks."],
] as const;

export function WhyPhilippinesSection() {
  return (
    <section className="hs-section hs-band-soft" aria-labelledby="hs-why-title">
      <div className="container">
        <div className="hs-why">
          <div>
            <Kicker>A smarter way to grow</Kicker>
            <h2 className="hs-h2" id="hs-why-title">Why Hire a Virtual Assistant <span className="hs-accent">in the Philippines?</span></h2>
            <div className="hs-prose">
              <p>The Philippines has become a global hub for experienced virtual assistants. Filipino professionals have built a strong reputation for supporting international businesses, and the advantage is more than cost: communication, adaptability, service mindset, and remote-work experience all matter when you are trusting someone with important day-to-day work.</p>
              <p>Whether you run an ecommerce store, manage a growing client base, handle a busy sales pipeline, or simply need help keeping daily operations under control, a <strong>Filipino virtual assistant</strong> can take ownership of recurring work so you have more time to focus on the business itself.</p>
              <p>The Philippines has developed a strong reputation for <strong>virtual assistant services</strong> because of its large English-speaking workforce, established outsourcing industry, and professionals with experience supporting companies in Australia, the United States, the United Kingdom, and other international markets.</p>
            <p>For current first-party data, see our <Link href="/research/virtual-assistant-rates-philippines-2026">2026 Virtual Assistant Rate &amp; Skills Report</Link>, which aggregates preferred USD hourly rates, experience, skills, and tools from VirtualAssistant.com.ph candidate profiles.</p>
            </div>
          </div>

          <WorkingHoursCard />
        </div>

        <div className="hs-reasons-panel">
          <div className="hs-reasons-intro">
            <strong>What Filipino virtual assistants bring</strong>
            <span>Why teams keep hiring from the Philippines</span>
          </div>
          <ul className="hs-reasons-grid">
            {REASONS.map(([title, copy]) => (
              <li key={title}>
                <CheckCircle2 size={19} aria-hidden="true" />
                <div><strong>{title}</strong><span>{copy}</span></div>
              </li>
            ))}
          </ul>
        </div>

        <details className="hs-more">
          <summary>More on hiring a virtual assistant from the Philippines <Plus size={15} aria-hidden="true" /></summary>
          <div className="hs-why-more">
          <div className="hs-prose">
            <p>One of the biggest advantages when you <strong>hire a virtual assistant from the Philippines</strong> is flexibility. You may need someone for a few hours each week today and a larger commitment later. Your support can grow alongside your workload instead of forcing you into a larger hiring commitment before you are ready.</p>
            <p>We match for the role itself, including the tools you use, the hours you need, the communication style that works for your team, and the level of ownership you expect.</p>
          </div>
          <div className="hs-prose">
            <p>An <Link href="/service/ecommerce">ecommerce virtual assistant</Link> can help with product listings, order administration, customer service, inventory updates, and supplier coordination.</p>
            <p>A <Link href="/service/social-media">social media virtual assistant</Link> can help schedule content, prepare graphics, manage comments, track campaigns, and keep your publishing calendar moving.</p>
          </div>
          </div>
        </details>

        <div className="hs-delegate">
          <p>If you are spending too much time on work that someone else could reliably handle, it may be time to delegate.</p>
          <Link className="hs-btn hs-btn-primary" href="/hire">Get your free VA match <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Hiring models                                                           */
/* -------------------------------------------------------------------------- */

type Verdict = "yes" | "partial" | "no" | "info";
type ModelCell = { verdict: Verdict; text: string };

const MODEL_COLUMNS = [
  { key: "agency", title: "VirtualAssistant.com.ph", subtitle: "Agency · Managed / Recruiter-Supported" },
  { key: "marketplace", title: "Marketplace", subtitle: "Freelance platforms and job boards" },
  { key: "direct", title: "Direct hire", subtitle: "You recruit and employ on your own" },
] as const;

// Rows are phrased so a check always means "this is handled for you".
const MODEL_ROWS: { label: string; cells: [ModelCell, ModelCell, ModelCell] }[] = [
  { label: "Candidates found for you", cells: [{ verdict: "yes", text: "Recruiters source them" }, { verdict: "no", text: "You post and sort applicants" }, { verdict: "no", text: "You advertise and sort" }] },
  { label: "Screening and interviews handled", cells: [{ verdict: "yes", text: "Screened before you meet them" }, { verdict: "no", text: "You screen every profile" }, { verdict: "no", text: "You run the whole process" }] },
  { label: "You make the final hiring decision", cells: [{ verdict: "yes", text: "You choose from the shortlist" }, { verdict: "yes", text: "You choose" }, { verdict: "yes", text: "You choose" }] },
  { label: "Support after the VA starts", cells: [{ verdict: "yes", text: "Client Success check-ins" }, { verdict: "partial", text: "Platform support only" }, { verdict: "no", text: "On your own" }] },
  { label: "Help if the match doesn't work", cells: [{ verdict: "yes", text: "Recovery and replacement support" }, { verdict: "no", text: "Start the search again" }, { verdict: "no", text: "Start the search again" }] },
  { label: "What you pay", cells: [{ verdict: "info", text: "VA rate + service fee, quoted before you commit" }, { verdict: "info", text: "VA rate + platform fees" }, { verdict: "info", text: "VA rate + your recruiting time" }] },
  { label: "Best for", cells: [{ verdict: "info", text: "Businesses that want vetted candidates and hiring support" }, { verdict: "info", text: "Experienced hirers" }, { verdict: "info", text: "Businesses that want to manage directly" }] },
];

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === "yes") return <CheckCircle2 className="hs-v hs-v-yes" size={17} aria-label="Yes" />;
  if (verdict === "partial") return <CircleMinus className="hs-v hs-v-partial" size={17} aria-label="Partly" />;
  if (verdict === "no") return <CircleX className="hs-v hs-v-no" size={17} aria-label="No" />;
  return null;
}

export function HiringModelsSection({ bookingUrl }: { bookingUrl: string }) {
  return (
    <section className="hs-section hs-band-white" aria-labelledby="hs-models-title">
      <div className="container">
        <div className="hs-head">
          <Kicker>Clearer choices. A better hiring experience.</Kicker>
          <h2 className="hs-h2" id="hs-models-title">Hiring a <span className="hs-accent">Filipino</span> Virtual Assistant: Agency vs Marketplace vs Direct Hire</h2>
          <p className="hs-lede">Three ways to hire. Here&apos;s what each one leaves on your plate, and where we fit in.</p>
        </div>

        <div className="hs-models">
          <div className="hs-table-wrap">
            <table className="hs-table">
              <caption className="sr-only">Comparison of agency (recruiter-supported), marketplace, and direct hire</caption>
              <thead>
                <tr>
                  <td aria-hidden="true" />
                  {MODEL_COLUMNS.map((column, index) => (
                    <th scope="col" key={column.key} className={index === 0 ? "hs-managed" : undefined}>
                      {index === 0 ? <span className="hs-recommended">Recommended</span> : null}
                      <strong>{column.title}</strong>
                      <small>{column.subtitle}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODEL_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.cells.map((cell, index) => (
                      <td key={index} className={index === 0 ? "hs-managed" : undefined}>
                        <span className={`hs-cell hs-cell-${cell.verdict}`}><VerdictIcon verdict={cell.verdict} />{cell.text}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td aria-hidden="true" />
                  <td className="hs-managed hs-managed-foot"><Link className="hs-btn hs-btn-primary" href={bookingUrl}>Book a discovery call <ArrowRight size={16} /></Link></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="hs-models-cards">
            {MODEL_COLUMNS.map((column, columnIndex) => (
              <article className={`hs-model-card${columnIndex === 0 ? " is-managed" : ""}`} key={column.key}>
                {columnIndex === 0 ? <span className="hs-recommended">Recommended</span> : null}
                <h3>{column.title}</h3>
                <p className="hs-model-sub">{column.subtitle}</p>
                <ul>
                  {MODEL_ROWS.map((row) => (
                    <li key={row.label}>
                      <VerdictIcon verdict={row.cells[columnIndex].verdict} />
                      <span><small>{row.label}</small>{row.cells[columnIndex].text}</span>
                    </li>
                  ))}
                </ul>
                {columnIndex === 0 ? <Link className="hs-btn hs-btn-primary" href={bookingUrl}>Book a discovery call <ArrowRight size={16} /></Link> : null}
              </article>
            ))}
          </div>

          <div className="hs-approach">
            <div>
              <h3>We make hiring simpler and safer.</h3>
              <p>VirtualAssistant.com.ph is a recruiter-supported option. You get screened candidates, hiring guidance, and ongoing support, without having to source, interview, and manage everything on your own.</p>
            </div>
            <Link className="hs-link" href="/managed-vs-direct-hire">Compare managed vs. direct hire in detail <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Talent                                                                  */
/* -------------------------------------------------------------------------- */

export function TalentSection({ talent }: { talent: FeaturedVa[] }) {
  return (
    <section className="hs-section hs-band-soft" aria-labelledby="hs-talent-title">
      <div className="container">
        <div className="hs-head hs-head-row">
          <div>
            <Kicker>Most experienced approved talent</Kicker>
            <h2 className="hs-h2" id="hs-talent-title">Meet experienced Filipino virtual assistants.</h2>
            <p className="hs-lede">Browse examples of approved talent. Your recruiter confirms current fit and availability before presenting anyone to you.</p>
          </div>
          <Link className="hs-btn hs-btn-ghost" href="/find-talent">Browse all talent <ArrowRight size={16} /></Link>
        </div>

        {talent.length ? (
          <div className="hs-talent-grid">
            {talent.map((va) => (
              <article className="hs-talent-card" key={va.user_id}>
                <div className="hs-talent-top">
                  <PublicAvatar name={va.full_name} src={va.avatar_url} />
                  <div className="hs-talent-badges">
                    <span className="hs-badge hs-badge-green"><BadgeCheck size={13} aria-hidden="true" /> Approved</span>
                    {va.years_experience ? <span className="hs-badge hs-badge-blue"><BriefcaseBusiness size={13} aria-hidden="true" /> {va.years_experience}+ yrs</span> : null}
                  </div>
                </div>
                <h3>{va.full_name}</h3>
                <p className="hs-talent-role">{va.headline || va.primary_category || "Virtual Assistant"}</p>
                <div className="hs-tags">
                  {mergeUniqueStrings(va.primary_category, va.categories).slice(0, 2).map((tag, index) => (
                    <span key={`${tag}-${index}`}>{tag}</span>
                  ))}
                </div>
                <div className="hs-facts">
                  <span><Clock3 size={14} aria-hidden="true" /> {va.weekly_hours ? `${va.weekly_hours} hrs/week available` : "Flexible availability"}</span>
                  {va.hourly_rate ? <span><CheckCircle2 size={14} aria-hidden="true" /> ${Number(va.hourly_rate).toFixed(0)}/hr preferred</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="hs-empty">Approved public profiles will appear here as experienced talent becomes available.</div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. How it works                                                            */
/* -------------------------------------------------------------------------- */

const STEPS: { title: string; copy: string; icon: Icon }[] = [
  { title: "Tell us the role", copy: "Share responsibilities, schedule, timezone, tools, budget, and what success should look like.", icon: ClipboardCheck },
  { title: "We recruit and vet", copy: "Recruiters review experience, practical skills, communication, availability, and role fit.", icon: SearchCheck },
  { title: "Review the shortlist", copy: "Interview a focused group of client-ready candidates and choose who you want to hire.", icon: CalendarCheck2 },
  { title: "We manage the launch", copy: "Managed placements continue with onboarding, Client Success check-ins, monitoring, and support.", icon: Headphones },
];

export function HowItWorksSection() {
  return (
    <section className="hs-section hs-band-white" aria-labelledby="hs-process-title">
      <div className="container">
        <div className="hs-head hs-head-center">
          <Kicker>How it works</Kicker>
          <h2 className="hs-h2" id="hs-process-title">From hiring brief to a <span className="hs-accent">supported placement.</span></h2>
          <p className="hs-lede">One managed workflow connects role design, recruiting, interviews, launch, and Client Success.</p>
        </div>

        <ol className="hs-steps">
          {STEPS.map(({ title, copy, icon }, index) => (
            <li className="hs-step" key={title}>
              <div className="hs-step-top">
                <Chip icon={icon} tone={index} size={22} />
                <span className="hs-step-num" aria-hidden="true">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>

        <div className="hs-process-links">
          <Link className="hs-link" href="/about">About VirtualAssistant.com.ph <ArrowRight size={14} /></Link>
          <Link className="hs-link" href="/how-vetting-works">See the vetting process <ArrowRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Industries                                                              */
/* -------------------------------------------------------------------------- */

const FEATURED_INDUSTRIES: { slug: string; icon: Icon }[] = [
  { slug: "small-business", icon: Store },
  { slug: "startups", icon: Rocket },
  { slug: "ecommerce-stores", icon: ShoppingCart },
  { slug: "real-estate-agents", icon: Home },
  { slug: "healthcare-dental", icon: HeartPulse },
  { slug: "law-firms", icon: Scale },
  { slug: "accountants-cpas", icon: Calculator },
  { slug: "professional-services-growth", icon: BriefcaseBusiness },
];

const MORE_INDUSTRY_SLUGS = ["home-local-services", "property-management-companies", "insurance-agencies", "financial-advisors", "coaches", "construction-companies", "ndis-providers", "therapists"];

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function IndustriesSection() {
  const featured = FEATURED_INDUSTRIES
    .map(({ slug, icon }) => ({ industry: INDUSTRIES.find((item) => item.slug === slug), icon }))
    .filter((item): item is { industry: (typeof INDUSTRIES)[number]; icon: Icon } => Boolean(item.industry));
  const more = MORE_INDUSTRY_SLUGS.map((slug) => INDUSTRIES.find((item) => item.slug === slug)).filter((item): item is (typeof INDUSTRIES)[number] => Boolean(item));

  return (
    <section className="hs-section hs-band-soft" aria-labelledby="hs-industries-title">
      <div className="container">
        <div className="hs-head hs-head-row">
          <div>
            <Kicker>Supporting businesses across industries</Kicker>
            <h2 className="hs-h2" id="hs-industries-title">Filipino Virtual Assistants for Growing Businesses</h2>
            <p className="hs-lede">A good VA for a dental clinic and a good VA for an online store do very different work. We screen for the workflows, tools, and customer expectations of your industry, not just a job title.</p>
          </div>
          <Link className="hs-link" href="/industries">View all {INDUSTRIES.length} industries <ArrowRight size={14} /></Link>
        </div>

        <div className="hs-industry-grid">
          {featured.map(({ industry, icon }, index) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className="hs-industry">
              <div className="hs-industry-top">
                <Chip icon={icon} tone={index} size={20} />
                <ArrowRight className="hs-tile-arrow" size={15} aria-hidden="true" />
              </div>
              <strong>{industry.label}</strong>
              <span className="hs-industry-label">Common work</span>
              <ul>
                {industry.workflows.slice(0, 3).map((workflow) => <li key={workflow}>{capitalise(workflow)}</li>)}
              </ul>
            </Link>
          ))}
        </div>

        <div className="hs-industry-more">
          <span>Also hiring for</span>
          <div>
            {more.map((industry) => <Link key={industry.slug} href={`/industries/${industry.slug}`}>{industry.label}</Link>)}
          </div>
          <Link className="hs-link" href="/hire">Not listed? Tell us the work <ArrowRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Savings calculator                                                      */
/* -------------------------------------------------------------------------- */

export function SavingsSection() {
  return (
    <section className="hs-section hs-band-white" aria-labelledby="hs-savings-title">
      <div className="container">
        <div className="hs-head hs-head-center">
          <Kicker>Cost comparison</Kicker>
          <h2 className="hs-h2" id="hs-savings-title">See what a virtual assistant <span className="hs-accent">could save you.</span></h2>
          <p className="hs-lede">Compare the estimated base labour cost of a Filipino virtual assistant with a local hire using your own hours and hourly rates. The calculator keeps agency fees and other overhead separate so the comparison stays transparent.</p>
        </div>
        <div className="hs-calc-card"><VaCostCalculator /></div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. FAQ                                                                     */
/* -------------------------------------------------------------------------- */

export function FaqSection({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <section className="hs-section hs-band-soft" id="faq" aria-labelledby="hs-faq-title">
      <div className="container hs-faq">
        <div className="hs-faq-intro">
          <Kicker>Questions, answered</Kicker>
          <h2 className="hs-h2" id="hs-faq-title">What to know before you hire a Filipino Virtual Assistant.</h2>
          <p className="hs-lede">Clear answers to the questions clients ask before sending a hiring brief.</p>
          <Link className="hs-link" href="/faq">View all FAQs <ArrowRight size={14} /></Link>
        </div>
        <div className="hs-faq-list">
          {faqs.map(([question, answer], index) => (
            <details className="hs-faq-item" key={question} open={index === 0}>
              <summary>{question}<span className="hs-faq-toggle" aria-hidden="true"><Plus size={15} /></span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. Final CTA                                                               */
/* -------------------------------------------------------------------------- */

export function FinalCtaSection({ bookingUrl }: { bookingUrl: string }) {
  return (
    <section className="hs-section hs-band-white" aria-labelledby="hs-cta-title">
      <div className="container">
        <div className="hs-cta">
          <Kicker>Ready when you are</Kicker>
          <h2 id="hs-cta-title">Ready to stop doing everything yourself?</h2>
          <p>Tell us what you need help with and we will look for Filipino virtual assistants whose skills, experience, schedule, and working style fit your business.</p>
          <div className="hs-cta-actions">
            <Link className="hs-btn hs-btn-light" href="/hire">Get your free VA match <ArrowRight size={16} /></Link>
            <Link className="hs-btn hs-btn-outline-light" href={bookingUrl}>Discuss your VA needs</Link>
          </div>
          <div className="hs-cta-proof">
            <span><Check size={14} aria-hidden="true" /> Private brief</span>
            <span><Check size={14} aria-hidden="true" /> Human screening</span>
            <span><Check size={14} aria-hidden="true" /> Support after placement</span>
          </div>
        </div>
      </div>
    </section>
  );
}
