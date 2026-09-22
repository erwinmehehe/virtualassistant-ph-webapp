import { SeoAuthorityPageView, authorityMetadata } from "@/components/seo-authority-page";
import { seoAuthorityPage } from "@/lib/seo-authority-pages";
const page = seoAuthorityPage("what-is");
export const metadata = authorityMetadata(page);
export default function Page(){ return <SeoAuthorityPageView page={page}/>; }
