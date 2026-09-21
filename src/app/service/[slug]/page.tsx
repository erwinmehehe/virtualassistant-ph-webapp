import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  KeyRound,
  MessageSquareText,
  Search,
  ShieldCheck,
  Split,
  TriangleAlert,
  UsersRound,
  Wrench
} from "lucide-react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicAvatar } from "@/components/public-avatar";
import { HiringBriefForm } from "@/components/hiring-brief-form";
import { HiringHero } from "@/components/hiring-hero";
import { Band, CheckList, CtaBand, FaqBlock, JumpNav, LinkTiles, SectionHead, Steps } from "@/components/hiring-page-sections";
import { SERVICE_PAGES, serviceMetaDescription, serviceMetaTitle, servicePageBySlug, type ServiceSeoPage } from "@/lib/service-pages";
import { blogHref, serviceBlogPosts } from "@/lib/blog";
import { INDUSTRIES } from "@/lib/industries";
import { uniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import "../../homepage-sections.css";
import "../../hiring-pages.css";
import { organizationRef } from "@/lib/organization";
import { preserveAcronyms, titleCaseWithAcronyms } from "@/lib/content-language";

export const revalidate = 3600;

export function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) return {};
  const canonical = canonicalPath(`/service/${page.slug}`);
  return {
    title: { absolute: serviceMetaTitle(page) },
    description: serviceMetaDescription(page),
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: serviceMetaTitle(page), description: serviceMetaDescription(page) },
    twitter: { card: "summary_large_image", title: serviceMetaTitle(page), description: serviceMetaDescription(page) }
  };
}

