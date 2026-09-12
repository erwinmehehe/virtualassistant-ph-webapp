import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, ChevronRight, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Virtual Assistant Services Philippines",
  description: "Browse Filipino virtual assistant services by workload, including admin, sales, marketing, healthcare, ecommerce, finance, legal, real estate, creative work, and more.",
  keywords: ["virtual assistant services philippines", "hire filipino virtual assistant", "virtual assistant specialties", "outsourcing services philippines"],
  alternates: { canonical: canonicalPath("/services") }
};

const SERVICE_CATEGORIES: { id: string; label: string; description: string; groups: string[] }[] = [
  { id: "admin-executive", label: "Admin & Executive", description: "Inbox, calendar, operations, executive support, recruiting coordination, and recurring back-office work.", groups: ["Admin & Operations", "Executive Support", "People & HR"] },
  { id: "sales-customer", label: "Sales & Customer", description: "Lead follow-up, CRM upkeep, appointment setting, customer support, reception, and front-desk coverage.", groups: ["Sales & CRM", "Customer & Front Desk"] },
  { id: "marketing-creative", label: "Marketing & Creative", description: "SEO, social media, content production, design support, campaign execution, and reporting.", groups: ["Marketing & Growth", "Creative & Content"] },
  { id: "ecommerce-web", label: "Ecommerce & Web", description: "Store operations, listings, order support, marketplace administration, websites, and technical coordination.", groups: ["Ecommerce", "Technology & Web"] },
  { id: "finance-legal", label: "Finance & Legal", description: "Bookkeeping support, billing administration, insurance workflows, legal operations, and document coordination.", groups: ["Finance & Accounting", "Finance & Insurance", "Legal"] },
  { id: "healthcare", label: "Healthcare", description: "Non-clinical scheduling, reminders, intake, billing support, records coordination, and patient communication.", groups: ["Healthcare"] },
  { id: "real-estate-home", label: "Real Estate & Home", description: "Lead coordination, listings, transaction support, dispatch, estimates, customer follow-up, and field-service admin.", groups: ["Real Estate", "Home Services"] },
  { id: "hospitality", label: "Hospitality", description: "Guest messaging, reservations, calendar monitoring, vendor coordination, and property operations support.", groups: ["Hospitality"] }
];

export default function ServicesPage() {
  return <>
    <SiteHeader />
    <main id="main-content" className="premium-services-directory">
      <section className="premium-services-hero">
        <div className="container">
          <div className="premium-services-head">
            <div className="premium-services-badge"><Briefcase size={14} /> {SERVICE_PAGES.length} role hiring guides</div>
            <h1 className="premium-services-title">Find the Virtual Assistant role that matches <span>the work you need done.</span></h1>
            <p className="premium-services-lede">Start with the workload, not a generic job title. Browse role-specific guides for responsibilities, tools, interview questions, hiring criteria, and the skills worth verifying.</p>
            <div className="premium-services-actions">
              <Link className="btn btn-lg premium-service-primary" href="/hire">Hire a Virtual Assistant <ArrowRight size={16} /></Link>
              <Link className="btn btn-lg" href="/find-talent">Browse Virtual Assistants</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-services-nav-wrap">
        <div className="container">
          <nav className="service-category-nav" aria-label="Service categories">
            {SERVICE_CATEGORIES.map((category) => <a href={`#${category.id}`} key={category.id}>{category.label}</a>)}
          </nav>
          <div className="premium-services-help">
            <div><Search size={21} /><span><strong>Not sure which role fits?</strong><small>Describe what is falling behind and our recruiting team will help narrow the role.</small></span></div>
            <Link className="btn premium-service-primary" href="/hire">Send the workload <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      {SERVICE_CATEGORIES.map((category) => {
        const pages = SERVICE_PAGES.filter((page) => category.groups.some((group) => group === page.group));
        if (!pages.length) return null;
        return <section className="premium-service-category" id={category.id} key={category.id} aria-label={category.label}>
          <div className="container">
            <div className="premium-category-head">
              <h2>{category.label} <span>({pages.length} guides)</span></h2>
              <p>{category.description}</p>
            </div>
            <div className="premium-service-grid">
              {pages.map((page) => <Link className="premium-service-card" href={`/service/${page.slug}`} key={page.slug}>
                <div>
                  <h3>{page.name}</h3>
                  <p>{page.focus.charAt(0).toUpperCase() + page.focus.slice(1)}.</p>
                  <div className="pill-list">{page.tasks.slice(0, 2).map((task) => <span className="badge" key={task}>{task}</span>)}</div>
                </div>
                <span className="premium-service-link">View hiring guide <ChevronRight size={14} /></span>
              </Link>)}
            </div>
          </div>
        </section>;
      })}

      <div className="container">
        <section className="premium-services-bottom">
          <div><h2>Still comparing roles?</h2><p>Send the workload instead of guessing the title. Your request stays private until you review the next step.</p></div>
          <Link className="btn" href="/hire">Send the workload <ArrowRight size={16} /></Link>
        </section>
      </div>
    </main>
    <SiteFooter />
  </>;
}
