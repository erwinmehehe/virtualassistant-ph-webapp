import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Search,
  ShieldCheck,
  UsersRound,
  Wrench
} from "lucide-react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicAvatar } from "@/components/public-avatar";
import { ServiceMatchForm } from "@/components/service-match-form";
import { SERVICE_PAGES, servicePageBySlug, type ServiceSeoPage } from "@/lib/service-pages";
import { blogHref, serviceBlogPosts } from "@/lib/blog";
import { INDUSTRIES } from "@/lib/industries";
import { uniqueStrings } from "@/lib/collections";

export const revalidate = 3600;

export function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) return {};
  const canonical = `/service/${page.slug}`;
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    keywords: [page.primaryKeyword, page.name.toLowerCase(), `${page.name.toLowerCase()} philippines`, `filipino ${page.name.toLowerCase()}`],
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: page.metaTitle, description: page.metaDescription },
    twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription }
  };
}

function articleFor(name: string) {
  return /^(SEO|NDIS|SMSF|HVAC|IT|Executive|Ecommerce|Admin|Accounting|Email)\b/i.test(name) || /^[AEIOU]/i.test(name) ? "an" : "a";
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function toTitle(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
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
  if (slug === "credit-repair-virtual-assistant") return "Use the VA for documented administrative workflows such as intake, CRM updates, document collection, and follow-up. Credit-repair compliance, dispute strategy, representations, and legal obligations remain with the client company and appropriately qualified professionals.";
  if (group === "Healthcare") return "Keep the role non-clinical unless the person is separately qualified and authorized for the work. Your organization remains responsible for privacy, system access, supervision, and clinical or billing compliance.";
  if (group === "Legal") return "Use the VA for supervised administrative and support work. Legal advice, attorney judgment, privileged strategy, and work reserved to licensed professionals remain with qualified counsel. Define confidentiality, access, supervision, and jurisdiction-specific boundaries before onboarding.";
  if (group === "Finance & Insurance") return "Define which activities require a license, certification, approval, or local supervision. The client organization remains responsible for regulated advice, compliance, access controls, and final review.";
  return null;
}

function experienceCopy(s: ServiceSeoPage) {
  const role = s.name.toLowerCase();
  const focus = roleName(s.name).toLowerCase();
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
    finalTitle: `Build a ${role} role around the work you need done.`,
    finalBody: "Tell us the responsibilities, tools, hours, schedule, and level of independence you need. Your role brief is private and you can start without creating an account."
  };

  if (s.slug !== "law-firm-virtual-assistant") return defaults;

  return {
    hero: "Hire a Philippines-based law firm virtual assistant to keep client intake, matter setup, calendars, document organization, billing administration, case-management updates, and client follow-up moving. Compare approved candidates by legal workflow experience, tools, schedule, and communication before you interview.",
    panelTitle: "Keep routine legal operations moving without pulling attorneys into every admin task.",
    talentTitle: "Review law firm VAs with relevant workflow experience",
    talentIntro: "Compare approved candidates by law firm experience, case-management tools, availability, communication, and the type of work they have supported.",
    responsibilityTitle: "What can a law firm virtual assistant take off your team’s plate?",
    responsibilityIntro: "A law firm VA can own repeatable administrative work around intake, matters, calendars, documents, billing support, and client follow-up while attorneys retain legal judgment and privileged strategy.",
    toolsTitle: "Look for legal workflow fluency, confidentiality, and strong follow-through.",
    fitTitle: "Where a law firm VA can create the most leverage",
    fitIntro: "The best scope depends on your practice area, case volume, intake process, case-management system, client response standards, and what must stay with attorneys or paralegals.",
    finalTitle: "Give your law firm’s recurring admin work a clear owner.",
    finalBody: "Tell us your practice area, intake flow, case-management tools, hours, and the work you want to delegate. We will use the role brief to help you compare relevant Philippines-based talent."
  };
}


