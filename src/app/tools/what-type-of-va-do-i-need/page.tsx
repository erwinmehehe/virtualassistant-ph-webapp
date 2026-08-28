import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RoleFinder } from "@/components/va-tools";
export const metadata:Metadata={title:"What Type of Virtual Assistant Do I Need?",description:"Choose the workload that is falling behind and get pointed to the closest VA service, role guide, and hiring path.",alternates:{canonical:"/tools/what-type-of-va-do-i-need"}};
export default function Page(){return <><SiteHeader/><main id="main-content"><section className="tool-page-hero"><div className="container"><nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/tools">Tools</Link><span>/</span><span>Role finder</span></nav><div className="public-page-head"><h1 className="public-page-title">What type of virtual assistant do I need?</h1><p className="public-lede">Start with the work that is falling behind. The title comes second.</p></div><RoleFinder/></div></section></main><SiteFooter/></>}
