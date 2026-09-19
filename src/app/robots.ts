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

const DISALLOW = ["/workspace/", "/auth/", "/api/"];

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
