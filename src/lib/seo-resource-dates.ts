export const DEFAULT_SEO_RESOURCE_PUBLISHED_AT = "2026-09-22";

const SEO_RESOURCE_UPDATED_AT: Readonly<Record<string, string>> = {
  "virtual-assistant-job-description": "2026-09-23",
};

export function seoResourcePublishedAt(_slug: string) {
  return DEFAULT_SEO_RESOURCE_PUBLISHED_AT;
}

export function seoResourceUpdatedAt(slug: string) {
  return SEO_RESOURCE_UPDATED_AT[slug] || DEFAULT_SEO_RESOURCE_PUBLISHED_AT;
}
