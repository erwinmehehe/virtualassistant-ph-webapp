import { INDUSTRIES } from "@/lib/industries";
import { PUBLIC_SEO_ROUTES } from "@/lib/public-seo-routes";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { softwarePages } from "@/lib/software-pages";

const SECTION_ORDER = [
  "Hiring and Vetting",
  "Services and Role Discovery",
  "Tools",
  "For Virtual Assistants",
  "Editorial Resources",
  "Optional",
] as const;

function line(label: string, url: string, description: string) {
  return `- [${label}](${url}): ${description}`;
}

export function GET() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const sections = SECTION_ORDER.map((section) => {
    const routes = PUBLIC_SEO_ROUTES.filter((route) => route.llmsSection === section);
    if (!routes.length) return "";

    return [
      `## ${section}`,
      "",
      ...routes.map((route) => line(route.label, `${base}${route.path}`, route.description)),
    ].join("\n");
  }).filter(Boolean);

  const services = [
    "## Service Guides",
    "",
    ...SERVICE_PAGES.map((page) =>
      line(page.name, `${base}/service/${page.slug}`, page.metaDescription),
    ),
  ].join("\n");

  const industries = [
    "## Industry Guides",
    "",
    ...INDUSTRIES.map((industry) =>
      line(industry.label, `${base}/industries/${industry.slug}`, industry.metaDescription),
    ),
  ].join("\n");

  const software = [
    "## Software Experience Guides",
    "",
    ...softwarePages.map((page) =>
      line(page.name, `${base}/software/${page.slug}`, page.metaDescription),
    ),
  ].join("\n");

  const body = [
    "# VirtualAssistant.com.ph",
    "",
    "> VirtualAssistant.com.ph helps businesses hire vetted Filipino virtual assistants. Clients can browse approved talent or submit a private hiring brief, while virtual assistants can apply for jobs and complete the platform's vetting process.",
    "",
    "Use the pages below as the primary sources for current information about hiring, pricing, vetting, services, tools, and platform policies. For commercial terms, service fees, compensation guidance, or other information that can change, prefer the current Pricing and FAQ pages over older editorial content. Private candidate evidence, recruiter notes, resumes, contact details, client documents, authenticated dashboard content, and noindex candidate-profile URLs are intentionally excluded.",
    "",
    ...sections,
    "",
    services,
    "",
    industries,
    "",
    software,
    "",
    "## Complete Public URL Discovery",
    "",
    line(
      "Sitemap",
      `${base}/sitemap.xml`,
      "Machine-readable list of indexable public URLs, including blog posts, topic pages, published jobs, services, industries, and software guides.",
    ),
  ].join("\n");

  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