function articleFor(name: string) {
  return /^(SEO|NDIS|SMSF|HVAC|IT|Executive|Ecommerce|Admin|Accounting|Email)\b/i.test(name) || /^[AEIOU]/i.test(name) ? "an" : "a";
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function toTitle(value: string) {
  return titleCaseWithAcronyms(value);
}

function roleName(name: string) {
  return name.replace(/ Virtual Assistant$/i, "").replace(/^Virtual /i, "");
}

function taskGroups(tasks: string[], name: string) {
  const chunks = [tasks.slice(0, 3), tasks.slice(3, 6), tasks.slice(6)];
  const focus = roleName(name);
  const titles = [`Core ${focus} support`, "Workflow and coordination", "Follow-through and visibility"];
  const intros = [
    "Give recurring work a clear owner so important tasks do not depend on spare time.",
    "Keep records, handoffs, people, and tools aligned around the process your team already uses.",
    "Make completed work, exceptions, and next actions easier to see and easier to manage."
  ];
  return chunks.filter((chunk) => chunk.length).map((chunk, index) => ({ title: titles[index], intro: intros[index], tasks: chunk }));
}

function complianceNote(slug: string, group: string) {
  if (slug === "credit-repair-virtual-assistant") return "Use the Virtual Assistant for documented administrative workflows such as intake, CRM updates, document collection, and follow-up. Credit-repair compliance, dispute strategy, representations, and legal obligations remain with the client company and appropriately qualified professionals.";
  if (group === "Healthcare") return "Keep the role non-clinical unless the person is separately qualified and authorized for the work. Your organization remains responsible for privacy, system access, supervision, and clinical or billing compliance.";
  if (group === "Legal") return "Use the Virtual Assistant for supervised administrative and support work. Legal advice, attorney judgment, privileged strategy, and work reserved to licensed professionals remain with qualified counsel. Define confidentiality, access, supervision, and jurisdiction-specific boundaries before onboarding.";
  if (group === "Finance & Insurance") return "Define which activities require a license, certification, approval, or local supervision. The client organization remains responsible for regulated advice, compliance, access controls, and final review.";
  return null;
}

function experienceCopy(s: ServiceSeoPage) {
  const role = s.name;
  const focus = roleName(s.name);
  const defaults = {
    hero: s.intro,
    panelTitle: `Give ${focus} work a clear owner.`,
    talentTitle: `Meet approved ${role} candidates`,
    talentIntro: "Review relevant experience, tools, working hours, and profile evidence before you decide who to interview.",
    responsibilityTitle: `What can ${articleFor(s.name)} ${role} take off your team’s plate?`,
    responsibilityIntro: `Delegate repeatable ${s.focus} while keeping specialist decisions, approvals, and exceptions with the right person on your team.`,
    toolsTitle: "Hire for workflow fluency, not a software checklist.",
    fitTitle: `Where ${role} support can create leverage`,
    fitIntro: "The same title can cover very different work. Define the business context, systems, hours, response expectations, and escalation rules before you compare candidates.",
    finalTitle: `Build ${articleFor(s.name)} ${role} role around the work you need done.`,
    finalBody: "Tell us the responsibilities, tools, hours, schedule, and level of independence you need. Your role brief is private and you can start without creating an account."
  };

  if (s.slug !== "law-firm-virtual-assistant") return defaults;

  return {
    hero: "Hire a Philippines-based law firm virtual assistant to keep client intake, matter setup, calendars, document organization, billing administration, case-management updates, and client follow-up moving. Compare approved candidates by legal workflow experience, tools, schedule, and communication before you interview.",
    panelTitle: "Keep routine legal operations moving without pulling attorneys into every admin task.",
    talentTitle: "Review law firm Virtual Assistants with relevant workflow experience",
    talentIntro: "Compare approved candidates by law firm experience, case-management tools, availability, communication, and the type of work they have supported.",
    responsibilityTitle: "What can a law firm virtual assistant take off your team’s plate?",
    responsibilityIntro: "A law firm Virtual Assistant can own repeatable administrative work around intake, matters, calendars, documents, billing support, and client follow-up while attorneys retain legal judgment and privileged strategy.",
    toolsTitle: "Look for legal workflow fluency, confidentiality, and strong follow-through.",
    fitTitle: "Where a law firm Virtual Assistant can create the most leverage",
    fitIntro: "The best scope depends on your practice area, case volume, intake process, case-management system, client response standards, and what must stay with attorneys or paralegals.",
    finalTitle: "Give your law firm’s recurring admin work a clear owner.",
    finalBody: "Tell us your practice area, intake flow, case-management tools, hours, and the work you want to delegate. We will use the role brief to help you compare relevant Philippines-based talent."
  };
}


const GENERIC_COST_FACTORS = [
  "Full-time or part-time schedule",
  "Relevant experience and independence",
  "Required live overlap and response times",
  "Tool or platform specialization",
  "Scope, complexity, and decision ownership"
];

function costFactorsFor(s: ServiceSeoPage) {
  const specific = s.costFactors.filter((factor) => !GENERIC_COST_FACTORS.includes(factor));
  const derived = [
    `How much ${s.tasks[0]} you need each week, and whether it is steady or seasonal`,
    `Depth in ${s.tools.slice(0, 2).join(" and ")} rather than general familiarity`,
    `Whether the role owns ${s.tasks[1]} end to end or hands it back for review`,
    `Live overlap with your hours, which matters more for ${preserveAcronyms(s.focus)}`
  ];
  return [...specific, ...derived].slice(0, 4);
}

function serviceEditorial(s: ServiceSeoPage) {
  const tasks = s.tasks;
  const tools = s.tools;
  const skills = s.skills;
  const role = roleName(s.name);
  const groupNotes: Record<string, { operating: string; quality: string; handoff: string }> = {
    "Marketing & Growth": {
      operating: "Give the Virtual Assistant a written brief, a source of truth for brand and campaign rules, and a clear review cadence. Marketing work gets messy when drafts, approvals, tracking links, and reporting live in different places.",
      quality: "Check accuracy before volume. Good work should match the brief, use the right source data, preserve brand standards, and leave enough documentation for someone else to understand what changed and why.",
      handoff: "Keep positioning, budget changes, claims, final publishing approval, and material strategy decisions with the accountable marketer unless you have explicitly delegated them."
    },
    "Healthcare": {
      operating: "Design the role around a documented non-clinical workflow. Limit access to the minimum systems and records needed, define how patient information is handled, and make escalation rules explicit before the Virtual Assistant starts.",
      quality: "Accuracy, privacy, timestamps, and complete notes matter more than raw speed. Spot-check records and calls early so errors do not compound across scheduling, billing, referrals, or follow-up.",
      handoff: "Clinical judgment, diagnosis, treatment advice, controlled decisions, and work reserved for licensed professionals stay with the appropriate clinician or qualified staff member."
    },
    "Legal": {
      operating: "Map the administrative workflow by matter stage: intake, conflict or eligibility checks handled by the firm, file setup, deadlines, documents, client follow-up, billing support, and closure. The Virtual Assistant should always know which system is the source of truth.",
      quality: "Legal support needs disciplined naming, dates, version control, confidentiality, and clean handoffs. Review a sample of matters closely during onboarding before expanding access or independence.",
      handoff: "Legal advice, legal strategy, privileged judgment, signing authority, and work reserved to attorneys or licensed professionals remain with qualified counsel."
    },
    "Finance & Accounting": {
      operating: "Separate data preparation from approval. The Virtual Assistant can gather source documents, update systems, reconcile records, flag exceptions, and prepare work for review while the client keeps control of approvals and financial authority.",
      quality: "A good finance workflow has traceable source documents, clear cut-off dates, reconciliation checks, and an exception list. If a number cannot be tied back to a source, it should be flagged rather than guessed.",
      handoff: "Payments, bank authority, tax positions, final journal approval, financial advice, and other controlled decisions should stay with the client or appropriately qualified professional."
    },
    "Finance & Insurance": {
      operating: "Document the policy, client, and renewal workflow before delegating it. Use role-based access, a clear checklist, and a visible queue for missing documents, follow-up dates, and items that require licensed review.",
      quality: "Check names, dates, policy details, supporting documents, and status fields against the source. Regulated workflows need an audit trail and a clear reason for every exception or escalation.",
      handoff: "Licensed advice, recommendations, binding authority, compliance sign-off, and decisions that carry financial or regulatory risk remain with the authorized professional."
    },
    "Insurance & Finance": {
      operating: "Document the policy, client, and renewal workflow before delegating it. Use role-based access, a clear checklist, and a visible queue for missing documents, follow-up dates, and items that require licensed review.",
      quality: "Check names, dates, policy details, supporting documents, and status fields against the source. Regulated workflows need an audit trail and a clear reason for every exception or escalation.",
      handoff: "Licensed advice, recommendations, binding authority, compliance sign-off, and decisions that carry financial or regulatory risk remain with the authorized professional."
    },
    "Finance & Lending": {
      operating: "Build the role around a documented loan file process: document collection, checklist progress, system updates, borrower follow-up, lender requests, and exception tracking. Each file should have a clear next action and owner.",
      quality: "Loan administration depends on complete files, correct dates, accurate status updates, and prompt follow-up. Use checklists and second-person review for high-impact fields instead of relying on memory.",
      handoff: "Credit decisions, lending advice, formal approvals, regulated disclosures, and activity requiring a license remain with authorized staff and lenders."
    },
    "Ecommerce": {
      operating: "Treat the store, help desk, and inventory system as connected sources of truth. Define which orders or listings the Virtual Assistant may resolve independently and which exceptions need a manager before a customer promise is made.",
      quality: "Watch order accuracy, SKU and listing details, response time, refund or replacement reasons, and unresolved exceptions. Ecommerce errors spread quickly when a wrong field is copied across products or channels.",
      handoff: "Pricing strategy, material refunds, supplier commitments, account ownership, and changes with margin or policy impact should follow the client’s approval rules."
    },
    "Sales & CRM": {
      operating: "Start with clean pipeline stages and a written definition of what qualifies as a lead, opportunity, booked appointment, or closed outcome. The Virtual Assistant should update the CRM as the work happens, not at the end of the week.",
      quality: "Review contact accuracy, duplicate handling, activity notes, follow-up dates, disposition codes, and handoff quality. A busy pipeline is not useful if nobody can trust its data.",
      handoff: "Commercial terms, discounts, binding commitments, sensitive negotiations, and exceptions outside the approved script or process stay with the sales owner."
    },
    "Real Estate": {
      operating: "Anchor the role to the transaction, listing, property, or lead record your team already uses. Define response-time expectations and make every open item visible so follow-up is not trapped in personal inboxes.",
      quality: "Dates, contact details, property information, document status, and next actions need consistent checking. Real-estate admin works best when every handoff leaves a timestamped note and a clear owner.",
      handoff: "Licensed representation, negotiations, trust-account activity, legal interpretations, and decisions reserved to agents, brokers, property managers, or other licensed professionals remain with them."
    },
    "Home Services": {
      operating: "Build the Virtual Assistant’s day around the service board: new enquiries, booked jobs, technician or crew schedules, quotes awaiting action, parts or document follow-up, and completed work that still needs invoicing or customer contact.",
      quality: "Address, contact details, job scope, appointment windows, status codes, and customer notes need to be correct. A small scheduling error can waste a field team’s time, so use confirmation steps for changes.",
      handoff: "Technical diagnosis, site safety, trade decisions, final estimates, and commitments outside approved pricing or service rules stay with qualified field staff or managers."
    },
    "Creative & Content": {
      operating: "Give the Virtual Assistant a usable brief: audience, objective, examples, format, deadline, source material, and who approves the final work. Keep feedback in one place so revisions do not become a chain of conflicting messages.",
      quality: "Review factual accuracy, brand consistency, file specifications, naming, version control, and whether the work answers the brief. A polished asset that solves the wrong problem is still a miss.",
      handoff: "Final brand direction, sensitive claims, rights clearance, major creative changes, and publishing decisions should follow the client’s approval process."
    },
    "Technology & Web": {
      operating: "Use tickets or a documented backlog with acceptance criteria, environment details, access boundaries, and a rollback path. Avoid handing over broad production access before the Virtual Assistant has shown how they work in a controlled environment.",
      quality: "Require reproducible steps, testing notes, screenshots or logs where useful, and a record of what changed. Technical work should be reviewable by someone other than the person who performed it.",
      handoff: "Production credentials, security-sensitive changes, architecture decisions, destructive actions, and releases with material business risk should follow explicit approval and access controls."
    },
    "Customer & Front Desk": {
      operating: "Give the Virtual Assistant a response guide, escalation matrix, opening hours, identity-verification rules where needed, and a reliable way to see customer history. Front-desk work breaks down when context is scattered.",
      quality: "Review response time, note quality, correct routing, promised follow-up, and whether issues are actually closed. Fast replies do not help if customers have to repeat themselves later.",
      handoff: "Refund exceptions, legal or safety complaints, sensitive account changes, and commitments outside approved policy should move to the designated manager."
    },
    "People & HR": {
      operating: "Use a documented candidate or employee workflow with clear stages, templates, ownership, and privacy boundaries. Keep interview feedback and status changes in the ATS or HR system rather than personal messages.",
      quality: "Check names, dates, stage accuracy, consent or document status, and follow-up commitments. Candidate experience depends on timely communication and reliable records.",
      handoff: "Hiring decisions, compensation decisions, employment advice, investigations, and other sensitive HR judgment remain with authorized client staff."
    },
    "Recruitment": {
      operating: "Define the target profile before sourcing begins: must-have experience, location or timezone rules, compensation boundaries, disqualifiers, and what evidence counts as relevant. Store research and outreach status in the ATS or agreed tracker.",
      quality: "Audit a sample of sourced profiles for relevance, duplicate records, contact accuracy, and notes that explain why each person matches. Volume without fit creates more work for recruiters downstream.",
      handoff: "Final screening decisions, interview judgment, offers, compensation negotiation, and employment decisions stay with the recruiter or hiring manager."
    },
    "Architecture & Engineering": {
      operating: "Set drawing standards, file naming, model ownership, issue tracking, and review gates before production work starts. Use controlled folders and agreed software versions so files can move between team members safely.",
      quality: "Check dimensions, families or components, sheet standards, revisions, coordinates, annotations, and model warnings against the project brief. Production speed should never replace technical review.",
      handoff: "Design responsibility, engineering judgment, professional certification, site decisions, and final issue for construction stay with appropriately qualified project professionals."
    },
    "Hospitality": {
      operating: "Run the role from a shared reservation or property workflow with clear guest-response standards, check-in information, vendor contacts, and escalation rules for urgent issues. Keep property-specific instructions current.",
      quality: "Review booking details, guest messages, dates, access instructions, maintenance status, and handoffs between shifts. Hospitality problems become expensive when small details are missed before arrival.",
      handoff: "Safety incidents, major refunds, disputes, pricing exceptions, property emergencies, and commitments outside the approved playbook should escalate to the owner or manager."
    },
    "Executive Support": {
      operating: "Agree on priorities, calendar rules, inbox triage, meeting standards, and what the Virtual Assistant can decide without asking. Executive support improves quickly when preferences are written down instead of rediscovered every day.",
      quality: "Check calendar conflicts, context in meeting notes, completeness of follow-up, confidentiality, and whether important items are surfaced early. The goal is fewer surprises, not simply fewer emails.",
      handoff: "Sensitive personnel matters, strategic commitments, legal or financial approvals, and messages that require the executive’s judgment stay with the executive unless specifically delegated."
    },
    "Admin & Operations": {
      operating: "Turn recurring work into a visible queue with an owner, due date, source of truth, and definition of done. The Virtual Assistant should not need to chase the manager for routine context that can live in an SOP or checklist.",
      quality: "Look for clean records, complete notes, correct dates, sensible file organization, and a clear exception list. Good admin work makes the next person’s job easier.",
      handoff: "Approvals, sensitive financial actions, policy exceptions, and decisions with material customer, legal, or operational risk should remain with the accountable manager."
    }
  };
  const note = groupNotes[s.group] || groupNotes["Admin & Operations"];
  return {
    operating: note.operating,
    quality: note.quality,
    handoff: note.handoff,
    weekOne: `Start with ${tasks[0]}, ${tasks[1]}, and ${tasks[2]}. Give the Virtual Assistant examples of good completed work, access only to the systems needed for those tasks, and a short daily check-in while the process is still new.`,
    weekTwo: `Once the basics are consistent, add ${tasks[3] || tasks[0]} and ${tasks[4] || tasks[1]}. Ask the Virtual Assistant to document recurring questions and turn repeat answers into a checklist or SOP instead of relying on chat history.`,
    monthOne: `By the end of the first month, review whether ${tasks.slice(0, 3).join(", ")} are running consistently, exceptions are recorded instead of hidden, and the remaining decisions that need your input are clearly documented.`,
    evidence: [
      `A real example of ${tasks[0]} and how accuracy was checked`,
      `A clear explanation of how they use ${tools[0]}${tools[1] ? ` and ${tools[1]}` : ""} in day-to-day work`,
      `A practical example showing ${skills[0]} rather than a self-rating`,
      `A time they escalated an unclear ${tasks[1]} case instead of guessing`
    ],
    avoid: [
      `Do not combine ${tasks[0]}, ${tasks[1]}, and unrelated specialist work into one role without setting priorities.`,
      `Do not hand over full ${tools[0]} access on day one. Give the minimum permissions ${tasks[0]} actually needs, and widen it as the work proves out.`,
      `Do not judge this role on activity counts. For ${role} work, accuracy on ${tasks[1]} and the state of unresolved exceptions matter far more than hours logged.`
    ],
    context: `For ${s.bestFor.slice(0, 2).join(" and ")}, the strongest ${role} setup is usually a defined operating role rather than a loose list of errands. The client owns the process and decisions; the Virtual Assistant owns the recurring execution that has been clearly delegated.`,
    scorecard: [
      `${toTitle(tasks[0])}: completed on time, with exceptions recorded instead of hidden`,
      `${toTitle(tasks[1])}: accuracy or rework rate based on a sample the manager actually reviews`,
      `${toTitle(tasks[2])}: turnaround time from a complete request to a usable result`,
      `Open items: any ${tasks[0]} blocked past the agreed response window, with the blocker and next owner named`,
      `Documentation: ${tools[0]} records current enough that someone else could pick up ${tasks[0]} tomorrow`
    ],
    notFit: `${role} support is the wrong answer when there is no repeatable process for ${tasks[0]}, when the work is mostly one-off specialist judgment, or when you need someone to own regulated or financial decisions outside their authority. Settle the process first, then delegate the recurring layer around it.`
  };
}

function bestFitCopy(item: string, s: ServiceSeoPage, index: number) {
  if (s.slug === "law-firm-virtual-assistant") {
    const copy: Record<string, string> = {
      "solo attorneys": "Protect attorney time by delegating intake follow-up, scheduling, matter setup, file organization, and routine client communication.",
      "small law firms": "Create consistent ownership across intake, calendars, documents, billing admin, and case-management updates as caseload grows.",
      "immigration firms": "Keep document collection, appointment coordination, matter records, client reminders, and supervised case support organized.",
      "litigation practices": "Support deadline tracking, document organization, matter updates, scheduling, and administrative follow-through while legal strategy stays with counsel."
    };
    if (copy[item]) return copy[item];
  }
  const firstTask = s.tasks[index % s.tasks.length];
  const secondTask = s.tasks[(index + 1) % s.tasks.length];
  return `${toTitle(item)} can use this role to keep ${firstTask} and ${secondTask} moving consistently while higher-risk decisions stay with the appropriate manager or specialist.`;
}

const TALENT_MATCH_STOP_WORDS = new Set(["virtual","assistant","support","specialist","manager","management","service","services","philippines","the","and","for","with"]);

function talentRelevanceScore(va: any, service: ServiceSeoPage) {
  const normalize = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9+#.& -]+/g, " ").replace(/\s+/g, " ").trim();
  const role = normalize(roleName(service.name));
  const headline = normalize(va.headline);
  const categoryText = normalize([va.primary_category, ...(va.categories || [])].join(" "));
  const skillsText = normalize((va.skills || []).join(" "));
  const toolsText = normalize((va.tools || []).join(" "));
  const bio = normalize(va.bio);
  const haystack = [headline, categoryText, skillsText, toolsText, bio].join(" ");
  let score = 0;

  if (role.length >= 3 && haystack.includes(role)) score += 8;

  const roleTokens = role.split(/\s+/).filter((token) => token.length >= 3 && !TALENT_MATCH_STOP_WORDS.has(token));
  for (const token of roleTokens) if (haystack.includes(token)) score += 2;

  for (const skill of service.skills.slice(0, 6)) {
    const target = normalize(skill);
    if (target.length >= 4 && (skillsText.includes(target) || target.split(/\s+/).some((token) => token.length >= 5 && skillsText.includes(token)))) score += 2;
  }

  for (const tool of service.tools.slice(0, 6)) {
    const target = normalize(tool);
    if (target.length >= 3 && toolsText.includes(target)) score += 1;
  }

  return score;
}

async function getTalent(service: ServiceSeoPage) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await supabase
      .from("public_va_directory")
      .select("user_id,slug,full_name,headline,bio,avatar_url,primary_category,categories,skills,tools,years_experience,weekly_hours,overlap_hours")
      .limit(120);
    return (data || [])
      .filter((va: any) => Boolean(va.slug) && [va.primary_category, ...(va.categories || [])].filter(Boolean).includes(service.directoryCategory))
      .map((va: any) => ({ ...va, _serviceRelevance: talentRelevanceScore(va, service) }))
      .sort((a: any, b: any) => Number(b._serviceRelevance) - Number(a._serviceRelevance) || Number(Boolean(b.avatar_url)) - Number(Boolean(a.avatar_url)) || Number(b.years_experience || 0) - Number(a.years_experience || 0))
      // Relevance beats density. A specialist page should show fewer people
      // rather than backfill with weak matches from a broad directory category.
      .filter((va: any) => va._serviceRelevance >= 4)
      .slice(0, 6);
  } catch {
    return [];
  }
}

