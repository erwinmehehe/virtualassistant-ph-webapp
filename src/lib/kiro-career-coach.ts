/**
 * Kiro Career Studio's offline practice helpers.
 * These deliberately do not invoke a model, score employability, or persist
 * learner drafts. Use only fictional details or the learner's own safe text.
 */
export type ResumeEvidence = "real" | "practice";

export type CareerScenario = {
  id: string;
  focus: string;
  question: string;
  coachingPoints: readonly string[];
};

const SCENARIOS: CareerScenario[] = [
  {
    id: "general",
    focus: "Core virtual assistance",
    question: "A fictional client gives you three urgent tasks with the same deadline. How would you clarify priorities, manage the time zones, and report progress?",
    coachingPoints: [
      "Explain how you clarify priority and deadline",
      "Describe a concrete plan or tracking method",
      "Say when you would ask for approval or escalate a blocker",
      "Close with a client update and next steps",
    ],
  },
  {
    id: "seo",
    focus: "SEO assistance",
    question: "A fictional client says their website traffic dropped this week. How would you investigate without making ranking guarantees?",
    coachingPoints: [
      "Clarify the date range and traffic source",
      "Check analytics, Search Console and recent site changes",
      "Describe what you would document for the SEO lead",
      "Avoid promising rankings or changing a live site without approval",
    ],
  },
  {
    id: "support",
    focus: "Customer support",
    question: "A fictional customer is angry about a delayed order and asks for a refund you cannot authorize. How do you respond?",
    coachingPoints: [
      "Acknowledge the customer's frustration",
      "Verify the order through approved internal steps",
      "Stay within the refund and escalation policy",
      "Explain the next update without promising an unapproved outcome",
    ],
  },
  {
    id: "operations",
    focus: "Operations and executive assistance",
    question: "A fictional executive asks you to reschedule a meeting across two time zones while preserving a confidential agenda. What do you do?",
    coachingPoints: [
      "Confirm time zones, availability and dependencies",
      "Use the approved calendar and access permissions",
      "Avoid exposing confidential meeting details",
      "Send a precise confirmation and handoff",
    ],
  },
  {
    id: "finance",
    focus: "Bookkeeping administration",
    question: "A fictional spreadsheet total disagrees with the accounting system. What would you check before reporting it to the bookkeeper?",
    coachingPoints: [
      "Reconcile source dates, entries and duplicates",
      "Document the discrepancy with fictional data",
      "Escalate to an authorized accounting professional",
      "Do not make tax, accounting or payment decisions independently",
    ],
  },
  {
    id: "healthcare",
    focus: "Healthcare administration",
    question: "A fictional patient sends sensitive details through an unapproved channel. How would you handle the message?",
    coachingPoints: [
      "Follow the practice's approved privacy workflow",
      "Avoid copying personal health details into new tools",
      "Escalate to authorized staff for clinical decisions",
      "Confirm the next administrative step without providing medical advice",
    ],
  },
  {
    id: "ecommerce",
    focus: "Ecommerce assistance",
    question: "A fictional store lists an item as in stock, but a supplier says it is unavailable. How would you manage the issue?",
    coachingPoints: [
      "Check inventory and supplier source records",
      "Flag the discrepancy through the approved process",
      "Ask for approval before changing customer promises",
      "Document the customer-service handoff",
    ],
  },
  {
    id: "real-estate",
    focus: "Real estate assistance",
    question: "A fictional property inquiry arrives with an urgent appointment request and incomplete details. What do you do next?",
    coachingPoints: [
      "Clarify location, time zone and scheduling requirements",
      "Record only necessary details in the approved CRM",
      "Escalate regulated or contract questions to the licensed professional",
      "Confirm the appointment or proposed next step",
    ],
  },
  {
    id: "marketing",
    focus: "Marketing assistance",
    question: "A fictional client requests a social media post for tomorrow but has not approved the claim or image. How would you handle publication?",
    coachingPoints: [
      "Request verified claim and image permissions",
      "Draft to the approved brand voice and schedule",
      "Get client sign-off before publishing",
      "Report what was published and any blockers",
    ],
  },
];

