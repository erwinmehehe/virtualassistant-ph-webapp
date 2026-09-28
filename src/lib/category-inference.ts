type WeightedTerm = [term: string, weight: number];

type CategoryRule = {
  category: string;
  terms: WeightedTerm[];
};

export type CategoryInferenceInput = {
  headline?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  tools?: string[] | null;
  industries?: string[] | null;
  declaredCategories?: string[] | null;
};

export type CategoryEvidence = {
  category: string;
  score: number;
  evidence: string[];
};

const rules: CategoryRule[] = [
  { category: "Dental & Healthcare", terms: [["dental", 4], ["healthcare", 4], ["medical", 2], ["patient care", 3], ["medical billing", 4], ["dental billing", 4], ["clinic", 2], ["cliniko", 3]] },
  { category: "Customer Service", terms: [["customer service", 4], ["customer support", 4], ["helpdesk", 3], ["support ticket", 3], ["zendesk", 3], ["gorgias", 3], ["dispatch", 2]] },
  { category: "Phone & Reception", terms: [["receptionist", 4], ["reception", 3], ["phone support", 4], ["inbound call", 3], ["outbound call", 3], ["cold call", 3], ["appointment setting", 4], ["appointment setter", 4]] },
  { category: "Lead Generation & Sales", terms: [["lead generation", 4], ["lead gen", 4], ["prospecting", 3], ["sales development", 4], ["sales outreach", 4], ["pipeline management", 3], ["appointment setter", 3], ["business development", 3], ["crm management", 2]] },
  { category: "Marketing & Social Media", terms: [["social media management", 4], ["social media", 3], ["facebook ads", 4], ["instagram", 2], ["linkedin marketing", 4], ["tiktok", 2], ["content calendar", 3], ["community management", 3], ["meta ads", 4], ["digital marketing", 3]] },
  { category: "Video Editing & Creative", terms: [["video editing", 4], ["video editor", 4], ["reels", 2], ["youtube shorts", 3], ["short-form video", 4], ["ad creative", 3], ["canva design", 3], ["graphic design", 4], ["photoshop", 2], ["premiere pro", 3], ["capcut", 2]] },
  { category: "SEO", terms: [["search engine optimization", 5], ["technical seo", 5], ["on-page seo", 5], ["off-page seo", 5], ["local seo", 5], ["seo", 4], ["keyword research", 4], ["link building", 4], ["backlink", 3], ["google search console", 3], ["semrush", 3], ["ahrefs", 3]] },
  { category: "Executive Assistance", terms: [["executive assistant", 5], ["executive support", 4], ["calendar management", 4], ["inbox management", 4], ["email management", 3], ["travel management", 4], ["chief of staff", 4], ["meeting coordination", 3]] },
  { category: "Administrative Support", terms: [["administrative assistant", 5], ["admin assistant", 5], ["administrative support", 5], ["general virtual assistant", 4], ["general va", 4], ["admin", 4], ["data entry", 4], ["spreadsheet management", 3], ["document management", 3], ["research assistant", 3], ["back office", 3]] },
  { category: "Bookkeeping & Finance", terms: [["bookkeeping", 5], ["bookkeeper", 5], ["accounts payable", 4], ["accounts receivable", 4], ["accounting", 4], ["quickbooks", 4], ["xero", 4], ["bank reconciliation", 4], ["payroll", 3], ["invoicing", 2]] },
  { category: "Real Estate", terms: [["real estate", 4], ["property management", 5], ["property manager", 5], ["realtor", 4], ["mls", 4], ["transaction coordinator", 5], ["property admin", 4], ["leasing", 3], ["airbnb", 3], ["short-term rental", 4]] },
  { category: "Ecommerce", terms: [["ecommerce", 5], ["e-commerce", 5], ["shopify", 4], ["amazon seller", 4], ["product listing", 4], ["woocommerce", 4], ["etsy", 3], ["klaviyo", 3], ["order management", 3], ["product upload", 3]] },
  { category: "Web & WordPress", terms: [["wordpress", 5], ["web design", 4], ["web developer", 5], ["elementor", 4], ["webflow", 4], ["woocommerce development", 5], ["frontend developer", 4], ["website development", 4], ["landing page", 2]] },
];

const FIELD_WEIGHTS = {
  headline: 8,
  skills: 6,
  industries: 1,
  tools: 4,
  bio: 2,
  declaredCategories: 10,
} as const;

const MIN_CATEGORY_SCORE = 10;
const MAX_CATEGORIES = 3;

function normalize(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[|/_,;:()[\]{}+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseMatches(text: string, phrase: string) {
  if (!text || !phrase) return false;
  const escaped = phrase.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp("(^|[^a-z0-9])" + escaped + "([^a-z0-9]|$)", "i").test(text);
}

function fieldTexts(input: CategoryInferenceInput) {
  return [
    { name: "headline" as const, values: [input.headline || ""] },
    { name: "skills" as const, values: input.skills || [] },
    { name: "industries" as const, values: input.industries || [] },
    { name: "tools" as const, values: input.tools || [] },
    { name: "bio" as const, values: [input.bio || ""] },
    { name: "declaredCategories" as const, values: input.declaredCategories || [] },
  ];
}

export function inferCategoryEvidence(input: CategoryInferenceInput): CategoryEvidence[] {
  const fields = fieldTexts(input);

  return rules
    .map((rule, index) => {
      let score = 0;
      const evidence = new Set<string>();

      for (const field of fields) {
        const fieldWeight = FIELD_WEIGHTS[field.name];
        for (const rawValue of field.values) {
          const text = normalize(rawValue);
          if (!text) continue;

          if (field.name === "declaredCategories" && normalize(rule.category) === text) {
            score += fieldWeight * 5;
            evidence.add("declared: " + rule.category);
            continue;
          }

          for (const [term, termWeight] of rule.terms) {
            if (!phraseMatches(text, normalize(term))) continue;
            const exactBonus = text === normalize(term) ? 1.35 : 1;
            score += fieldWeight * termWeight * exactBonus;
            evidence.add(field.name + ": " + term);
          }
        }
      }

      return {
        category: rule.category,
        score: Math.round(score * 10) / 10,
        evidence: [...evidence],
        index,
      };
    })
    .filter((match) => match.score >= MIN_CATEGORY_SCORE)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_CATEGORIES)
    .map(({ category, score, evidence }) => ({ category, score, evidence }));
}

export function inferCategoriesFromProfile(input: CategoryInferenceInput) {
  return inferCategoryEvidence(input).map((match) => match.category);
}

// Compatibility helper for older callers. Treat free-form arguments as profile
// text rather than giving them the stronger skill/headline weights.
export function inferCategories(...values: Array<string | null | undefined>) {
  return inferCategoriesFromProfile({ bio: values.filter(Boolean).join(" ") });
}

export function inferHours(value: string | null | undefined) {
  if (!value) return null;
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  if (!numbers.length) return null;
  return Math.max(...numbers);
}
