import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import styles from "./homepage-editorial-sections.module.css";

const serviceAreas = [
  "Executive & admin support",
  "Customer service",
  "Ecommerce operations",
  "Bookkeeping & finance admin",
  "Lead generation",
  "Digital marketing",
  "Real estate support",
  "Healthcare & legal admin",
] as const;

const audiences = [
  {
    label: "Small businesses",
    href: "/industries/small-business",
    copy: "Admin, follow-up, research, invoicing, and daily coordination.",
  },
  {
    label: "Startups",
    href: "/industries/startups",
    copy: "Flexible operations, customer, recruiting, and project support.",
  },
  {
    label: "Agencies",
    href: "/industries/professional-services-growth",
    copy: "Reliable delivery capacity as client work grows.",
  },
  {
    label: "Ecommerce stores",
    href: "/industries/ecommerce-stores",
    copy: "Listings, orders, returns, customer care, and store operations.",
  },
  {
    label: "Real estate companies",
    href: "/industries/real-estate-agents",
    copy: "Lead follow-up, CRM upkeep, listings, and transaction support.",
  },
  {
    label: "Healthcare practices",
    href: "/industries/healthcare-dental",
    copy: "Non-clinical scheduling, reminders, referrals, and front desk support.",
  },
  {
    label: "Law firms",
    href: "/industries/law-firms",
    copy: "Intake, calendars, matter admin, documents, and billing support.",
  },
  {
    label: "Professional services",
    href: "/industries/professional-services-growth",
    copy: "Executive support, CRM, onboarding, reporting, and coordination.",
  },
] as const;

const hiringModels = [
  {
    number: "01",
    label: "Marketplace",
    eyebrow: "You own the search",
    copy: "You search the database, review applicants, screen skills, run interviews, check fit, and manage the hire yourself. You get broad access, but your team carries the sourcing and screening workload.",
    featured: false,
  },
  {
    number: "02",
    label: "Direct hire",
    eyebrow: "You own the placement",
    copy: "Recruiting support can reduce the sourcing and screening work, then you employ or contract with the Virtual Assistant directly and manage the working relationship after placement.",
    featured: false,
  },
  {
    number: "03",
    label: "Managed / recruiter-supported",
    eyebrow: "Screening + hiring support",
    copy: "You receive screened candidates instead of starting from an open marketplace. You still choose the person and direct the day-to-day work, while recruiting and Client Success support the placement around the hire.",
    featured: true,
  },
] as const;

export function HomepageEditorialSections() {
  return (
    <div className={styles.wrap}>
      <section className={`${styles.editorialSection} ${styles.servicesSection}`} aria-labelledby="va-services-philippines-title">
        <div className={styles.servicesCanvas}>
          <div className={styles.headingBlock}>
            <span className={styles.kicker}>Virtual Assistant Philippines</span>
            <h2 id="va-services-philippines-title">Virtual Assistant Services in the Philippines</h2>
            <p className={styles.lede}>Build the role around the work that actually needs to leave your desk.</p>
            <div className={styles.inlineActions}>
              <Link className={styles.primaryTextLink} href="/services">Explore services <ArrowRight size={15} /></Link>
              <Link href="/hire">Tell us what you need <ArrowRight size={15} /></Link>
            </div>
          </div>

          <div className={styles.servicesContent}>
            <div className={styles.editorialCopy}>
              <p>Filipino virtual assistants support businesses with recurring administrative, operational, customer service, sales, finance, ecommerce, and marketing work that does not need to remain with an owner or local employee.</p>
              <p>At VirtualAssistant.com.ph, we match businesses with virtual assistants based on the actual work they need handled rather than simply forwarding a list of applicants. Candidates can be screened for relevant experience, tools, communication skills, working hours, and timezone overlap before you spend time interviewing.</p>
              <p>You can hire support for executive assistance, customer service, ecommerce operations, bookkeeping, lead generation, digital marketing, real estate support, healthcare administration, legal support, and other remote business functions. The goal is to define repeatable ownership, match the right person to it, and make the handoff easier to manage.</p>
            </div>

            <aside className={styles.serviceIndex} aria-label="Common Virtual Assistant service areas">
              <span className={styles.asideLabel}>Common ways teams delegate</span>
              <div className={styles.serviceList}>
                {serviceAreas.map((area, index) => (
                  <span key={area}><b>{String(index + 1).padStart(2, "0")}</b>{area}</span>
                ))}
              </div>
            </aside>
          </div>

          <div className={styles.proofLine}>
            <CheckCircle2 size={18} />
            <span><strong>Screened before presentation.</strong> Recruiters review candidates first, then you review the shortlist and make the final hiring decision.</span>
          </div>
        </div>
      </section>

      <section className={styles.hiringModels} aria-labelledby="hiring-models-title">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Choose the hiring model that fits</span>
          <h2 id="hiring-models-title">Agency vs Marketplace vs Direct Hire</h2>
          <p>The real difference is who owns sourcing, screening, hiring administration, and support after the Virtual Assistant starts.</p>
        </div>

        <div className={styles.modelGrid}>
          {hiringModels.map((model) => (
            <article key={model.label} className={model.featured ? styles.featuredModel : undefined}>
              <div className={styles.modelTopline}>
                <span className={styles.modelNumber}>{model.number}</span>
                {model.featured ? <span className={styles.fitBadge}>Where we fit</span> : null}
              </div>
              <span className={styles.modelEyebrow}>{model.eyebrow}</span>
              <h3>{model.label}</h3>
              <p>{model.copy}</p>
            </article>
          ))}
        </div>

        <div className={styles.positioning}>
          <div>
            <span className={styles.positioningLabel}>VirtualAssistant.com.ph</span>
            <strong>Recruiter-supported by default, direct hire when you want it.</strong>
            <p>Our standard approach gives you screened candidates plus post-placement Client Success. Direct hire is available when you want us to recruit and screen the VA, then hand the working relationship over to your team.</p>
          </div>
          <div className={styles.inlineActions}>
            <Link href="/managed-vs-direct-hire">Compare the two options <ArrowRight size={15} /></Link>
            <Link href="/pricing">See pricing <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className={styles.whoHelp} aria-labelledby="who-we-help-title">
        <div className={styles.whoShell}>
          <div className={styles.headingBlock}>
            <span className={styles.kicker}>Who we help</span>
            <h2 id="who-we-help-title">Filipino Virtual Assistants for Growing Businesses</h2>
            <p className={styles.lede}>Start with the business model closest to yours, then define the role around the recurring work you want someone to own.</p>
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
