import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ClipboardList, Search, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata={title:"Free Virtual Assistant Hiring Tools",description:"Free VA cost, budget, job description, and role-finder tools for businesses hiring virtual assistants from the Philippines.",alternates:{canonical:"/tools/"}};
const tools=[
  [Calculator,"VA Cost Calculator","Estimate monthly VA cost and compare it with a local hourly cost.","/tools/virtual-assistant-cost-calculator"],
  [WalletCards,"Hourly to Monthly Calculator","Turn an hourly VA rate into weekly, monthly, and annual budget estimates.","/tools/virtual-assistant-hourly-to-monthly-calculator"],
  [ClipboardList,"VA Job Description Generator","Build a clear first draft with tasks, tools, hours, success measures, and the $5 floor.","/tools/virtual-assistant-job-description-generator"],
  [Search,"What Type of VA Do I Need?","Start with the workload and get pointed to the closest service page.","/tools/what-type-of-va-do-i-need"]
] as const;
export default function ToolsPage(){return <><SiteHeader/><main id="main-content"><section className="public-hero-small"><div className="container"><div className="public-page-head"><h1 className="public-page-title">Plan the role before you post it.</h1><p className="public-lede">Use simple calculators and templates to turn a vague need into a clearer budget, job description, and VA role.</p></div></div></section><section className="section section-white"><div className="container"><div className="tools-grid">{tools.map(([Icon,title,desc,href])=><Link className="tool-card" href={href} key={href} data-track="tool_open"><div className="tool-card-icon"><Icon size={22}/></div><h2>{title}</h2><p>{desc}</p><strong>Open tool <ArrowRight size={14}/></strong></Link>)}</div></div></section></main><SiteFooter/></>}
