export const VA_RATE_REPORT_2026 = {
  asOf: "2026-09-22",
  totalProfiles: 137,
  profilesWithRate: 93,
  profilesWithTools: 66,
  profilesWithSkills: 82,
  profilesWithPrimaryCategory: 88,
  profilesWithWeeklyHours: 93,
  currency: "USD",
  currentProfileMinimumRate: 6,
  rateSummary: {
    min: 5,
    p25: 5,
    median: 5,
    average: 6.61,
    p75: 7,
    max: 25,
    medianYearsExperience: 3,
    medianWeeklyHours: 40
  },
  rateBuckets: [
    { label: "$5/hr", n: 48 },
    { label: "$6–$6.99/hr", n: 15 },
    { label: "$7–$7.99/hr", n: 13 },
    { label: "$8–$9.99/hr", n: 8 },
    { label: "$10+/hr", n: 9 }
  ],
  categoryRates: [
    { category: "Administrative Support", n: 27, p25: 5, median: 5, p75: 6, average: 6.06, medianYears: 4 },
    { category: "Customer Service", n: 17, p25: 5, median: 5, p75: 6, average: 6, medianYears: 5 },
    { category: "Marketing & Social Media", n: 12, p25: 5, median: 5.5, p75: 7.25, average: 7.67, medianYears: 4 },
    { category: "Ecommerce", n: 7, p25: 5, median: 7, p75: 7.5, average: 7, medianYears: 4 },
    { category: "Lead Generation & Sales", n: 7, p25: 6, median: 6, p75: 7, average: 7.86, medianYears: 3 },
    { category: "Web & WordPress", n: 5, p25: 5, median: 5, p75: 5, average: 5, medianYears: 1 }
  ],
  experienceRates: [
    { band: "0–1 years", n: 12, p25: 5, median: 5, p75: 6.25 },
    { band: "2–3 years", n: 39, p25: 5, median: 5, p75: 7 },
    { band: "4–5 years", n: 17, p25: 5, median: 5, p75: 7 },
    { band: "6+ years", n: 25, p25: 5, median: 6, p75: 8 }
  ],
  topTools: [
    { label: "Canva", n: 43 },
    { label: "Google Workspace", n: 38 },
    { label: "Slack", n: 20 },
    { label: "Zoom", n: 14 },
    { label: "Microsoft Office", n: 12 },
    { label: "CapCut", n: 11 },
    { label: "ChatGPT", n: 10 },
    { label: "Microsoft Teams", n: 8 },
    { label: "HubSpot", n: 7 },
    { label: "Salesforce", n: 7 },
    { label: "Zendesk", n: 7 }
  ],
  topSkills: [
    { label: "Customer Support", n: 21 },
    { label: "Calendar Management", n: 19 },
    { label: "Data Entry", n: 18 },
    { label: "Email Management", n: 15 },
    { label: "Administrative Support", n: 11 },
    { label: "Social Media Management", n: 11 },
    { label: "Customer Service", n: 9 },
    { label: "Lead Generation", n: 7 },
    { label: "Attention to Detail", n: 6 },
    { label: "Graphic Design", n: 5 },
    { label: "Quality Assurance", n: 5 }
  ]
} as const;

export type VaRateReport2026 = typeof VA_RATE_REPORT_2026;
