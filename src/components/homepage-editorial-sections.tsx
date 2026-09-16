import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import styles from "./homepage-editorial-sections.module.css";

const audiences = [
  {
    label: "Small businesses",
    href: "/industries/small-business",
    copy: "Owners who need recurring admin, customer follow-up, research, invoicing support, and day-to-day coordination taken off their plate.",
  },
  {
    label: "Startups",
    href: "/industries/startups",
    copy: "Founder-led teams that need flexible support across operations, customer follow-up, research, recruiting admin, and project coordination.",
  },
  {
    label: "Agencies",
    href: "/industries/professional-services-growth",
    copy: "Client-service and growth teams that need dependable delivery support without adding another local hire for every new account.",
  },
  {
    label: "Ecommerce stores",
    href: "/industries/ecommerce-stores",
    copy: "Stores and DTC brands that need help with listings, orders, customer service, returns, inventory coordination, and storefront operations.",
  },
  {
    label: "Real estate companies",
    href: "/industries/real-estate-agents",
    copy: "Agents and brokerages that need lead follow-up, CRM upkeep, listing administration, scheduling, and transaction support.",
  },
  {
    label: "Healthcare practices",
    href: "/industries/healthcare-dental",
    copy: "Healthcare and dental teams that need non-clinical support for scheduling, reminders, referrals, records coordination, and front-desk workflows.",
  },
  {
    label: "Law firms",
    href: "/industries/law-firms",
    copy: "Firms that need client intake, calendar support, matter administration, document organization, billing admin, and follow-up handled consistently.",
  },
  {
    label: "Professional services",
    href: "/industries/professional-services-growth",
    copy: "Consultants, advisors, and service businesses that need executive support, CRM upkeep, client onboarding, reporting, and project coordination.",
  },
] as const;

export function HomepageEditorialSections() {
  return (
    <div className={styles.wrap}>
      <section className={styles.editorialSection} aria-labelledby="va-services-philippines-title">
        <div className={styles.editorialGrid}>
          <div className={styles.headingBlock}>
            <span className={styles.kicker}>Virtual Assistant Philippines</span>
            <h2 id="va-services-philippines-title">Virtual Assistant Services in the Philippines</h2>
            <p>Build the role around the work that actually needs to leave your desk.</p>
          </div>
          <div className={styles.editorialCopy}>
            <p>Filipino virtual assistants support businesses with recurring administrative, operational, customer service, sales, finance, ecommerce, and marketing work that does not need to remain with an owner or local employee.</p>
            <p>At VirtualAssistant.com.ph, we match businesses with virtual assistants based on the actual work they need handled rather than simply forwarding a list of applicants. Candidates can be screened for relevant experience, tools, communication skills, working hours, and timezone overlap before you spend time interviewing.</p>
            <p>You can hire support for executive assistance, customer service, ecommerce operations, bookkeeping, lead generation, digital marketing, real estate support, healthcare administration, legal support, and other remote business functions. The goal is not to add another generic assistant. It is to define repeatable ownership, match the right person to it, and make the handoff easier to manage.</p>
            <div className={styles.inlineActions}>
              <Link href="/services">Explore Virtual Assistant services <ArrowRight size={15} /></Link>
              <Link href="/hire">Tell us what you need <ArrowRight size={15} /></Link>
            </div>
            <p className={styles.proofLine}><CheckCircle2 size={17} /> Recruiters screen candidates before client presentation. You review the shortlist and make the final hiring decision.</p>
          </div>
        </div>
      </section>

      <section className={styles.hiringModels} aria-labelledby="hiring-models-title">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Compare your hiring options</span>
          <h2 id="hiring-models-title">Hiring a Filipino Virtual Assistant: Agency vs Marketplace vs Direct Hire</h2>
          <p>The biggest difference is not where the VA is located. It is who owns sourcing, screening, hiring administration, and post-placement support.</p>
        </div>

        <div className={styles.modelRows}>
          <article>
            <span>01</span>
            <div>
              <h3>Marketplace</h3>
              <p>You search the database, review applicants, screen skills, run interviews, check fit, and manage the hire yourself. This gives you the most control over sourcing, but it also puts the most work on your team.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Direct hire</h3>
              <p>You employ or contract with the Virtual Assistant directly and manage the working relationship yourself. Recruiting support can reduce the sourcing and screening workload, but your team owns the placement after the hire.</p>
            </div>
          </article>
          <article className={styles.featuredModel}>
            <span>03</span>
            <div>
              <h3>Managed / recruiter-supported</h3>
              <p>You receive screened candidates and hiring support instead of starting from an open marketplace. Your team still chooses the person and directs the day-to-day work, while recruiting and Client Success support the placement around the hire.</p>
            </div>
          </article>
        </div>

        <div className={styles.positioning}>
          <div>
            <strong>Where VirtualAssistant.com.ph fits</strong>
            <p>Our default approach is recruiter-supported hiring with screened candidates and post-placement Client Success. Direct hire is also available when you want us to recruit and screen the VA but your team wants to take over after placement.</p>
          </div>
          <div className={styles.inlineActions}>
            <Link href="/managed-vs-direct-hire">Compare managed vs direct hire <ArrowRight size={15} /></Link>
            <Link href="/pricing">See pricing <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className={styles.whoHelp} aria-labelledby="who-we-help-title">
        <div className={styles.whoGrid}>
          <div className={styles.headingBlock}>
            <span className={styles.kicker}>Who we help</span>
            <h2 id="who-we-help-title">Filipino Virtual Assistants for Growing Businesses</h2>
            <p>Different businesses delegate different workflows. Start with the industry closest to your operating model, then define the role around the actual recurring work.</p>
            <Link className={styles.viewAll} href="/industries">View all industries <ArrowRight size={15} /></Link>
          </div>
          <div className={styles.audienceLinks}>
            {audiences.map((audience) => (
              <Link key={audience.label} href={audience.href}>
                <span>
                  <strong>{audience.label}</strong>
                  <small>{audience.copy}</small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
