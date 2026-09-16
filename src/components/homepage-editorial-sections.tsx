import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Headphones,
  HeartPulse,
  Home,
  MessageCircle,
  MoreHorizontal,
  Rocket,
  Scale,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import styles from "./homepage-editorial-sections.module.css";

const serviceAreas = [
  { label: "Executive Assistance", href: "/service/general-virtual-assistant", icon: BriefcaseBusiness },
  { label: "Customer Support", href: "/service/customer-service-virtual-assistant", icon: Headphones },
  { label: "Ecommerce Support", href: "/service/ecommerce", icon: ShoppingCart },
  { label: "Bookkeeping & Accounting", href: "/service/bookkeeping", icon: Calculator },
  { label: "Digital Marketing", href: "/service/digital-marketing-virtual-assistant", icon: BarChart3 },
  { label: "Real Estate Support", href: "/service/real-estate", icon: Home },
  { label: "Lead Generation", href: "/service/lead-generation", icon: Users },
  { label: "Social Media Management", href: "/service/social-media", icon: MessageCircle },
  { label: "And More", href: "/services", icon: MoreHorizontal },
] as const;

const audiences = [
  { label: "Small Businesses", href: "/industries/small-business", icon: Store },
  { label: "Startups", href: "/industries/startups", icon: Rocket },
  { label: "Agencies", href: "/industries/professional-services-growth", icon: Users },
  { label: "Ecommerce Stores", href: "/industries/ecommerce-stores", icon: ShoppingCart },
  { label: "Real Estate Companies", href: "/industries/real-estate-agents", icon: Home },
  { label: "Healthcare Practices", href: "/industries/healthcare-dental", icon: HeartPulse },
  { label: "Law Firms", href: "/industries/law-firms", icon: Scale },
  { label: "Professional Services", href: "/industries/professional-services-growth", icon: BriefcaseBusiness },
] as const;

const comparisonRows = [
  ["Who sources the VA?", "You", "You", "We do"],
  ["Screening and interviews", "You", "You", "We handle this"],
  ["You employ and manage the VA", "Yes", "Yes", "No, we support"],
  ["Ongoing support", "Limited", "None", "Yes"],
  ["Best for", "Experienced hirers", "Businesses that want to manage directly", "Businesses that want vetted candidates and hiring support"],
] as const;

export function HomepageEditorialSections() {
  return (
    <div className={styles.wrap}>
      <section className={styles.servicesSection} aria-labelledby="va-services-philippines-title">
        <div className={styles.servicesLayout}>
          <div className={styles.servicesCopy}>
            <span className={styles.kicker}>More than tasks. Real business support.</span>
            <h2 id="va-services-philippines-title">Virtual Assistant Services in the Philippines</h2>
            <p>Filipino virtual assistants support businesses with recurring administrative, operational, customer service, and marketing work that does not need to remain with an owner or local employee.</p>
            <p>At VirtualAssistant.com.ph, we match businesses with virtual assistants based on the actual work they need handled rather than simply forwarding a list of applicants. Candidates can be screened for relevant experience, tools, communication skills, working hours, and timezone overlap before you spend time interviewing.</p>
            <p>You can hire support for executive assistance, customer service, ecommerce operations, bookkeeping, lead generation, digital marketing, real estate support, and other remote business functions.</p>
            <Link className={styles.primaryButton} href="/services">Explore Our Services <ArrowRight size={15} /></Link>
          </div>

          <div className={styles.serviceTiles} aria-label="Virtual Assistant service areas">
            {serviceAreas.map(({ label, href, icon: Icon }, index) => (
              <Link key={label} href={href} className={styles.serviceTile}>
                <span className={`${styles.serviceIcon} ${styles[`serviceIcon${(index % 4) + 1}`]}`}><Icon size={24} /></span>
                <strong>{label}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.comparisonSection} aria-labelledby="hiring-models-title">
        <div className={styles.comparisonHead}>
          <span className={styles.kicker}>Clearer choices. A better hiring experience.</span>
          <h2 id="hiring-models-title">Hiring a Filipino Virtual Assistant: Agency vs Marketplace vs Direct Hire</h2>
          <p>Different hiring paths. Here&apos;s how they compare, and where we fit in.</p>
        </div>

        <div className={styles.comparisonLayout}>
          <div className={styles.comparisonTable} role="table" aria-label="Hiring model comparison">
            <div className={`${styles.comparisonRow} ${styles.comparisonHeader}`} role="row">
              <span role="columnheader"></span>
              <strong role="columnheader">Marketplace</strong>
              <strong role="columnheader">Direct Hire</strong>
              <strong role="columnheader" className={styles.managedHeader}>Managed / Recruiter-Supported</strong>
            </div>
            {comparisonRows.map(([label, marketplace, direct, managed]) => (
              <div className={styles.comparisonRow} role="row" key={label}>
                <strong role="rowheader">{label}</strong>
                <span role="cell">{marketplace}</span>
                <span role="cell">{direct}</span>
                <span role="cell" className={styles.managedCell}>{managed}</span>
              </div>
            ))}
          </div>

          <aside className={styles.approachCard}>
            <span className={styles.approachLabel}>Our approach</span>
            <h3>We make hiring simpler and safer.</h3>
            <p>VirtualAssistant.com.ph is a recruiter-supported option. You get screened candidates, hiring guidance, and ongoing support, without having to source, interview, and manage everything on your own.</p>
            <Link className={styles.primaryButton} href="/book-client-call">Book a Discovery Call <ArrowRight size={15} /></Link>
          </aside>
        </div>
      </section>

      <section className={styles.industriesSection} aria-labelledby="who-we-help-title">
        <div className={styles.industriesHead}>
          <span className={styles.kicker}>Supporting businesses across industries</span>
          <h2 id="who-we-help-title">Filipino Virtual Assistants for Growing Businesses</h2>
          <p>We help businesses of all sizes find the right Filipino talent.</p>
        </div>

        <div className={styles.industryTiles}>
          {audiences.map(({ label, href, icon: Icon }, index) => (
            <Link key={label} href={href} className={styles.industryTile}>
              <span className={`${styles.industryIcon} ${styles[`industryIcon${(index % 4) + 1}`]}`}><Icon size={23} /></span>
              <strong>{label}</strong>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ))}
        </div>

        <Link className={styles.viewAll} href="/industries">View all industries <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}