export default async function ServiceSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) notFound();
  const s = page!;
  const article = articleFor(s.name);
  const groups = taskGroups(s.tasks, s.name);
  const copy = experienceCopy(s);
  const related = s.relatedSlugs.map(servicePageBySlug).filter(Boolean);
  const relatedIndustries = INDUSTRIES.filter((industry) => industry.serviceSlugs.includes(s.slug)).slice(0, 4);
  const guides = serviceBlogPosts(s.slug, 6);
  const talent = await getTalent(s);
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const pageUrl = `${base}/service/${s.slug}`;
  const regulated = complianceNote(s.slug, s.group);
  const editorial = serviceEditorial(s);
  const talentHref = `/find-talent?category=${encodeURIComponent(s.directoryCategory)}&q=${encodeURIComponent(roleName(s.name))}`;
  const matchExample = `Handle ${s.tasks.slice(0, 3).join(", ")} and keep our team updated on progress, exceptions, and next steps.`;

  const interviewQuestions = [
    { q: `Walk me through how you would handle ${s.tasks[0]} from intake to completion.`, a: "A concrete process, the information they need first, quality checks, documentation, and when they would ask for clarification." },
    { q: `How do you keep ${s.tasks[1]} accurate and up to date?`, a: "A repeatable checking method, source-of-truth discipline, clear ownership, and a way to surface exceptions instead of hiding them." },
    { q: `Which ${roleName(s.name)} tools have you used most often?`, a: "Practical depth in tools relevant to your stack, with examples of what they completed and how they checked the result." },
    { q: "What would you escalate instead of deciding on your own?", a: "Good judgment about permissions, client or customer risk, financial impact, compliance, unusual exceptions, and decisions outside the agreed scope." },
    { q: `Show me an example of work closest to ${s.focus}.`, a: "Evidence that resembles your workflow, plus a clear explanation of the candidate's contribution, quality checks, and result." }
  ];

  const faqs = [
    { q: `What does ${article} ${s.name} do?`, a: `${s.name} work can include ${s.tasks.slice(0, 5).join(", ")}. The right scope depends on your process, tools, decision boundaries, and the candidate's experience.` },
    { q: `Can I hire ${article} ${s.name} in the Philippines?`, a: `Yes. VirtualAssistant.com.ph helps businesses compare Philippines-based virtual assistants by relevant skills, tools, experience, availability, communication, and role fit.` },
    { q: `What tools should ${article} ${s.name} know?`, a: `Common tools for this role include ${s.tools.slice(0, 6).join(", ")}. Require only the platforms your hire will use, then verify practical familiarity during the interview.` },
    { q: `How much does ${article} ${s.name} cost?`, a: "Rates vary with experience, specialization, schedule, live-overlap requirements, technical depth, and how independently the person is expected to operate. Compare scope and evidence of fit, not only the lowest hourly rate." },
    { q: `How do I choose the best ${s.name}?`, a: `Start with the work the person must own. Then compare relevant experience, ${s.skills.slice(0, 4).join(", ")}, communication, availability, and examples that show they can execute your workflow.` },
    { q: "Can this role be part-time?", a: "Often, yes. Define the workload, response-time expectations, and required schedule overlap first so candidates can tell you whether the hours are realistic." }
  ];

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: `Hire ${article} ${s.name} in the Philippines`,
      serviceType: s.name,
      url: pageUrl,
      description: serviceMetaDescription(s),
      provider: organizationRef(base),
      areaServed: "Worldwide"
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Virtual Assistant Services", item: `${base}/services` },
        { "@type": "ListItem", position: 3, name: s.name, item: pageUrl }
      ]
    }
  ];

  return <>
    <SiteHeader />
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />

      <HiringHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/services", label: "Services" }, { label: s.name }]}
        eyebrow={`Filipino ${roleName(s.name)} VAs`}
        titleLead={`Hire ${article}`}
        titleAccent={s.name}
        titleTail="in the Philippines"
        lede={copy.hero}
        tasks={s.tasks.slice(0, 6).map(toTitle)}
        tools={s.tools}
        talent={talent}
        talentLabel={`Approved ${roleName(s.name)} VAs you can interview`}
        primary={{ href: "#talent", label: `Browse ${roleName(s.name)} VAs`, track: `service_${s.slug.replaceAll("-", "_")}_browse` }}
        secondary={{ href: "#responsibilities", label: "See what you can delegate" }}
        form={<HiringBriefForm
          variant="service"
          slug={s.slug}
          category={s.directoryCategory}
          roleLabel={roleName(s.name)}
          example={matchExample}
          talentHref={talentHref}
        />}
      />

      <div className="hs-root sp-root">
        <Band tone="soft" id="talent">
          <SectionHead
            kicker="Approved talent"
            title={copy.talentTitle}
            lede={copy.talentIntro}
            action={<Link className="hs-btn hs-btn-ghost" href={talentHref}>See all relevant talent <ArrowRight size={16}/></Link>}
          />
          {talent.length ? <>
            <div className="hs-talent-grid">
              {talent.slice(0, 3).map((va: any) => <article className="hs-talent-card" key={va.user_id}>
                <div className="hs-talent-top">
                  <PublicAvatar name={va.full_name} src={va.avatar_url} size="lg"/>
                  <div className="hs-talent-badges">
                    <span className="hs-badge hs-badge-green"><BadgeCheck size={13} aria-hidden="true"/> Approved</span>
                    {va.years_experience != null ? <span className="hs-badge hs-badge-blue"><BriefcaseBusiness size={13} aria-hidden="true"/> {va.years_experience}+ yrs</span> : null}
                  </div>
                </div>
                <h3>{va.full_name}</h3>
                <p className="hs-talent-role">{va.headline || va.primary_category || "Virtual Assistant"}</p>
                <div className="hs-tags">{uniqueStrings(va.skills).slice(0, 4).map((x, index) => <span key={`${String(x)}-${index}`}>{x}</span>)}</div>
                <div className="hs-facts">
                  <span><Clock3 size={14} aria-hidden="true"/> {va.weekly_hours ? `${va.weekly_hours} hrs/week available` : "Availability confirmed on request"}</span>
                </div>
              </article>)}
            </div>
            <p className="sp-note">Want us to narrow the list for you? <a className="hs-link" href="#hiring-brief">Send a quick brief <ArrowRight size={14}/></a></p>
          </> : <div className="sp-empty"><Search size={24} aria-hidden="true"/><div><h3>Tell us the exact version of this role you need.</h3><p>Availability changes. Send the workload, hours, and workflow context so we can identify relevant approved talent.</p></div><a className="hs-btn hs-btn-primary" href="#hiring-brief">Send a quick brief <ArrowRight size={16}/></a></div>}
        </Band>

        <JumpNav links={[
          { href: "#responsibilities", label: "Responsibilities" },
          { href: "#onboarding", label: "First 30 days" },
          { href: "#tools", label: "Tools & skills" },
          { href: "#hiring", label: "Hiring process" },
          { href: "#interview", label: "Interview guide" },
          { href: "#faqs", label: "FAQs" }
        ]}/>

        <Band id="responsibilities">
          <SectionHead kicker="Responsibilities" title={copy.responsibilityTitle} lede={copy.responsibilityIntro}/>
          <div className="sp-cards-3">
            {groups.map((group) => <article className="sp-card" key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.intro}</p>
              <CheckList items={group.tasks.map(toTitle)}/>
            </article>)}
          </div>
          <div className="sp-inline-cta">
            <div><strong>Not sure what to delegate? Start with the work that repeats every week.</strong><p>List the recurring tasks, bottlenecks, tools, response times, and approvals. That is usually enough to define the first version of the role.</p></div>
            <a className="hs-btn hs-btn-primary" href="#hiring-brief">Send a quick brief <ArrowRight size={16}/></a>
          </div>
        </Band>

        <Band tone="soft">
          <div className="sp-split">
            <div>
              <SectionHead kicker="How the role works" title="Set up the work before you hand it over."/>
              <div className="hs-prose"><p>{editorial.context}</p><p>{editorial.operating}</p><p>{editorial.quality}</p><p>{editorial.handoff}</p></div>
            </div>
            <aside className="sp-panel">
              <span className="sp-panel-label">What to verify in an interview</span>
              <h3>Ask for proof that matches the job.</h3>
              <CheckList items={editorial.evidence}/>
            </aside>
          </div>
        </Band>

        <Band id="onboarding">
          <SectionHead center kicker="First 30 days" title={`A practical onboarding plan for ${article} ${s.name}`} lede="Keep the first month narrow enough to review properly. Add scope only after the original workflow is accurate and predictable."/>
          <Steps columns={3} items={[
            { label: "Week 1", title: "Learn the workflow", copy: editorial.weekOne },
            { label: "Weeks 2–3", title: "Add ownership", copy: editorial.weekTwo },
            { label: "Week 4", title: "Review by outcomes", copy: editorial.monthOne }
          ]}/>
        </Band>

        <Band tone="soft">
          <SectionHead kicker="Common hiring mistakes" title="Three mistakes that make this role harder than it needs to be"/>
          <div className="sp-cards-3">
            {editorial.avoid.map((item) => <article className="sp-card sp-card-warn" key={item}><TriangleAlert size={20} aria-hidden="true"/><p>{item}</p></article>)}
          </div>
        </Band>

        <Band>
          <div className="sp-split">
            <div>
              <SectionHead kicker="Managing the role" title="Use a small scorecard instead of watching every click." lede="For the first month, review a few measures that tell you whether the work is dependable. The exact targets should come from your own workload and service standards."/>
              <CheckList tone="green" items={editorial.scorecard}/>
            </div>
            <aside className="sp-panel sp-panel-dark">
              <span className="sp-panel-label">When this role is not a fit</span>
              <h3>Do not outsource a broken decision process.</h3>
              <p>{editorial.notFit}</p>
            </aside>
          </div>
        </Band>

        <Band tone="soft" id="tools">
          <div className="sp-split">
            <div>
              <SectionHead kicker="Tools and skills" title={copy.toolsTitle} lede="Software familiarity matters, but process judgment matters more. Ask candidates to explain what they completed inside the tool, how they checked accuracy, and what they escalated."/>
              <div className="sp-pills">{uniqueStrings(s.tools).map((tool, index) => <span key={`${String(tool)}-${index}`}><Wrench size={13} aria-hidden="true"/>{tool}</span>)}</div>
            </div>
            <aside className="sp-panel">
              <span className="sp-panel-label">Skills to evaluate</span>
              <h3>Look for evidence, not just keywords.</h3>
              <CheckList items={uniqueStrings(s.skills).map(toTitle)}/>
              <p className="sp-panel-foot">Use your actual workflow during the interview. A practical example reveals more than a list of tools.</p>
            </aside>
          </div>
        </Band>

        <Band>
          <SectionHead kicker="Best-fit teams" title={copy.fitTitle} lede={copy.fitIntro}/>
          <div className="sp-cards-4">
            {uniqueStrings(s.bestFor).map((item, index) => <article className="sp-card" key={`${String(item)}-${index}`}><span className="sp-card-icon" aria-hidden="true"><UsersRound size={18}/></span><h3>{toTitle(item)}</h3><p>{bestFitCopy(item, s, index)}</p></article>)}
          </div>
          {regulated ? <div className="sp-notice"><ShieldCheck size={22} aria-hidden="true"/><div><strong>Scope and compliance: keep regulated judgment with the responsible professional.</strong><p>{regulated}</p></div></div> : null}
        </Band>

        <Band tone="soft">
          <SectionHead kicker="Write the role first" title={`What to include in your ${s.name} job brief`} lede="A clear role brief makes candidate comparison easier because everyone is being evaluated against the same work, systems, schedule, and decision boundaries."/>
          <div className="sp-cards-4">
            <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><ClipboardList size={18}/></span><h3>Responsibilities</h3><p>List recurring tasks and the result the Virtual Assistant should own. Separate daily, weekly, and occasional work.</p></article>
            <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><KeyRound size={18}/></span><h3>Tools and access</h3><p>Name the systems used from week one and decide which permissions can be granted safely after onboarding.</p></article>
            <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><Clock3 size={18}/></span><h3>Hours and overlap</h3><p>State weekly hours, timezone, required live coverage, response expectations, and whether the schedule is fixed or flexible.</p></article>
            <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><Split size={18}/></span><h3>Decision boundaries</h3><p>Explain what the Virtual Assistant may handle independently, what needs approval, and what should be escalated immediately.</p></article>
          </div>
        </Band>

        <Band id="hiring">
          <SectionHead center kicker="Hiring process" title={`How to hire ${article} ${s.name} in the Philippines`} lede="Define the work first, then test candidates on the evidence and judgment that matter for that exact scope."/>
          <Steps items={[
            { title: "Define the work", copy: "Document responsibilities, tools, hours, budget, schedule, and the result the person should own." },
            { title: "Review relevant talent", copy: "Compare role experience, tools, communication, schedule, and work evidence rather than broad profile claims." },
            { title: "Interview with real scenarios", copy: "Use examples from your workflow to understand process, quality checks, judgment, and limits." },
            { title: "Confirm the hire", copy: "Agree on final rate, start date, hours, responsibilities, reporting, and onboarding before work begins." }
          ]}/>
          <div className="sp-center"><a className="hs-btn hs-btn-primary" href="#hiring-brief">Start with a quick brief <ArrowRight size={16}/></a></div>
        </Band>

        <Band tone="soft">
          <div className="sp-split">
            <div>
              <SectionHead kicker="Why the Philippines?" title="Hire for role fit, communication, and execution quality."/>
              <div className="hs-prose">
                <p>Philippines-based remote professionals work across international teams and common cloud tools, but location alone does not guarantee fit. Evaluate relevant experience, communication, work evidence, schedule, and judgment for the workflow you need.</p>
                <p>VirtualAssistant.com.ph gives you a structured path from private role brief to approved profiles, candidate review, interview, and confirmed hiring terms.</p>
              </div>
              <Link className="hs-link sp-link-gap" href="/how-vetting-works">See how Virtual Assistants are vetted <ArrowRight size={14}/></Link>
            </div>
            <aside className="sp-panel">
              <span className="sp-panel-label"><CircleDollarSign size={14} aria-hidden="true"/> Cost and scope</span>
              <h3>How much does {article} {s.name} cost?</h3>
              <p>There is no single rate for this role. What moves the number for {article} {s.name} is scope and depth, so compare the work and the evidence of fit before comparing hourly figures.</p>
              <CheckList items={costFactorsFor(s)}/>
              <Link className="hs-link" href="/pricing">See how pricing works <ArrowRight size={14}/></Link>
            </aside>
          </div>
        </Band>

        <Band id="interview">
          <SectionHead kicker="Interview guide" title={`Questions to ask ${s.name} candidates`} lede="Use practical questions to reveal process, judgment, quality checks, communication, and decision boundaries."/>
          <div className="sp-qa">
            {interviewQuestions.map((item) => <article className="sp-qa-item" key={item.q}>
              <span className="sp-qa-icon" aria-hidden="true"><MessageSquareText size={17}/></span>
              <div><h3>{item.q}</h3><p><strong>Listen for:</strong> {item.a}</p></div>
            </article>)}
          </div>
        </Band>

        <Band tone="soft" id="faqs">
          <FaqBlock kicker="Frequently asked questions" title={`Hiring ${s.name} talent in the Philippines`} lede="Common questions to resolve before you start interviewing." faqs={faqs}/>
        </Band>

        {guides.length ? <Band>
          <SectionHead kicker="Hiring guides" title="Research the role before you interview." lede="Use these supporting guides for task scope, cost planning, interview questions, job descriptions, tools, and onboarding. Each guide links back to this hiring page when you are ready to compare talent."/>
          <div className="sp-guides">
            {guides.map((guide) => <Link className="sp-guide" href={blogHref(guide)} key={guide.slug} data-track="service_blog_guide">
              <span className="sp-guide-type"><BookOpen size={14} aria-hidden="true"/>{guide.intent === "comparison" ? "Comparison" : guide.intent === "commercial" ? "Hiring guide" : "Practical guide"}</span>
              <h3>{guide.title}</h3>
              <p>{guide.excerpt}</p>
              <span className="hs-link">Read guide <ArrowRight size={14}/></span>
            </Link>)}
          </div>
        </Band> : null}

        <Band tone={guides.length ? "soft" : "white"}>
          <div className="sp-related">
            <div>
              <SectionHead kicker="Related services" title="Build support around the workflow, not just the title." lede={`These roles often overlap with or complement ${s.name} responsibilities.`}/>
              <LinkTiles items={related.filter(Boolean).map((item) => ({ href: `/service/${item!.slug}`, label: item!.name, icon: <Search size={16}/> }))}/>
            </div>
            {relatedIndustries.length ? <div>
              <SectionHead kicker="Industry guides" title="See how this role fits specific business workflows." lede="Industry guides connect the role to the systems, access rules, customers, and handoffs that change by business type."/>
              <LinkTiles items={relatedIndustries.map((industry) => ({ href: `/industries/${industry.slug}`, label: `Virtual Assistant guide for ${industry.label}`, sub: `See how ${s.name} work fits the workflows used by ${industry.audience}.`, icon: <UsersRound size={16}/> }))}/>
            </div> : null}
          </div>
        </Band>

        <CtaBand
          title={copy.finalTitle}
          body={copy.finalBody}
          primary={{ href: "#hiring-brief", label: "Send a quick brief", track: `service_${s.slug.replaceAll("-", "_")}_final_cta` }}
          secondary={{ href: "/pricing", label: "See how pricing works" }}
        />
      </div>

    </main>
    <SiteFooter />
  </>;
}
