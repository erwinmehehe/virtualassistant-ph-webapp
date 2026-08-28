import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobDescriptionGenerator } from "@/components/va-tools";
export const metadata:Metadata={title:"Virtual Assistant Job Description Generator",description:"Create a practical VA job description with responsibilities, tools, hours, success measures, and a fair minimum hourly budget.",alternates:{canonical:"/tools/virtual-assistant-job-description-generator"}};
export default function Page(){return <><SiteHeader/><main id="main-content"><section className="tool-page-hero"><div className="container"><nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/tools">Tools</Link><span>/</span><span>Job description generator</span></nav><div className="public-page-head"><h1 className="public-page-title">Virtual Assistant Job Description Generator</h1><p className="public-lede">Create a clean first draft you can refine around your business, working hours, access boundaries, and actual definition of done.</p></div><JobDescriptionGenerator/></div></section></main><SiteFooter/></>}
