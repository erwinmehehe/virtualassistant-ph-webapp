export type TrainingCardCourseLike = {
  slug: string;
  category: string;
  country_focus?: string | null;
};

export function trainingCourseOutcome(course: TrainingCardCourseLike) {
  const slug = course.slug.toLowerCase();

  if (slug === "virtual-assistant-foundations") return "Inbox, calendar, research, handoffs, and QA";
  if (slug.includes("executive")) return "Calendar triage, briefs, stakeholder follow-up, and priorities";
  if (slug.includes("customer-support") || slug.includes("reception")) return "Tickets, customer updates, escalation, and documentation";
  if (slug.includes("seo")) return "On-page checks, briefs, internal links, and reporting";
  if (slug.includes("sales") || slug.includes("lead-generation") || slug.includes("hubspot")) return "Prospecting, CRM hygiene, qualification, and handoff";
  if (slug.includes("social-media") || slug.includes("marketing") || slug.includes("canva")) return "Content workflows, campaign QA, scheduling, and reporting";
  if (slug.includes("ecommerce") || slug.includes("airbnb")) return "Catalog, orders, guest or customer exceptions, and follow-up";
  if (slug.includes("bookkeeping") || slug.includes("payroll") || slug.includes("xero") || slug.includes("myob")) return "Reconciliation, exceptions, records, and reviewer handoff";
  if (slug.includes("real-estate") || slug.includes("property")) return "CRM, listings, scheduling, and client follow-up";
  if (slug.includes("medical") || slug.includes("health") || slug.includes("cliniko") || slug.includes("ndis")) return "Scheduling, records, privacy-aware admin, and escalation";
  if (slug.includes("operations") || slug.includes("project-management")) return "Trackers, handoffs, delivery checks, and status reporting";
  if (slug.includes("trades") || slug.includes("servicem8")) return "Job scheduling, service admin, records, and follow-up";

  if (course.category === "software") return "Core workflows, clean records, exceptions, and safe handoff";
  if (course.category === "industry") return "Industry admin, recurring workflows, handoffs, and QA";
  if (course.country_focus === "Australia") return "Australian workflow context, terminology, and admin checks";
  return "Role workflows, realistic practice, handoffs, and QA";
}
