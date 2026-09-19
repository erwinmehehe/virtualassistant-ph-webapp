import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ClipboardList, Search, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata={title:"Free Virtual Assistant Hiring Tools",description:"Free VA cost, budget, job description, and role-finder tools for businesses hiring virtual assistants from the Philippines.",alternates:{canonical:canonicalPath("/tools")}};
const tools=[
  [Calculator,"VA Cost Calculator","Estimate monthly VA cost and compare it with a local hourly cost.","/tools/virtual-assistant-cost-calculator"],
  [WalletCards,"Hourly to Monthly Calculator","Turn an hourly VA rate into weekly, monthly, and annual budget estimates.","/tools/virtual-assistant-hourly-to-monthly-calculator"],
  [ClipboardList,"VA Job Description Generator","Build a clear first draft with tasks, tools, hours, and success measures.","/tools/virtual-assistant-job-description-generator"],
  [Search,"What Type of VA Do I Need?","Start with the workload and get pointed to the closest service page.","/tools/what-type-of-va-do-i-need"]
] as const;

export default function ToolsPage(){return <><SiteHeader/><main id="main-content">
  <CompactPageHeader
    eyebrow="Free Virtual Assistant planning tools"
    title={<h1>Plan the role before you post it.</h1>}
    description={<p>Go straight to the calculator, job-description builder, or role finder you need.</p>}
    actions={<><Link className="btn btn-primary" href="/tools/virtual-assistant-cost-calculator">Estimate VA cost <ArrowRight size={16}/></Link><Link className="btn" href="/tools/what-type-of-va-do-i-need">Find the right VA role</Link></>}
  />
  <section className="section section-white"><div className="container"><div className="tools-grid">{tools.map(([Icon,title,desc,href])=><Link className="tool-card" href={href} key={href} data-track="tool_open"><div className="tool-card-icon"><Icon size={22}/></div><h2>{title}</h2><p>{desc}</p><strong>Open tool <ArrowRight size={14}/></strong></Link>)}</div></div></section>
</main><SiteFooter/></>}
