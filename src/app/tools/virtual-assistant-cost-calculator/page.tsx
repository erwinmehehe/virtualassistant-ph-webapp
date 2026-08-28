import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VaCostCalculator } from "@/components/va-tools";
export const metadata:Metadata={title:"Virtual Assistant Cost Calculator",description:"Estimate a virtual assistant's monthly cost by hourly rate and weekly hours, then compare it with a local hiring cost.",alternates:{canonical:"/tools/virtual-assistant-cost-calculator/"}};
export default function Page(){return <><SiteHeader/><main id="main-content"><section className="tool-page-hero"><div className="container"><nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/tools">Tools</Link><span>/</span><span>VA Cost Calculator</span></nav><div className="public-page-head"><h1 className="public-page-title">Virtual Assistant Cost Calculator</h1><p className="public-lede">Estimate monthly VA compensation and compare it with an illustrative local hiring cost. The VA rate cannot be set below the $5.00/hour marketplace floor.</p></div><VaCostCalculator/></div></section></main><SiteFooter/></>}
