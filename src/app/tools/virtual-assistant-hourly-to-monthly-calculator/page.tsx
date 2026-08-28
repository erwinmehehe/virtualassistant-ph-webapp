import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HourlyMonthlyCalculator } from "@/components/va-tools";
import { canonicalPath } from "@/lib/seo-url";
export const metadata:Metadata={title:"VA Hourly to Monthly Cost Calculator",description:"Convert a virtual assistant hourly rate and weekly hours into weekly, monthly, and annual budget estimates.",alternates:{canonical:canonicalPath("/tools/virtual-assistant-hourly-to-monthly-calculator")}};
export default function Page(){return <><SiteHeader/><main id="main-content"><section className="tool-page-hero"><div className="container"><nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/tools">Tools</Link><span>/</span><span>Hourly to monthly</span></nav><div className="public-page-head"><h1 className="public-page-title">VA Hourly to Monthly Calculator</h1><p className="public-lede">Turn an hourly rate into a realistic weekly, monthly, and annual planning number using 52 weeks divided across 12 months.</p></div><HourlyMonthlyCalculator/></div></section></main><SiteFooter/></>}