export function careerScenarioForCategory(value: string | null | undefined): CareerScenario {
  const category = (value || "").toLowerCase();
  const id = /seo|search engine/.test(category) ? "seo"
    : /support|service|reception|phone/.test(category) ? "support"
    : /executive|operations|administrative|project|wordpress|web/.test(category) ? "operations"
    : /finance|bookkeep|payroll|account/.test(category) ? "finance"
    : /medical|health|dental|ndis/.test(category) ? "healthcare"
    : /commerce|shop/.test(category) ? "ecommerce"
    : /real estate|property/.test(category) ? "real-estate"
    : /marketing|social|creative|video|lead generation|sales/.test(category) ? "marketing"
    : "general";
  return SCENARIOS.find((scenario) => scenario.id === id) || SCENARIOS[0];
}

function clean(value: string, max = 220): string {
  return value.replace(/\s+/g, " ").trim().replace(/[.!?;:,]+$/g, "").slice(0, max);
}

/**
 * Never turn a training simulation into a falsely asserted employment claim.
 * No metrics or credentials are invented; missing fields stay missing.
 */
export function createResumeExample(input: {
  evidence: ResumeEvidence;
  task: string;
  tools: string;
  result: string;
}): string {
  const task = clean(input.task);
  const tools = clean(input.tools, 120);
  const result = clean(input.result, 220);
  if (!task) return "";
  const usingTools = tools ? " using " + tools : "";
  const outcome = result ? "; outcome: " + result : "";
  if (input.evidence === "practice") {
    return "Practice project (simulated): Practiced " + task + usingTools + outcome + ".";
  }
  return "Work experience draft: " + task + usingTools + outcome + ".";
}

export function createPortfolioOutline(input: {
  project: string;
  task: string;
  deliverable: string;
  tools: string;
}): string {
  const project = clean(input.project, 120);
  const task = clean(input.task);
  const deliverable = clean(input.deliverable);
  const tools = clean(input.tools, 120);
  if (!project || !task) return "";
  return [
    "PRACTICE PORTFOLIO SAMPLE — NOT PAID CLIENT WORK",
    "Project: " + project,
    "Fictional brief: " + task,
    "My process: [Describe the steps you actually practiced with dummy data.]",
    "Tools practiced: " + (tools || "[List only tools you used]"),
    "Sample deliverable: " + (deliverable || "[Describe or link your fictional work sample]"),
    "Quality check: [Explain how you checked accuracy, permissions and handoff.]",
    "Reflection: [Explain one improvement you would make next time.]",
  ].join("\n\n");
}

/** These are transparent writing prompts, not AI judgments or hiring scores. */
export function interviewPracticeTips(answer: string): string[] {
  const text = answer.trim();
  if (!text) return ["Write your own answer first; Kiro will then show a practical self-review checklist."];
  const tips: string[] = [];
  if (text.length < 120) tips.push("Add a concrete example of what you would do first, rather than a one-line promise.");
  if (!/clarif|confirm|ask|check|verify|understand|review|assess|priority/i.test(text)) {
    tips.push("State what you would clarify or verify before taking action.");
  }
  if (!/plan|step|track|document|list|schedule|record|organize|investigat|reconcil|draft|coordinate/i.test(text)) {
    tips.push("Mention the steps or tools you would use to carry out the task.");
  }
  if (!/approv|escalat|report|update|communicat|client|supervisor|handoff|follow.up|notify/i.test(text)) {
    tips.push("Describe what needs approval or escalation and how you would update the client.");
  }
  if (!tips.length) tips.push("You covered several useful elements. Compare your answer with the scenario checklist and add a concrete example where possible.");
  return tips.slice(0, 4);
}
