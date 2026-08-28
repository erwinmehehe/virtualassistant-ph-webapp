import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
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

export default function ServicesPage(){return <><SiteHeader/><main id="main-content">
  <section className="section public-hero-small"><div className="container"><div className="public-page-head"><h1 className="public-page-title">Find the VA role that matches the work you need done.</h1><p className="public-lede">Start with the workload, not a generic job title. Browse role-specific guides for responsibilities, tools, interview questions, and hiring criteria.</p><div className="row wrap"><Link className="btn btn-primary btn-lg" href="/hire">Get a managed VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/find-talent">Browse VAs</Link></div></div></div></section>

  <section className="service-directory-intro"><div className="container"><nav className="service-category-nav" aria-label="Service categories">{SERVICE_CATEGORIES.map((category)=><a href={`#${category.id}`} key={category.id}>{category.label}</a>)}</nav><div className="service-role-help"><div><Search size={20}/><span><strong>Not sure which role fits?</strong><small>Describe what is falling behind and we will help you narrow the role.</small></span></div><Link className="btn btn-primary" href="/hire">Get a managed VA <ArrowRight size={15}/></Link></div></div></section>

  {SERVICE_CATEGORIES.map((category, index)=>{
    const pages = SERVICE_PAGES.filter((page)=>category.groups.some((group)=>group === page.group));
    return <section className={`section service-category-section ${index % 2 ? "section-white" : ""}`} id={category.id} key={category.id}><div className="container"><div className="section-head"><h2>{category.label}</h2><p>{category.description} Choose the closest workload, then use the narrower role guide to define tasks, tools, and interview criteria.</p></div><div className="grid-3">{pages.map((page)=><Link className="card card-hover specialty-card service-seo-card" href={`/service/${page.slug}`} key={page.slug}><h3>{page.name}</h3><p className="muted small">{page.focus.charAt(0).toUpperCase()+page.focus.slice(1)}.</p><div className="pill-list">{page.tasks.slice(0,2).map((task)=><span className="badge" key={task}>{task}</span>)}</div><span className="text-link">View hiring guide <ArrowRight size={14}/></span></Link>)}</div></div></section>;
  })}

  <section className="section section-white services-bottom-cta"><div className="container row-between wrap"><div><h2>Still comparing roles?</h2><p className="muted">Send the workload instead of guessing the title. Your request stays private until you review it.</p></div><div className="row wrap"><Link className="btn btn-primary" href="/hire">Get a managed VA</Link><Link className="btn" href="/pricing">See pricing</Link></div></div></section>
</main><SiteFooter/></>}
