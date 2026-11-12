import type { MetadataRoute } from "next";

/**
 * Assistants that answer hiring questions are now a real referral source, so
 * their crawlers are allowed by name rather than by falling through to "*".
 * Named rules also survive a future blanket tightening of the wildcard rule.
 * Private surfaces stay closed to everyone.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "meta-externalagent"
];

/**
 * Filter and pagination variants render on the server per parameter combination,
 * so crawlers walking every filter cost Fluid Active CPU for pages with no search
 * value. The canonical pages and every job detail page stay crawlable via the
 * sitemap. Deliberately not a blanket block on every query string: Vercel serves
 * JS/CSS with a ?dpl= query, and blocking those would stop Googlebot rendering.
 */
const PARAMETER_VARIANTS = ["/jobs?", "/find-talent?", "/hire?", "/book-client-call?"];

const DISALLOW = ["/workspace/", "/auth/", "/api/", ...PARAMETER_VARIANTS];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW }))
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
