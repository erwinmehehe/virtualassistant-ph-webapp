export type CandidateSeoPage = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  lede: string;
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  ctaLabel: string;
};

export const CANDIDATE_SEO_PAGES: CandidateSeoPage[] = [
  {
    slug: "how-to-apply-as-a-virtual-assistant",
    title: "How to Apply as a Virtual Assistant in the Philippines",
    metaTitle: "How to Apply as a Virtual Assistant Philippines",
    description: "Learn how to apply as a Virtual Assistant in the Philippines, prepare your profile, resume, portfolio, screening evidence, schedule and rate before applying.",
    eyebrow: "Application guide",
    lede: "A strong Virtual Assistant application makes it easy for a recruiter or client to understand what work you can own, which tools you actually use, when you are available, and what evidence supports your experience.",
    sections: [
      { heading: "Prepare the information employers actually need", bullets: ["Recent and relevant work experience", "Specific skills tied to real tasks", "Tools you have used in day-to-day work", "Weekly availability and timezone", "Preferred compensation range", "Resume and useful work samples"] },
      { heading: "Build one complete profile before applying everywhere", paragraphs: ["Use one accurate profile as your source of truth. Keep your headline specific, describe the workflows you have handled, and avoid listing every software logo you have ever seen.", "A recruiter should be able to understand your strongest role category in under a minute."] },
      { heading: "Apply only when the role fits", bullets: ["Read the actual responsibilities, not only the title", "Check hours, schedule and timezone overlap", "Confirm the compensation range works for you", "Match your examples to the role's must-have skills", "Do not claim experience you cannot demonstrate"] },
      { heading: "Prepare for screening", paragraphs: ["Expect questions about how you complete work, not just whether you have heard of a tool. Strong answers explain the workflow, checks, handoffs, and what you do when something is unclear."], bullets: ["Use examples with a clear starting problem and result", "Explain your quality checks", "Be ready to discuss mistakes and what you changed", "Keep your communication direct and professional"] }
    ],
    ctaLabel: "Create your VA profile"
  },
  {
    slug: "virtual-assistant-resume-sample",
    title: "Virtual Assistant Resume Sample & Writing Guide",
    metaTitle: "Virtual Assistant Resume Sample Philippines",
    description: "Use this Virtual Assistant resume guide to present experience, skills, tools, achievements and transferable work clearly, including when you are new to VA work.",
    eyebrow: "Resume guide",
    lede: "A Virtual Assistant resume should prove what you can do remotely. Focus on workflows, tools, measurable outcomes and transferable experience instead of filling the page with generic traits.",
    sections: [
      { heading: "Use a clear resume structure", bullets: ["Name and professional headline", "Short role-focused summary", "Relevant work experience", "Skills grouped by workflow", "Tools you have actually used", "Education and useful certifications", "Portfolio or work-sample link when relevant"] },
      { heading: "Write experience around outcomes", paragraphs: ["Replace vague lines such as 'responsible for administrative tasks' with the actual workflow: what you handled, how often, in which system, and what changed because you owned it.", "Numbers help when they are real: response time, records processed, appointments coordinated, accounts managed, campaigns supported or error rates reduced."] },
      { heading: "If you have no VA title yet", paragraphs: ["You can still use transferable experience from office administration, BPO, customer service, sales, healthcare administration, accounting, ecommerce, education or other roles. Do not relabel past jobs as Virtual Assistant work if they were not."], bullets: ["Map old responsibilities to remote workflows", "Show tool familiarity honestly", "Use project or volunteer examples where relevant", "Add a small portfolio if the role is output-based"] },
      { heading: "Common resume mistakes", bullets: ["Listing dozens of unrelated skills", "Using ratings such as 'Excel 95%' without evidence", "Copying a generic VA objective", "Hiding dates or job context", "Claiming tools you have never used in real work", "Sending the same summary for every specialty"] }
    ],
    ctaLabel: "Create your VA profile"
  },
  {
    slug: "virtual-assistant-portfolio-examples",
    title: "Virtual Assistant Portfolio Examples & What to Include",
    metaTitle: "Virtual Assistant Portfolio Examples Philippines",
    description: "Learn what to include in a Virtual Assistant portfolio, with examples for admin, marketing, ecommerce, bookkeeping, customer service and specialist roles.",
    eyebrow: "Portfolio guide",
    lede: "A VA portfolio does not need to look like a design portfolio. It needs to give credible evidence that you can complete the work a client is hiring for without exposing confidential information.",
    sections: [
      { heading: "Good portfolio evidence depends on the role", bullets: ["Admin: anonymized trackers, SOPs, calendar systems or process examples", "Marketing: briefs, reports, campaign builds or content workflows", "Ecommerce: listing templates, order trackers or support workflows", "Bookkeeping: anonymized reconciliation process or sample reporting structure", "Customer support: response frameworks, QA checklists or workflow maps", "Creative: design, video, copy or production samples"] },
      { heading: "Protect confidential information", paragraphs: ["Never publish a former employer's customer data, account screenshots, credentials, private financial records, medical information, legal files or proprietary material without permission.", "Recreate the workflow with dummy data or redact the sensitive details while preserving enough context to show how you work."] },
      { heading: "Explain each sample", bullets: ["What the task was", "Which tools you used", "What part you personally owned", "How you checked quality", "What result or improvement followed", "What you would do differently next time"] },
      { heading: "Keep the portfolio focused", paragraphs: ["Three strong, relevant examples are more useful than thirty unrelated screenshots. Build the portfolio around the role category you want to be hired for."] }
    ],
    ctaLabel: "Create your VA profile"
  },
  {
    slug: "virtual-assistant-skills",
    title: "Virtual Assistant Skills Employers Look For",
    metaTitle: "Virtual Assistant Skills Employers Look For",
    description: "Learn the most useful Virtual Assistant skills for Filipino applicants, from communication and documentation to role-specific tools, quality control and remote work habits.",
    eyebrow: "Skills guide",
    lede: "The most valuable VA skills are not a long software list. Employers look for people who can understand a workflow, communicate clearly, keep records accurate, follow through and know when to escalate.",
    sections: [
      { heading: "Core skills across most VA roles", bullets: ["Written and verbal communication", "Attention to detail", "Task and deadline management", "Documentation and note-taking", "Research and source checking", "Professional judgment and escalation", "Comfort learning new systems"] },
      { heading: "Role-specific skills matter more as work becomes specialized", paragraphs: ["A real estate VA, medical VA, bookkeeper, SEO VA and executive assistant should not be screened on the same checklist. Build depth in one or two role categories instead of trying to look qualified for everything."] },
      { heading: "Show evidence instead of self-ratings", bullets: ["Describe a workflow you have owned", "Name the tools and what you did inside them", "Explain your quality checks", "Use specific examples of difficult cases", "Show a work sample when confidentiality allows"] },
      { heading: "Remote work skills", bullets: ["Clear status updates", "Reliable schedule and connectivity", "Secure account handling", "Comfort with async communication", "Ability to work from written SOPs", "Willingness to document recurring work"] }
    ],
    ctaLabel: "Create your VA profile"
  },
  {
    slug: "virtual-assistant-requirements-philippines",
    title: "Virtual Assistant Requirements in the Philippines",
    metaTitle: "Virtual Assistant Requirements Philippines",
    description: "See common Virtual Assistant requirements in the Philippines, including equipment, internet, communication, work evidence, tools, schedule and professional readiness.",
    eyebrow: "Requirements guide",
    lede: "There is no single universal requirement for becoming a Virtual Assistant. Requirements change by role, but employers consistently care about reliable equipment, communication, evidence of relevant skills and the ability to work securely and independently.",
    sections: [
      { heading: "Basic work setup", bullets: ["Reliable computer suitable for the role", "Stable internet connection", "Backup plan for connectivity or power where practical", "Quiet environment for call-heavy roles", "Working headset and camera when meetings are required", "Secure browser and account practices"] },
      { heading: "Professional requirements", bullets: ["Accurate resume or work history", "Clear written communication", "Role-relevant skills", "Ability to follow instructions and document work", "Realistic availability", "Honest rate expectations"] },
      { heading: "Specialist roles have specialist requirements", paragraphs: ["Medical, legal, finance, technical and industry-specific positions may require prior workflow experience, software familiarity, privacy awareness, or professional supervision. A generic VA certificate does not replace evidence of relevant work."] },
      { heading: "What you do not need", paragraphs: ["You do not need to claim every popular VA tool, buy an expensive course, or invent experience. Build credible skill in a target role, document what you can do, and apply where the workload matches that evidence."] }
    ],
    ctaLabel: "Create your VA profile"
  },
  {
    slug: "how-to-become-a-virtual-assistant-philippines",
    title: "How to Become a Virtual Assistant in the Philippines",
    metaTitle: "How to Become a Virtual Assistant Philippines",
    description: "A practical guide to becoming a Virtual Assistant in the Philippines: choose a niche, build skills, prepare a resume and portfolio, set up your workspace and apply.",
    eyebrow: "Career guide",
    lede: "Becoming a Virtual Assistant is easier when you start from skills you already have, choose a specific type of work, and build evidence for that role instead of trying to learn every possible VA service at once.",
    sections: [
      { heading: "Choose a starting specialty", bullets: ["Administrative support", "Customer service", "Sales or lead generation", "Marketing or social media", "Ecommerce", "Bookkeeping or accounting support", "Real estate", "Healthcare administration", "Creative or technical support"] },
      { heading: "Build role-specific proof", paragraphs: ["Learn the actual workflow, not just the tool names. Practice with safe sample data, create work examples where relevant, and be able to explain how you would check your work and handle exceptions."] },
      { heading: "Prepare for remote work", bullets: ["Reliable work setup", "Professional email and communication", "Resume focused on transferable experience", "Small relevant portfolio when useful", "Clear availability and preferred schedule", "Secure account habits"] },
      { heading: "Start applying strategically", paragraphs: ["Apply to roles where your evidence matches the responsibilities. Early in your VA career, a narrower role with clear expectations can be better than a broad position asking one person to do admin, sales, design, bookkeeping and technical work at once."] }
    ],
    ctaLabel: "Create your VA profile"
  }
];

export function candidateSeoPageBySlug(slug: string) {
  return CANDIDATE_SEO_PAGES.find((page) => page.slug === slug);
}
