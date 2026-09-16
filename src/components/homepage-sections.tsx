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
  ClipboardCheck,
  Clock3,
  Globe2,
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
  Sparkles,
  Store,
  Users,
  UsersRound,
} from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";
import { VaCostCalculator } from "@/components/va-cost-calculator";
import { mergeUniqueStrings } from "@/lib/collections";

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

const REASONS = [
  ["Fluent English", "Clear written and spoken English for clients, customers, and teams."],
  ["Attention to detail", "Careful execution means fewer mistakes and less back-and-forth."],
  ["Service-first mindset", "A strong customer-service culture built on reliability and patience."],
  ["Fast to adapt", "Used to remote work, international clients, and new systems."],
  ["Cost-effective support", "Experienced help without the fixed overhead of another local hire."],
  ["Already tool-proficient", "Google Workspace, Slack, Asana, HubSpot, Shopify, Canva, Xero, QuickBooks."],
] as const;

const STORY_POINTS = [
  ["Flexible", "Start part-time or hire for full-time availability."],
  ["Role matched", "Match skills, tools, schedule, and working style."],
  ["Human screened", "Recruiters review candidates before client presentation."],
] as const;

export function WhyPhilippinesSection({ bookingUrl }: { bookingUrl: string }) {
  const resources: [string, string][] = [
    ["Get your free VA match", "/hire"],
    ["Browse vetted Filipino VAs", "/find-talent"],
    ["Virtual Assistant services", "/services"],
    ["Virtual Assistant pricing", "/pricing"],
    ["How we vet Virtual Assistants", "/how-vetting-works"],
    ["Virtual Assistants by industry", "/industries"],
    ["Managed VA vs. direct hire", "/managed-vs-direct-hire"],
    ["Discuss your VA needs", bookingUrl],
  ];

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
            </div>
          </div>

          <aside className="hs-reasons" aria-label="What Filipino virtual assistants bring">
            <div className="hs-reasons-head">
              <Chip icon={Sparkles} tone={1} size={20} />
              <div><strong>What Filipino VAs bring</strong><small>Why teams keep hiring from the Philippines</small></div>
            </div>
            <ul className="hs-reason-list">
              {REASONS.map(([title, copy]) => (
                <li key={title}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <div><strong>{title}</strong><span>{copy}</span></div>
                </li>
              ))}
            </ul>
            <span className="hs-reasons-note"><Globe2 size={15} aria-hidden="true" /> Working hours set to overlap with AU, US, or UK time</span>
          </aside>
        </div>

        <div className="hs-points">
          {STORY_POINTS.map(([title, copy]) => (
            <div className="hs-point" key={title}><strong>{title}</strong><span>{copy}</span></div>
          ))}
        </div>

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

        <div className="hs-delegate">
          <p>If you are spending too much time on work that someone else could reliably handle, it may be time to delegate.</p>
          <Link className="hs-btn hs-btn-primary" href="/hire">Get your free VA match <ArrowRight size={16} /></Link>
        </div>

        <nav className="hs-resources" aria-label="Virtual Assistant hiring resources">
          {resources.map(([label, href]) => (
            <Link key={label} href={href}>{label} <ArrowRight size={12} aria-hidden="true" /></Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Hiring models                                                           */
/* -------------------------------------------------------------------------- */

const MODEL_ROWS = [
  ["Who sources the VA?", "You", "You", "We do"],
  ["Screening and interviews", "You", "You", "We handle this"],
  ["You employ and manage the VA", "Yes", "Yes", "No, we support"],
  ["Ongoing support", "Limited", "None", "Yes"],
  ["Best for", "Experienced hirers", "Businesses that want to manage directly", "Businesses that want vetted candidates and hiring support"],
] as const;

export function HiringModelsSection({ bookingUrl }: { bookingUrl: string }) {
  return (
    <section className="hs-section hs-band-white" aria-labelledby="hs-models-title">
      <div className="container">
        <div className="hs-head">
          <Kicker>Clearer choices. A better hiring experience.</Kicker>
          <h2 className="hs-h2" id="hs-models-title">Hiring a <span className="hs-accent">Filipino</span> Virtual Assistant: Agency vs Marketplace vs Direct Hire</h2>
          <p className="hs-lede">Different hiring paths. Here&apos;s how they compare, and where we fit in.</p>
        </div>

        <div className="hs-models">
          <div className="hs-table-wrap">
            <table className="hs-table">
              <caption className="sr-only">Comparison of marketplace, direct hire, and recruiter-supported hiring</caption>
              <thead>
                <tr>
                  <td aria-hidden="true" />
                  <th scope="col">Marketplace</th>
                  <th scope="col">Direct hire</th>
                  <th scope="col" className="hs-managed">
                    <span className="hs-recommended">Recommended</span>
                    Managed / Recruiter-Supported
                    <small>VirtualAssistant.com.ph</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODEL_ROWS.map(([label, marketplace, direct, managed]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{marketplace}</td>
                    <td>{direct}</td>
                    <td className="hs-managed">{managed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="hs-approach">
            <Kicker>Our approach</Kicker>
            <h3>We make hiring simpler and safer.</h3>
            <p>VirtualAssistant.com.ph is a recruiter-supported option. You get screened candidates, hiring guidance, and ongoing support, without having to source, interview, and manage everything on your own.</p>
            <Link className="hs-btn hs-btn-primary" href={bookingUrl}>Book a discovery call <ArrowRight size={16} /></Link>
          </aside>
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

        <ol className="hs-steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
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

        <div className="hs-support">
          <div className="hs-support-copy">
            <Kicker>Hiring is only the beginning</Kicker>
            <h3>The service continues after your new team member starts.</h3>
            <p>Recruiting gets the right person into the role. Client Success helps the placement launch well, catches problems early, and coordinates recovery or replacement when needed.</p>
            <ul className="hs-checks">
              <li><CheckCircle2 size={17} aria-hidden="true" /> Recruiting, vetting, matching, and client choice</li>
              <li><CheckCircle2 size={17} aria-hidden="true" /> Structured placement readiness and onboarding</li>
              <li><CheckCircle2 size={17} aria-hidden="true" /> Day 1 through Day 90 Client Success check-ins</li>
              <li><CheckCircle2 size={17} aria-hidden="true" /> Monitoring, recovery, and replacement support</li>
            </ul>
            <div className="hs-support-actions">
              <Link className="hs-btn hs-btn-light" href="/hire">Get your free VA match <ArrowRight size={16} /></Link>
              <Link className="hs-btn hs-btn-outline-light" href="/pricing">See transparent pricing</Link>
            </div>
          </div>

          <div className="hs-people">
            <div className="hs-person">
              <div className="hs-person-head"><span className="hs-avatar" aria-hidden="true">JA</span><div><small>Client Success Manager</small><strong>Jervis Accad</strong></div></div>
              <p>Owns the post-hire relationship, placement check-ins, early issue recovery, retention, and ongoing client success.</p>
            </div>
            <div className="hs-person">
              <div className="hs-person-head"><span className="hs-avatar" aria-hidden="true">BB</span><div><small>Operations team</small><strong>Bryan Batarina</strong></div></div>
              <p>Supports the operating workflows that keep client, recruiter, and placement activity connected.</p>
            </div>
            <div className="hs-person">
              <div className="hs-person-head"><span className="hs-avatar" aria-hidden="true"><UsersRound size={17} /></span><div><small>Approval standard</small><strong>Human review before client presentation</strong></div></div>
              <p>Client shortlists are recruiter-curated. Automated matching can suggest candidates internally, but a human decides who is presented.</p>
            </div>
          </div>
        </div>

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

const AUDIENCES: { label: string; href: string; icon: Icon }[] = [
  { label: "Small Businesses", href: "/industries/small-business", icon: Store },
  { label: "Startups", href: "/industries/startups", icon: Rocket },
  { label: "Agencies", href: "/industries/professional-services-growth", icon: Users },
  { label: "Ecommerce Stores", href: "/industries/ecommerce-stores", icon: ShoppingCart },
  { label: "Real Estate Companies", href: "/industries/real-estate-agents", icon: Home },
  { label: "Healthcare Practices", href: "/industries/healthcare-dental", icon: HeartPulse },
  { label: "Law Firms", href: "/industries/law-firms", icon: Scale },
  { label: "Professional Services", href: "/industries/professional-services-growth", icon: BriefcaseBusiness },
];

export function IndustriesSection() {
  return (
    <section className="hs-section hs-band-soft" aria-labelledby="hs-industries-title">
      <div className="container">
        <div className="hs-head">
          <Kicker>Supporting businesses across industries</Kicker>
          <h2 className="hs-h2" id="hs-industries-title">Filipino Virtual Assistants for Growing Businesses</h2>
          <p className="hs-lede">We help businesses of all sizes find the right Filipino talent.</p>
        </div>

        <div className="hs-tiles-8">
          {AUDIENCES.map(({ label, href, icon }, index) => (
            <Link key={label} href={href} className="hs-tile">
              <Chip icon={icon} tone={index} size={22} />
              <strong>{label}</strong>
              <ArrowRight className="hs-tile-arrow" size={14} aria-hidden="true" />
            </Link>
          ))}
        </div>

        <div className="hs-center-action"><Link className="hs-link" href="/industries">View all industries <ArrowRight size={14} /></Link></div>
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
