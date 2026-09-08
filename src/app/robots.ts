import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/+$/, "");
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/workspace/", "/auth/", "/api/"] }], sitemap: `${base}/sitemap.xml` };
}
