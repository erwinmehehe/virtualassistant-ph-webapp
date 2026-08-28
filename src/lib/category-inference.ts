const rules: Array<[string, string[]]> = [
  ["Dental & Healthcare", ["dental", "healthcare", "patient", "billing", "front desk"]],
  ["Customer Service", ["customer service", "support", "dispatch", "inquiries"]],
  ["Phone & Reception", ["reception", "receptionist", "outbound call", "cold call", "phone"]],
  ["Lead Generation & Sales", ["lead generation", "prospect", "sales", "docusign", "proposal", "crm"]],
  ["Marketing & Social Media", ["social media", "facebook", "instagram", "linkedin", "tiktok", "content"]],
  ["Video Editing & Creative", ["video editing", "reels", "shorts", "video", "canva", "creative"]],
  ["SEO", ["seo", "search engine", "keyword", "backlink"]],
  ["Executive Assistance", ["executive assistant", "calendar", "email management", "principal"]],
  ["Administrative Support", ["admin", "administrative", "data entry", "spreadsheet", "reporting"]],
  ["Bookkeeping & Finance", ["bookkeeping", "invoice", "accounting", "quickbooks"]],
  ["Real Estate", ["real estate", "property", "realtor"]],
  ["Ecommerce", ["ecommerce", "shopify", "amazon", "product listing"]],
  ["Web & WordPress", ["wordpress", "website", "web design", "elementor"]]
];

export function inferCategories(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const matches = rules.filter(([, terms]) => terms.some((term) => text.includes(term))).map(([category]) => category);
  return [...new Set(matches)].slice(0, 3);
}

export function inferHours(value: string | null | undefined) {
  if (!value) return null;
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  if (!numbers.length) return null;
  return Math.max(...numbers);
}