function serviceEditorial(s: ServiceSeoPage) {
  const tasks = s.tasks;
  const tools = s.tools;
  const skills = s.skills;
  const role = roleName(s.name).toLowerCase();
  const groupNotes: Record<string, { operating: string; quality: string; handoff: string }> = {
    "Marketing & Growth": {
      operating: "Give the VA a written brief, a source of truth for brand and campaign rules, and a clear review cadence. Marketing work gets messy when drafts, approvals, tracking links, and reporting live in different places.",
      quality: "Check accuracy before volume. Good work should match the brief, use the right source data, preserve brand standards, and leave enough documentation for someone else to understand what changed and why.",
      handoff: "Keep positioning, budget changes, claims, final publishing approval, and material strategy decisions with the accountable marketer unless you have explicitly delegated them."
    },
    "Healthcare": {
      operating: "Design the role around a documented non-clinical workflow. Limit access to the minimum systems and records needed, define how patient information is handled, and make escalation rules explicit before the VA starts.",
      quality: "Accuracy, privacy, timestamps, and complete notes matter more than raw speed. Spot-check records and calls early so errors do not compound across scheduling, billing, referrals, or follow-up.",
      handoff: "Clinical judgment, diagnosis, treatment advice, controlled decisions, and work reserved for licensed professionals stay with the appropriate clinician or qualified staff member."
    },
    "Legal": {
      operating: "Map the administrative workflow by matter stage: intake, conflict or eligibility checks handled by the firm, file setup, deadlines, documents, client follow-up, billing support, and closure. The VA should always know which system is the source of truth.",
      quality: "Legal support needs disciplined naming, dates, version control, confidentiality, and clean handoffs. Review a sample of matters closely during onboarding before expanding access or independence.",
      handoff: "Legal advice, legal strategy, privileged judgment, signing authority, and work reserved to attorneys or licensed professionals remain with qualified counsel."
    },
    "Finance & Accounting": {
      operating: "Separate data preparation from approval. The VA can gather source documents, update systems, reconcile records, flag exceptions, and prepare work for review while the client keeps control of approvals and financial authority.",
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
      operating: "Treat the store, help desk, and inventory system as connected sources of truth. Define which orders or listings the VA may resolve independently and which exceptions need a manager before a customer promise is made.",
      quality: "Watch order accuracy, SKU and listing details, response time, refund or replacement reasons, and unresolved exceptions. Ecommerce errors spread quickly when a wrong field is copied across products or channels.",
      handoff: "Pricing strategy, material refunds, supplier commitments, account ownership, and changes with margin or policy impact should follow the client’s approval rules."
    },
    "Sales & CRM": {
      operating: "Start with clean pipeline stages and a written definition of what qualifies as a lead, opportunity, booked appointment, or closed outcome. The VA should update the CRM as the work happens, not at the end of the week.",
      quality: "Review contact accuracy, duplicate handling, activity notes, follow-up dates, disposition codes, and handoff quality. A busy pipeline is not useful if nobody can trust its data.",
      handoff: "Commercial terms, discounts, binding commitments, sensitive negotiations, and exceptions outside the approved script or process stay with the sales owner."
    },
    "Real Estate": {
      operating: "Anchor the role to the transaction, listing, property, or lead record your team already uses. Define response-time expectations and make every open item visible so follow-up is not trapped in personal inboxes.",
      quality: "Dates, contact details, property information, document status, and next actions need consistent checking. Real-estate admin works best when every handoff leaves a timestamped note and a clear owner.",
      handoff: "Licensed representation, negotiations, trust-account activity, legal interpretations, and decisions reserved to agents, brokers, property managers, or other licensed professionals remain with them."
    },
    "Home Services": {
      operating: "Build the VA’s day around the service board: new enquiries, booked jobs, technician or crew schedules, quotes awaiting action, parts or document follow-up, and completed work that still needs invoicing or customer contact.",
      quality: "Address, contact details, job scope, appointment windows, status codes, and customer notes need to be correct. A small scheduling error can waste a field team’s time, so use confirmation steps for changes.",
      handoff: "Technical diagnosis, site safety, trade decisions, final estimates, and commitments outside approved pricing or service rules stay with qualified field staff or managers."
    },
    "Creative & Content": {
      operating: "Give the VA a usable brief: audience, objective, examples, format, deadline, source material, and who approves the final work. Keep feedback in one place so revisions do not become a chain of conflicting messages.",
      quality: "Review factual accuracy, brand consistency, file specifications, naming, version control, and whether the work answers the brief. A polished asset that solves the wrong problem is still a miss.",
      handoff: "Final brand direction, sensitive claims, rights clearance, major creative changes, and publishing decisions should follow the client’s approval process."
    },
    "Technology & Web": {
      operating: "Use tickets or a documented backlog with acceptance criteria, environment details, access boundaries, and a rollback path. Avoid handing over broad production access before the VA has shown how they work in a controlled environment.",
      quality: "Require reproducible steps, testing notes, screenshots or logs where useful, and a record of what changed. Technical work should be reviewable by someone other than the person who performed it.",
      handoff: "Production credentials, security-sensitive changes, architecture decisions, destructive actions, and releases with material business risk should follow explicit approval and access controls."
    },
    "Customer & Front Desk": {
      operating: "Give the VA a response guide, escalation matrix, opening hours, identity-verification rules where needed, and a reliable way to see customer history. Front-desk work breaks down when context is scattered.",
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
      operating: "Agree on priorities, calendar rules, inbox triage, meeting standards, and what the VA can decide without asking. Executive support improves quickly when preferences are written down instead of rediscovered every day.",
      quality: "Check calendar conflicts, context in meeting notes, completeness of follow-up, confidentiality, and whether important items are surfaced early. The goal is fewer surprises, not simply fewer emails.",
      handoff: "Sensitive personnel matters, strategic commitments, legal or financial approvals, and messages that require the executive’s judgment stay with the executive unless specifically delegated."
    },
    "Admin & Operations": {
      operating: "Turn recurring work into a visible queue with an owner, due date, source of truth, and definition of done. The VA should not need to chase the manager for routine context that can live in an SOP or checklist.",
      quality: "Look for clean records, complete notes, correct dates, sensible file organization, and a clear exception list. Good admin work makes the next person’s job easier.",
      handoff: "Approvals, sensitive financial actions, policy exceptions, and decisions with material customer, legal, or operational risk should remain with the accountable manager."
    }
  };
  const note = groupNotes[s.group] || groupNotes["Admin & Operations"];
  return {
    operating: note.operating,
    quality: note.quality,
    handoff: note.handoff,
    weekOne: `Start with ${tasks[0]}, ${tasks[1]}, and ${tasks[2]}. Give the VA examples of good completed work, access only to the systems needed for those tasks, and a short daily check-in while the process is still new.`,
    weekTwo: `Once the basics are consistent, add ${tasks[3] || tasks[0]} and ${tasks[4] || tasks[1]}. Ask the VA to document recurring questions and turn repeat answers into a checklist or SOP instead of relying on chat history.`,
    monthOne: `By the end of the first month, you should be able to review the role through outputs rather than constant supervision: completed work, open exceptions, response times, and a short list of decisions waiting on the client.`,
    evidence: [
      `A real example of ${tasks[0]} and how accuracy was checked`,
      `A clear explanation of how they use ${tools[0]}${tools[1] ? ` and ${tools[1]}` : ""} in day-to-day work`,
      `A practical example showing ${skills[0]} rather than a self-rating`,
      `A situation where they escalated an exception instead of guessing`
    ],
    avoid: [
      `Do not combine ${tasks[0]}, ${tasks[1]}, and unrelated specialist work into one role without setting priorities.`,
      `Do not give broad system access simply because the role is remote; use the minimum permissions needed for the agreed scope.`,
      `Do not measure the role only by activity counts. Review accuracy, unresolved exceptions, and the quality of handoffs as well.`
    ],
    context: `For ${s.bestFor.slice(0, 2).join(" and ")}, the strongest ${role} setup is usually a defined operating role rather than a loose list of errands. The client owns the process and decisions; the VA owns the recurring execution that has been clearly delegated.`,
    scorecard: [
      `${toTitle(tasks[0])}: completed on time, with exceptions recorded instead of hidden`,
      `${toTitle(tasks[1])}: accuracy or rework rate based on a sample the manager actually reviews`,
      `${toTitle(tasks[2])}: turnaround time from a complete request to a usable result`,
      `Open items: anything blocked past the agreed response window, with the blocker and next owner named`,
      `Documentation: notes, files, and status fields are current enough for another team member to pick up the work`
    ],
    notFit: `A virtual assistant is not the right answer when the work is mostly one-off specialist judgment, there is no repeatable process to delegate, or the client expects the person to make regulated, financial, legal, clinical, or technical decisions outside their authority. Fix the process or hire the appropriate specialist first. Then delegate the repeatable administrative or production layer around that work.`
  };
}

