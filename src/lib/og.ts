import { canonicalUrl } from "@/lib/seo-url";

export type OgCategory =
  | "general"
  | "admin"
  | "marketing"
  | "finance"
  | "technical"
  | "customer-support"
  | "ecommerce"
  | "real-estate"
  | "blog"
  | "industry"
  | "software"
  | "training"
  | "jobs"
  | "hiring"
  | "pricing"
  | "legal";

function clean(value: string, max = 220) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function ogImageUrl(input: {
  title: string;
  description: string;
  category?: OgCategory;
  eyebrow?: string;
  author?: string;
  points?: string[];
}) {
  const params = new URLSearchParams();
  params.set("title", clean(input.title, 120));
  params.set("description", clean(input.description, 240));
  params.set("category", input.category || "general");
  if (input.eyebrow) params.set("eyebrow", clean(input.eyebrow, 48));
  if (input.author) params.set("author", clean(input.author, 72));
  for (const point of (input.points || []).slice(0, 4)) {
    params.append("point", clean(point, 54));
  }
  return canonicalUrl(`/api/og?${params.toString()}`);
}

export function socialMetadata(input: {
  title: string;
  description: string;
  path: string;
  category?: OgCategory;
  type?: "website" | "article";
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  eyebrow?: string;
  author?: string;
  points?: string[];
}) {
  const image = ogImageUrl(input);
  const articleFields =
    input.type === "article"
      ? {
          ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
          ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
        }
      : {};

  return {
    openGraph: {
      type: input.type || "website",
      url: input.path,
      title: input.title,
      description: input.description,
      ...(input.locale ? { locale: input.locale } : {}),
      ...articleFields,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: input.title,
      description: input.description,
      images: [{ url: image, alt: input.title }],
    },
  };
}

export function serviceOgCategory(group: string): OgCategory {
  const value = group.toLowerCase();
  if (value.includes("marketing") || value.includes("creative")) return "marketing";
  if (value.includes("finance") || value.includes("account")) return "finance";
  if (value.includes("technology") || value.includes("web")) return "technical";
  if (value.includes("customer") || value.includes("sales")) return "customer-support";
  if (value.includes("ecommerce")) return "ecommerce";
  if (value.includes("real estate") || value.includes("home")) return "real-estate";
  if (value.includes("legal")) return "legal";
  return "admin";
}
