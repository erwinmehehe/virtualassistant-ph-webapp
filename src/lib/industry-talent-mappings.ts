import type { VaCategory } from "@/lib/constants";
import type { IndustryPage } from "@/lib/industries";

type IndustryTalentFilter = {
  category: VaCategory;
  query: string;
};

const INDUSTRY_TALENT_FILTERS: Record<IndustryPage["slug"], IndustryTalentFilter> = {
  "healthcare-dental": { category: "Dental & Healthcare", query: "healthcare dental" },
  "home-local-services": { category: "Phone & Reception", query: "home service" },
  "professional-services-growth": { category: "Executive Assistance", query: "professional services" },
  "small-business": { category: "Administrative Support", query: "small business" },
  "medical-practices": { category: "Dental & Healthcare", query: "medical practice" },
  "law-firms": { category: "Administrative Support", query: "law firm" },
  "real-estate-agents": { category: "Real Estate", query: "real estate" },
  "financial-advisors": { category: "Bookkeeping & Finance", query: "financial advisor" },
  "startups": { category: "Executive Assistance", query: "startup" },
  "construction-companies": { category: "Administrative Support", query: "construction" },
  "insurance-agencies": { category: "Customer Service", query: "insurance" },
  "property-management-companies": { category: "Real Estate", query: "property management" },
  "accountants-cpas": { category: "Bookkeeping & Finance", query: "accounting CPA" },
  "coaches": { category: "Executive Assistance", query: "coaching consultant" },
  "dental-practices": { category: "Dental & Healthcare", query: "dental practice" },
  "photographers-creatives": { category: "Video Editing & Creative", query: "photography creative" },
  "entrepreneurs": { category: "Executive Assistance", query: "entrepreneur founder" },
  "real-estate-investors": { category: "Real Estate", query: "real estate investing" },
  "ecommerce-stores": { category: "Ecommerce", query: "ecommerce" },
  "therapists": { category: "Dental & Healthcare", query: "mental health therapy" },
  "banking-financial-services": { category: "Bookkeeping & Finance", query: "banking financial services" },
  "construction-estimating-tender-desk": { category: "Administrative Support", query: "construction estimating" },
  "accounting-firms-month-end": { category: "Bookkeeping & Finance", query: "month end accounting" },
  "ndis-providers": { category: "Dental & Healthcare", query: "NDIS" },
  "mortgage-broker-loan-processing": { category: "Real Estate", query: "mortgage loan processing" },
  "smsf-production": { category: "Bookkeeping & Finance", query: "SMSF" },
  "strata-management-administration": { category: "Real Estate", query: "strata management" },
  "property-management-maintenance-coordination": { category: "Real Estate", query: "maintenance coordination" },
  "allied-health-referral-billing": { category: "Dental & Healthcare", query: "allied health" },
  "trades-service-administration": { category: "Administrative Support", query: "trades service" },
  "bim-revit-production": { category: "Administrative Support", query: "BIM Revit" },
  "recruitment-candidate-sourcing": { category: "Lead Generation & Sales", query: "recruitment sourcing" },
  "insurance-broker-renewal-desk": { category: "Customer Service", query: "insurance renewals" }
};

export function industryTalentFilters(slug: IndustryPage["slug"]): IndustryTalentFilter {
  return INDUSTRY_TALENT_FILTERS[slug];
}