function useCaseCopy(item: string, s: ServiceSeoPage) {
  if (s.slug === "law-firm-virtual-assistant") {
    const copy: Record<string, string> = {
      "solo attorneys": "Protect attorney time by delegating intake follow-up, scheduling, matter setup, file organization, and routine client communication.",
      "small law firms": "Create consistent ownership across intake, calendars, documents, billing admin, and case-management updates as caseload grows.",
      "immigration firms": "Keep document collection, appointment coordination, matter records, client reminders, and supervised case support organized.",
      "litigation practices": "Support deadline tracking, document organization, matter updates, scheduling, and administrative follow-through while legal strategy stays with counsel."
    };
    if (copy[item]) return copy[item];
  }
  return `A good fit when ${item} need reliable ownership for ${s.tasks.slice(0, 3).join(", ")} while keeping higher-risk decisions with the right manager or specialist.`;
}

async function getTalent(category: string) {
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
      .filter((va: any) => Boolean(va.slug) && [va.primary_category, ...(va.categories || [])].filter(Boolean).includes(category))
      .sort((a: any, b: any) => Number(b.years_experience || 0) - Number(a.years_experience || 0))
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
  const talent = await getTalent(s.directoryCategory);
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const pageUrl = `${base}/service/${s.slug}`;
  const regulated = complianceNote(s.slug, s.group);
  const editorial = serviceEditorial(s);
  const talentHref = `/find-talent?category=${encodeURIComponent(s.directoryCategory)}&q=${encodeURIComponent(roleName(s.name))}`;
  const matchExample = `Handle ${s.tasks.slice(0, 3).join(", ")} and keep our team updated on progress, exceptions, and next steps.`;

  const interviewQuestions = [
    { q: `Walk me through how you would handle ${s.tasks[0]} from intake to completion.`, a: "A concrete process, the information they need first, quality checks, documentation, and when they would ask for clarification." },
    { q: `How do you keep ${s.tasks[1]} accurate and up to date?`, a: "A repeatable checking method, source-of-truth discipline, clear ownership, and a way to surface exceptions instead of hiding them." },
    { q: `Which ${roleName(s.name).toLowerCase()} tools have you used most often?`, a: "Practical depth in tools relevant to your stack, with examples of what they completed and how they checked the result." },
    { q: "What would you escalate instead of deciding on your own?", a: "Good judgment about permissions, client or customer risk, financial impact, compliance, unusual exceptions, and decisions outside the agreed scope." },
    { q: `Show me an example of work closest to ${s.focus}.`, a: "Evidence that resembles your workflow, plus a clear explanation of the candidate's contribution, quality checks, and result." }
  ];

  const faqs = [
    { q: `What does ${article} ${s.name.toLowerCase()} do?`, a: `${s.name} work can include ${s.tasks.slice(0, 5).join(", ")}. The right scope depends on your process, tools, decision boundaries, and the candidate's experience.` },
    { q: `Can I hire ${article} ${s.name.toLowerCase()} in the Philippines?`, a: `Yes. VirtualAssistant.com.ph helps businesses compare Philippines-based virtual assistants by relevant skills, tools, experience, availability, communication, and role fit.` },
    { q: `What tools should ${article} ${s.name.toLowerCase()} know?`, a: `Common tools for this role include ${s.tools.slice(0, 6).join(", ")}. Require only the platforms your hire will use, then verify practical familiarity during the interview.` },
    { q: `How much does ${article} ${s.name.toLowerCase()} cost?`, a: "Rates vary with experience, specialization, schedule, live-overlap requirements, technical depth, and how independently the person is expected to operate. Compare scope and evidence of fit, not only the lowest hourly rate." },
    { q: `How do I choose the best ${s.name.toLowerCase()}?`, a: `Start with the work the person must own. Then compare relevant experience, ${s.skills.slice(0, 4).join(", ")}, communication, availability, and examples that show they can execute your workflow.` },
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
      description: s.metaDescription,
      provider: { "@type": "Organization", name: "VirtualAssistant.com.ph", url: base },
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

      <section className="section public-hero-small specialty-seo-hero service-hero-v2">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/services">Services</Link><span aria-hidden="true">/</span><span aria-current="page">{s.name}</span>
          </nav>
          <div className="specialty-hero-grid service-conversion-hero-grid">
            <div className="public-page-head service-conversion-copy">
              
              <h1 className="public-page-title">Hire {article} {s.name} in the Philippines</h1>
              <p className="public-lede service-hero-lede">{copy.hero}</p>

              <div className="service-hero-proof" aria-label="Hiring benefits">
                <span><BadgeCheck size={16}/>Approved talent</span>
                <span><ShieldCheck size={16}/>Private request</span>
                <span><CheckCircle2 size={16}/>No account required</span>
              </div>

              <div className="service-hero-signals" aria-label="Common responsibilities">
                {s.tasks.slice(0, 4).map((task) => <span key={task}><CheckCircle2 size={14}/>{toTitle(task)}</span>)}
              </div>

              <div className="service-hero-secondary-actions">
                <a className="btn btn-lg" href="#talent" data-track={`service_${s.slug.replaceAll("-", "_")}_browse`}>Browse {roleName(s.name)} VAs <ArrowRight size={15}/></a>
                <a className="text-link" href="#responsibilities">See what you can delegate</a>
              </div>
            </div>

            <ServiceMatchForm
              slug={s.slug}
              category={s.directoryCategory}
              roleLabel={roleName(s.name)}
              example={matchExample}
              talentHref={talentHref}
            />
          </div>

          <div className="service-trust-bar" aria-label="Hiring safeguards">
            <div><BadgeCheck size={20}/><span><strong>Approved profiles</strong><small>Review profile evidence, skills, tools, experience, and current availability.</small></span></div>
            <div><ShieldCheck size={20}/><span><strong>Your request stays private</strong><small>The match request creates a private pending job draft. Nothing is published publicly until the client claims and reviews it.</small></span></div>
            <div><CheckCircle2 size={20}/><span><strong>You decide who to interview</strong><small>Compare candidates first, then confirm rate, schedule, scope, and start date before hiring.</small></span></div>
          </div>
        </div>
      </section>

      <section className="section section-white specialty-talent-section service-anchor service-talent-priority" id="talent">
        <div className="container">
          <div className="service-talent-head">
            <div>
              <div className="kicker">Approved talent</div>
              <h2>{copy.talentTitle}</h2>
              <p>{copy.talentIntro}</p>
            </div>
            <Link className="text-link" href={talentHref}>See all relevant talent <ArrowRight size={14}/></Link>
          </div>

          {talent.length ? <>
            <div className="service-talent-grid">
              {talent.slice(0, 3).map((va: any) => <article className="service-talent-card" key={va.user_id}>
                <div className="service-talent-card-top">
                  <PublicAvatar name={va.full_name} src={va.avatar_url} size="lg"/>
                  <div className="service-talent-identity">
                    <h3>{va.full_name}</h3>
                    <p>{va.headline || va.primary_category || "Virtual Assistant"}</p>
                    <div className="verified-line"><BadgeCheck size={15}/> Approved for client discovery</div>
                  </div>
                </div>
                <div className="pill-list service-talent-skills">{uniqueStrings(va.skills).slice(0, 4).map((x, index) => <span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div>
                <div className="service-talent-facts">
                  <div><strong>{va.years_experience != null ? `${va.years_experience}+` : "View"}</strong><span>{va.years_experience != null ? "years experience" : "experience details"}</span></div>
                  <div><strong>{va.weekly_hours ? `${va.weekly_hours}` : "View"}</strong><span>{va.weekly_hours ? "hours available/week" : "current availability"}</span></div>
                </div>
                <div className="service-talent-actions">
                  <Link className="btn btn-primary" href={`/va/${va.slug}`} data-track={`service_${s.slug.replaceAll("-", "_")}_profile`}>View profile</Link>
                  <Link className="btn" href={`/hire?talent=${encodeURIComponent(va.slug)}&category=${encodeURIComponent(s.directoryCategory)}`} data-track={`service_${s.slug.replaceAll("-", "_")}_intro`}>Request introduction</Link>
                </div>
              </article>)}
            </div>
            <div className="service-talent-closer"><span>Want us to narrow the list for you?</span><a className="text-link" href="#match-request">Get a managed VA <ArrowRight size={14}/></a></div>
          </> : <div className="service-empty-state"><div><Search size={28}/><div><h3>Tell us the exact version of this role you need.</h3><p>Availability changes. Get matched and give us the workload, hours, and workflow context so we can identify relevant approved talent.</p></div></div><a className="btn btn-primary" href="#match-request">Get a managed VA <ArrowRight size={15}/></a></div>}
        </div>
      </section>

      <nav className="service-jump-nav" aria-label="On this page">
        <div className="container service-jump-links">
          <span>On this page</span>
          <a href="#talent">Talent</a>
          <a href="#responsibilities">Responsibilities</a>
          <a href="#tools">Tools & skills</a>
          <a href="#hiring">Hiring process</a>
          <a href="#interview">Interview guide</a>
          <a href="#faqs">FAQs</a>
        </div>
      </nav>

      <section className="section service-anchor" id="responsibilities">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Responsibilities</div><h2>{copy.responsibilityTitle}</h2><p>{copy.responsibilityIntro}</p></div>
          <div className="seo-task-grid">{groups.map((group, index) => <article className="service-task-card" key={group.title}><div className="service-card-number">0{index + 1}</div><h3>{group.title}</h3><p>{group.intro}</p><ul className="plain-list">{group.tasks.map((task) => <li key={task}>{toTitle(task)}</li>)}</ul></article>)}</div>
          <div className="specialty-inline-cta service-inline-cta"><div><div className="kicker">Not sure what to delegate?</div><h2>Start with the work that repeats every week.</h2><p>List the recurring tasks, bottlenecks, tools, response times, and approvals. That is usually enough to define the first version of the role.</p></div><a className="btn btn-primary" href="#match-request">Get a managed VA <ArrowRight size={15}/></a></div>
        </div>
      </section>

      <section className="section section-white service-depth-section">
        <div className="container public-content-grid service-editorial-grid">
          <div>
            <div className="section-head"><div className="kicker">How the role works</div><h2>Set up the work before you hand it over.</h2></div>
            <p>{editorial.context}</p>
            <p>{editorial.operating}</p>
            <p>{editorial.quality}</p>
            <p>{editorial.handoff}</p>
          </div>
          <aside className="service-skill-panel">
            <div className="kicker">What to verify in an interview</div>
            <h3>Ask for proof that matches the job.</h3>
            <ul className="plain-list">{editorial.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
          </aside>
        </div>
      </section>

      <section className="section service-onboarding-section">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">First 30 days</div><h2>A practical onboarding plan for {article} {s.name.toLowerCase()}</h2><p>Keep the first month narrow enough to review properly. Add scope only after the original workflow is accurate and predictable.</p></div>
          <div className="process-grid three-step-process service-process">
            <article className="process-step"><div className="process-number">01</div><h3>Week 1: learn the workflow</h3><p className="muted">{editorial.weekOne}</p></article>
            <article className="process-step"><div className="process-number">02</div><h3>Weeks 2–3: add ownership</h3><p className="muted">{editorial.weekTwo}</p></article>
            <article className="process-step"><div className="process-number">03</div><h3>Week 4: review by outcomes</h3><p className="muted">{editorial.monthOne}</p></article>
          </div>
        </div>
      </section>

      <section className="section section-white service-avoid-section">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Common hiring mistakes</div><h2>Three mistakes that make this role harder than it needs to be</h2></div>
          <div className="grid-3">{editorial.avoid.map((item, index) => <article className="card" key={item}><span className="service-card-number">0{index + 1}</span><p>{item}</p></article>)}</div>
        </div>
      </section>

      <section className="section service-scorecard-section">
        <div className="container public-content-grid service-editorial-grid">
          <div>
            <div className="section-head"><div className="kicker">Managing the role</div><h2>Use a small scorecard instead of watching every click.</h2><p>For the first month, review a few measures that tell you whether the work is dependable. The exact targets should come from your own workload and service standards.</p></div>
            <ul className="plain-list">{editorial.scorecard.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <aside className="service-skill-panel"><div className="kicker">When this role is not a fit</div><h3>Do not outsource a broken decision process.</h3><p>{editorial.notFit}</p></aside>
        </div>
      </section>

      <section className="section section-white service-anchor" id="tools">
        <div className="container public-content-grid service-tools-layout">
          <div>
            <div className="section-head"><div className="kicker">Tools and skills</div><h2>{copy.toolsTitle}</h2><p>Software familiarity matters, but process judgment matters more. Ask candidates to explain what they completed inside the tool, how they checked accuracy, and what they escalated.</p></div>
            <div className="tool-cloud">{uniqueStrings(s.tools).map((tool, index) => <span className="tool-pill" key={`${String(tool)}-${index}`}><Wrench size={14}/>{tool}</span>)}</div>
          </div>
          <aside className="service-skill-panel"><div className="kicker">Skills to evaluate</div><h3>Look for evidence, not just keywords.</h3><ul className="plain-list">{uniqueStrings(s.skills).map((skill, index) => <li key={`${String(skill)}-${index}`}>{toTitle(skill)}</li>)}</ul><p className="small muted">Use your actual workflow during the interview. A practical example reveals more than a list of tools.</p></aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Best-fit teams</div><h2>{copy.fitTitle}</h2><p>{copy.fitIntro}</p></div>
          <div className="grid-4 service-use-grid">{uniqueStrings(s.bestFor).map((item, index) => <article className="service-use-card" key={`${String(item)}-${index}`}><UsersRound size={21}/><div><h3>{toTitle(item)}</h3><p>{useCaseCopy(item, s)}</p></div></article>)}</div>
        </div>
      </section>

      {regulated ? <section className="section section-white service-compliance-section"><div className="container"><div className="service-compliance-panel"><div className="service-compliance-icon"><ShieldCheck size={24}/></div><div><div className="kicker">Scope and compliance</div><h2>Keep regulated judgment with the responsible professional.</h2><p>{regulated}</p></div></div></div></section> : null}

      <section className="section section-white">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Write the role first</div><h2>What to include in your {s.name.toLowerCase()} job brief</h2><p>A clear role brief makes candidate comparison easier because everyone is being evaluated against the same work, systems, schedule, and decision boundaries.</p></div>
          <div className="brief-grid"><article><span>01</span><h3>Responsibilities</h3><p>List recurring tasks and the result the VA should own. Separate daily, weekly, and occasional work.</p></article><article><span>02</span><h3>Tools and access</h3><p>Name the systems used from week one and decide which permissions can be granted safely after onboarding.</p></article><article><span>03</span><h3>Hours and overlap</h3><p>State weekly hours, timezone, required live coverage, response expectations, and whether the schedule is fixed or flexible.</p></article><article><span>04</span><h3>Decision boundaries</h3><p>Explain what the VA may handle independently, what needs approval, and what should be escalated immediately.</p></article></div>
        </div>
      </section>

      <section className="section service-anchor" id="hiring">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Hiring process</div><h2>How to hire {article} {s.name.toLowerCase()} in the Philippines</h2><p>Define the work first, then test candidates on the evidence and judgment that matter for that exact scope.</p></div>
          <div className="process-grid four-step-process service-process"><div className="process-step"><div className="process-number">01</div><h3>Define the work</h3><p className="muted">Document responsibilities, tools, hours, budget, schedule, and the result the person should own.</p></div><div className="process-step"><div className="process-number">02</div><h3>Review relevant talent</h3><p className="muted">Compare role experience, tools, communication, schedule, and work evidence rather than broad profile claims.</p></div><div className="process-step"><div className="process-number">03</div><h3>Interview with real scenarios</h3><p className="muted">Use examples from your workflow to understand process, quality checks, judgment, and limits.</p></div><div className="process-step"><div className="process-number">04</div><h3>Confirm the hire</h3><p className="muted">Agree on final rate, start date, hours, responsibilities, reporting, and onboarding before work begins.</p></div></div>
          <div className="centered-actions"><a className="btn btn-primary btn-lg" href="#match-request">Get a managed VA <ArrowRight size={16}/></a></div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container public-content-grid service-context-grid">
          <div><div className="section-head"><div className="kicker">Why the Philippines?</div><h2>Hire for role fit, communication, and execution quality.</h2></div><p>Philippines-based remote professionals work across international teams and common cloud tools, but location alone does not guarantee fit. Evaluate relevant experience, communication, work evidence, schedule, and judgment for the workflow you need.</p><p>VirtualAssistant.com.ph gives you a structured path from private role brief to approved profiles, candidate review, interview, and confirmed hiring terms.</p><Link className="text-link" href="/why-philippines">Read the Philippines hiring guide <ArrowRight size={14}/></Link></div>
          <aside className="service-cost-panel"><CircleDollarSign size={22}/><div className="kicker">Cost and scope</div><h2>How much does {article} {s.name.toLowerCase()} cost?</h2><p>Rates vary by responsibility, experience, independence, schedule, and specialization. Compare the work you need and the evidence of fit before comparing hourly numbers.</p><ul className="plain-list">{s.costFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul><Link className="text-link" href="/pricing">See how pricing works <ArrowRight size={14}/></Link></aside>
        </div>
      </section>

      <section className="section service-anchor" id="interview">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Interview guide</div><h2>Questions to ask {s.name.toLowerCase()} candidates</h2><p>Use practical questions to reveal process, judgment, quality checks, communication, and decision boundaries.</p></div>
          <div className="interview-list">{interviewQuestions.map((item, index) => <article className="interview-item" key={item.q}><div className="interview-number">{String(index + 1).padStart(2, "0")}</div><div><h3>{item.q}</h3><p><strong>Listen for:</strong> {item.a}</p></div></article>)}</div>
        </div>
      </section>

      <section className="section section-white service-anchor" id="faqs">
        <div className="container faq-narrow"><div className="section-head specialty-section-head"><div className="kicker">Frequently asked questions</div><h2>Hiring {s.name.toLowerCase()} talent in the Philippines</h2><p>Common questions to resolve before you start interviewing.</p></div><div className="faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div></div>
      </section>

      {guides.length ? <section className="section service-guides-section">
        <div className="container">
          <div className="section-head specialty-section-head"><div className="kicker">Hiring guides</div><h2>Research the role before you interview.</h2><p>Use these supporting guides for task scope, cost planning, interview questions, job descriptions, tools, and onboarding. Each guide links back to this hiring page when you are ready to compare talent.</p></div>
          <div className="service-guide-grid">{guides.map((guide) => <Link className="service-guide-card" href={blogHref(guide)} key={guide.slug} data-track="service_blog_guide"><span className="service-guide-icon"><BookOpen size={18}/></span><div><span className="small muted">{guide.intent === "comparison" ? "Comparison" : guide.intent === "commercial" ? "Hiring guide" : "Practical guide"}</span><h3>{guide.title}</h3><p>{guide.excerpt}</p><strong>Read guide <ArrowRight size={14}/></strong></div></Link>)}</div>
        </div>
      </section> : null}

      <section className="section">
        <div className="container"><div className="section-head specialty-section-head"><div className="kicker">Related services</div><h2>Build support around the workflow, not just the title.</h2><p>These roles often overlap with or complement {s.name.toLowerCase()} responsibilities.</p></div><div className="grid-4">{related.map((item) => item ? <Link className="card card-hover related-service-card" href={`/service/${item.slug}/`} key={item.slug}><Search size={18}/><h3>{item.name}</h3><span className="text-link">Explore this service <ArrowRight size={13}/></span></Link> : null)}</div></div>
      </section>

      {relatedIndustries.length ? <section className="section section-white">
        <div className="container"><div className="section-head specialty-section-head"><div className="kicker">Industry guides</div><h2>See how this role fits specific business workflows.</h2><p>Industry guides connect the role to the systems, access rules, customers, and handoffs that change by business type.</p></div><div className="grid-4">{relatedIndustries.map((industry) => <Link className="card card-hover related-service-card" href={`/industries/${industry.slug}/`} key={industry.slug}><UsersRound size={18}/><h3>{industry.label}</h3><span className="text-link">View industry guide <ArrowRight size={13}/></span></Link>)}</div></div>
      </section> : null}

    </main>
    <SiteFooter />
  </>;
}
