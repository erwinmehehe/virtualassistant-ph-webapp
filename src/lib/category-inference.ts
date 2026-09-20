const rules: Array<[string, string[]]> = [
  ["Dental & Healthcare", ["dental", "healthcare", "patient care", "medical billing", "dental billing", "clinic"]],
  ["Customer Service", ["customer service", "customer support", "helpdesk", "support ticket", "zendesk", "gorgias", "dispatch"]],
  ["Phone & Reception", ["reception", "receptionist", "phone support", "inbound call", "outbound call", "cold call", "appointment setting"]],
  ["Lead Generation & Sales", ["lead generation", "lead gen", "prospecting", "sales development", "sales outreach", "pipeline management", "appointment setter"]],
  ["Marketing & Social Media", ["social media", "social media management", "facebook ads", "instagram", "linkedin marketing", "tiktok", "content calendar", "community management"]],
  ["Video Editing & Creative", ["video editing", "video editor", "reels", "youtube shorts", "short-form video", "ad creative", "canva design", "graphic design"]],
  ["SEO", ["seo", "search engine optimization", "keyword research", "technical seo", "on-page seo", "link building", "backlink"]],
  ["Executive Assistance", ["executive assistant", "executive support", "calendar management", "inbox management", "email management", "travel management"]],
  ["Administrative Support", ["administrative assistant", "admin assistant", "administrative support", "data entry", "spreadsheet management", "document management", "research assistant"]],
  ["Bookkeeping & Finance", ["bookkeeping", "bookkeeper", "accounts payable", "accounts receivable", "accounting", "quickbooks", "xero"]],
  ["Real Estate", ["real estate", "property management", "realtor", "mls", "transaction coordinator"]],
  ["Ecommerce", ["ecommerce", "e-commerce", "shopify", "amazon seller", "product listing", "woocommerce"]],
  ["Web & WordPress", ["wordpress", "web design", "web developer", "elementor", "webflow", "woocommerce development"]]
];

export function inferCategories(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const matches = rules
    .map(([category, terms], index) => ({
      category,
      index,
      score: terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0)
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((match) => match.category);
  return [...new Set(matches)].slice(0, 3);
}

export function inferHours(value: string | null | undefined) {
  if (!value) return null;
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  if (!numbers.length) return null;
  return Math.max(...numbers);
}
