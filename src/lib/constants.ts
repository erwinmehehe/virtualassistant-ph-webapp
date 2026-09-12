export const VA_CATEGORIES = [
  "Administrative Support",
  "Bookkeeping & Finance",
  "Customer Service",
  "Dental & Healthcare",
  "Ecommerce",
  "Executive Assistance",
  "Lead Generation & Sales",
  "Marketing & Social Media",
  "Phone & Reception",
  "Real Estate",
  "SEO",
  "Video Editing & Creative",
  "Web & WordPress"
] as const;

export type VaCategory = (typeof VA_CATEGORIES)[number];

export const VA_CATEGORY_LABELS: Record<VaCategory, string> = {
  "Administrative Support": "General VA / Admin",
  "Bookkeeping & Finance": "Bookkeeping / Finance",
  "Customer Service": "Customer Support",
  "Dental & Healthcare": "Healthcare / Dental VA",
  "Ecommerce": "Ecommerce VA",
  "Executive Assistance": "Executive VA",
  "Lead Generation & Sales": "Lead Gen / Sales",
  "Marketing & Social Media": "SMM / Social Media",
  "Phone & Reception": "Reception / Phone",
  "Real Estate": "Real Estate VA",
  "SEO": "SEO VA",
  "Video Editing & Creative": "Creative / Video",
  "Web & WordPress": "Web / WordPress"
};

export function vaCategoryLabel(value?: string | null) {
  if (!value) return "Uncategorized";
  return VA_CATEGORY_LABELS[value as VaCategory] || value;
}

export const FOCUS_VERTICALS = [
  "Healthcare & Dental",
  "Home & Local Services",
  "Professional Services & Growth"
] as const;

export const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "hired",
  "rejected"
] as const;

export const VETTING_STAGES = [
  "profile",
  "test",
  "video",
  "recruiter_review",
  "finalist",
  "approved",
  "bench",
  "rejected"
] as const;

export const MIN_HOURLY_RATE = 5;
export const VETTING_PROFILE_MIN = 80;
export const VETTING_TEST_PASS = 70;
export const VETTING_SCORECARD_PASS = 75;
export const DEFAULT_BENCH_TARGET = 5;
