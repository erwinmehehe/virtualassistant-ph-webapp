export type SeoAuthoritySection = {
  heading: string;
  intro: string;
  bullets?: string[];
  links?: { href: string; label: string; description: string }[];
};

export type SeoAuthorityPage = {
  path: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  lede: string;
  sections: SeoAuthoritySection[];
  faqs: { q: string; a: string }[];
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  ctaTitle: string;
  ctaBody: string;
};

export const SEO_AUTHORITY_PAGES: Record<string, SeoAuthorityPage> = {
  companies: {
    path: "/virtual-assistant-companies-philippines",
    title: "Virtual Assistant Companies in the Philippines",
    metaTitle: "Virtual Assistant Companies Philippines | 2026 Guide",
    metaDescription: "Compare Virtual Assistant companies in the Philippines by hiring model, vetting, management, pricing structure, support, and role coverage.",
    keywords: [
      "virtual assistant companies",
      "virtual assistant companies philippines",
      "best virtual assistant companies",
      "virtual assistant agencies",
      "virtual assistant firms",
      "virtual assistant providers",
      "virtual assistant staffing",
      "virtual assistant staffing agency"
    ],
    eyebrow: "Provider comparison guide",
    h1: "Virtual Assistant companies in the Philippines: how to compare providers",
    lede: "The right provider depends on how much recruiting, screening, day-to-day management, replacement support, and operational help you want after the hire. Compare the operating model before comparing logos.",
    sections: [
      {
        heading: "Start with the hiring model",
        intro: "Virtual Assistant companies can look similar in search results while offering very different services. Some mainly provide access to profiles. Others recruit against a brief. Managed providers stay involved after placement, while direct-hire recruiters hand the working relationship to the client.",
        bullets: [
          "Marketplace or directory: you search, screen, interview, and manage candidates yourself.",
          "Recruitment or placement: the provider sources and screens candidates, then the client manages the hire.",
          "Managed Virtual Assistant service: recruiting is combined with onboarding, placement monitoring, and ongoing support.",
          "BPO or outsourced team: the provider may own a broader operating process instead of placing one named assistant."
        ]
      },
      {
        heading: "Compare vetting evidence, not the word vetted",
        intro: "Ask what actually happens before a candidate reaches you. A useful screening process checks relevant experience, practical capability, communication, availability, schedule fit, and evidence from the kind of work the role requires.",
        bullets: [
          "Does the company screen against your actual workload or only a generic profile?",
          "Can you see relevant experience and practical evidence before interviewing?",
          "Are schedule, timezone overlap, tools, and compensation expectations confirmed?",
          "Who decides whether a candidate is client-ready?"
        ],
        links: [
          { href: "/how-vetting-works", label: "How our vetting works", description: "See the screening, recruiter review, and approval process used before client presentation." },
          { href: "/hire", label: "Send a hiring brief", description: "Define the role, hours, timezone, tools, and budget before comparing candidates." }
        ]
      },
      {
        heading: "Understand what happens after placement",
        intro: "Provider value is not limited to finding a resume. Clarify who handles onboarding support, replacement requests, billing administration, performance issues, and changes in scope after the Virtual Assistant starts.",
        bullets: [
          "Who is the escalation point if the placement is not working?",
          "Does the client manage the assistant directly or through the provider?",
          "What replacement or recovery process applies?",
          "How are compensation, provider fees, and other charges presented?"
        ],
        links: [
          { href: "/managed-vs-direct-hire", label: "Managed vs direct hire", description: "Compare the two hiring structures before choosing a provider model." },
          { href: "/pricing", label: "Virtual Assistant pricing", description: "See how compensation and service pricing are presented on VirtualAssistant.com.ph." }
        ]
      },
      {
        heading: "Compare staffing, placement, and managed-service depth",
        intro: "Searchers use virtual assistant company, agency, provider, staffing agency, and firm for overlapping needs. The label matters less than the operating model. A provider that is strong at general administration may not be the right choice for mortgage processing, medical administration, SEO, bookkeeping, or property management. Look for role-specific screening, workflow knowledge, and a candidate pool that matches the actual work.",
        links: [
          { href: "/services", label: "Browse Virtual Assistant services", description: "Compare role-specific hiring guides across admin, marketing, finance, healthcare, ecommerce, real estate, legal, and more." },
          { href: "/industries", label: "Browse by industry", description: "Start from your business workflow when the role title is not obvious." },
          { href: "/find-talent", label: "Browse approved talent", description: "Review public Virtual Assistant profiles with role, skills, tools, and availability information." }
        ]
      }
    ],
    faqs: [
      { q: "What should I compare between Virtual Assistant companies?", a: "Compare the hiring model, candidate screening, role specialization, pricing structure, replacement or recovery support, management responsibilities, schedule coverage, and what happens after placement. The cheapest headline price is not enough to tell you which model fits your business." },
      { q: "Is a Virtual Assistant agency the same as a Virtual Assistant company?", a: "The terms are often used interchangeably in search. In practice, companies may operate as marketplaces, recruiters, managed service providers, or outsourced teams. Ask what the provider actually does before and after the hire." },
      { q: "Should I use a marketplace or a managed Virtual Assistant company?", a: "A marketplace can fit teams that want to source and manage candidates themselves. A managed service can fit businesses that want more help with recruiting, matching, onboarding, placement monitoring, and replacement support." },
      { q: "How do I compare Virtual Assistant companies in the Philippines?", a: "Use the same written role brief for every provider. Compare who they present, what evidence supports the match, how pricing is structured, what support continues after placement, and whether the candidate can work your required schedule." }
    ],
    primary: { href: "/services", label: "Compare VA services" },
    secondary: { href: "/hire", label: "Send a hiring brief" },
    ctaTitle: "Compare providers against the role you actually need.",
    ctaBody: "Start with the work, schedule, tools, and budget. A clear brief makes it much easier to compare Virtual Assistant companies on evidence instead of sales language."
  },
  australia: {
    path: "/virtual-assistant-australia",
    title: "Virtual Assistants for Australian Businesses",
    metaTitle: "Virtual Assistant Australia | Hire Filipino VA Support",
    metaDescription: "Hire Filipino Virtual Assistants for Australian businesses. Compare admin, property, accounting, NDIS, mortgage, trades, and specialist support.",
    keywords: [
      "virtual assistant australia",
      "virtual assistants australia",
      "hire virtual assistant australia",
      "virtual assistant services australia",
      "virtual assistant agency australia",
      "philippines virtual assistant australia"
    ],
    eyebrow: "Australia market guide",
    h1: "Hire Filipino Virtual Assistants for Australian business workflows",
    lede: "Build remote support around Australian business hours and the systems your team already uses. Start with a clearly scoped role, then match for experience, tools, schedule overlap, communication, and the local workflow the person will support.",
    sections: [
      {
        heading: "Choose the workload before the job title",
        intro: "Australian businesses use Virtual Assistants across general administration and highly specific operating workflows. The strongest brief starts with recurring work and decision boundaries, then selects the role that fits.",
        links: [
          { href: "/services", label: "All Virtual Assistant services", description: "Browse role guides for admin, marketing, finance, real estate, healthcare, ecommerce, legal, creative work, and more." },
          { href: "/tools/what-type-of-va-do-i-need", label: "VA role finder", description: "Use the workload to identify the type of Virtual Assistant that fits." }
        ]
      },
      {
        heading: "High-value Australian workflows we already support",
        intro: "The Australian market has several workflows where offshore administration can remove repetitive production work without transferring regulated decisions or professional responsibility.",
        links: [
          { href: "/industries/ndis-providers", label: "NDIS billing and claims", description: "Claims administration, remittance follow-up, participant records, and billing workflows." },
          { href: "/industries/smsf-production", label: "SMSF production", description: "Document organization, reconciliations, workpapers, and production support before professional review." },
          { href: "/industries/strata-management-administration", label: "Strata administration", description: "Meeting packs, notices, registers, levy administration, and portfolio follow-up." },
          { href: "/industries/mortgage-broker-loan-processing", label: "Mortgage loan processing", description: "Document chasing, application administration, lender conditions, and settlement follow-up." },
          { href: "/industries/trades-service-administration", label: "Trades administration", description: "Job creation, scheduling, customer updates, technician paperwork, and invoice administration." },
          { href: "/industries/bim-revit-production", label: "BIM and Revit production", description: "Documentation and production support with project review gates and clear professional boundaries." }
        ]
      },
      {
        heading: "Australian cities and remote coverage"
        intro: "Businesses searching for a Virtual Assistant in Sydney, Melbourne, Brisbane, Perth, Adelaide, the Gold Coast, Geelong, Newcastle, or Darwin usually need Australian-timezone support rather than a worker physically located in that city. Philippine-based Virtual Assistants can work Australian business-hour overlap, fixed shifts, or asynchronous schedules depending on the role. Live customer, phone, dispatch, and coordination work needs clearer overlap than research, production, reporting, or back-office tasks.",
        bullets: [
          "State the Australian timezone and exact hours that require live coverage.",
          "Separate live-response tasks from work that can be completed asynchronously.",
          "Confirm public-holiday expectations before the placement starts.",
          "Use written handoff rules when work moves between Australian staff and the Virtual Assistant."
        ]
      },
      {
        heading: "Keep regulated and professional decisions with the accountable local team",
        intro: "A Virtual Assistant can prepare, organize, follow up, document, and coordinate. Advice, licensing decisions, professional certification, clinical judgment, credit recommendations, legal decisions, and other regulated responsibilities remain with appropriately qualified people.",
        links: [
          { href: "/how-vetting-works", label: "How vetting works", description: "See how candidates are reviewed before client presentation." },
          { href: "/pricing", label: "Pricing and hiring models", description: "Compare managed support and direct-hire pricing structures." }
        ]
      }
    ],
    faqs: [
      { q: "Can a Filipino Virtual Assistant work Australian business hours?", a: "Yes, depending on candidate availability and the role. Define the Australian timezone, required live overlap, weekly hours, and whether the work can be partly asynchronous before sourcing begins." },
      { q: "What Australian businesses commonly hire Virtual Assistants?", a: "Common use cases include professional services, accounting, property management, mortgage broking, NDIS administration, allied health administration, trades, construction, ecommerce, marketing, and general business support." },
      { q: "Should I hire one generalist or a specialist Virtual Assistant?", a: "Use a generalist when the work is compatible and operationally similar. Use a specialist when the role depends on industry software, regulated workflows, technical production, or experience that materially changes how the work is performed." },
      { q: "How should Australian businesses manage timezone handoffs?", a: "Document the live coverage window, what can be completed after hours, where updates are recorded, which issues must be escalated immediately, and which person in Australia owns the next decision." }
    ],
    primary: { href: "/hire", label: "Hire for an Australian workflow" },
    secondary: { href: "/services", label: "Browse services" },
    ctaTitle: "Build an Australian-ready Virtual Assistant brief.",
    ctaBody: "Tell us the workflow, Australian timezone, weekly hours, tools, budget, and the experience that matters. We can screen against the actual operating role."
  },
  "what-is": {
    path: "/what-is-a-virtual-assistant",
    title: "What Is a Virtual Assistant?",
    metaTitle: "What Is a Virtual Assistant? Roles, Tasks & Costs",
    metaDescription: "Learn what a Virtual Assistant is, what VAs do, common roles and tasks, how remote support works, typical tools, costs, and when to hire one.",
    keywords: [
      "what is a virtual assistant",
      "what does a virtual assistant do",
      "virtual assistant meaning",
      "virtual assistant tasks",
      "virtual assistant duties",
      "virtual assistant roles"
    ],
    eyebrow: "Virtual Assistant fundamentals",
    h1: "What is a Virtual Assistant and what do they actually do?",
    lede: "A Virtual Assistant is a remote professional who takes ownership of defined business tasks or workflows. The role can range from general administration to specialized work in marketing, finance, ecommerce, real estate, healthcare administration, legal operations, and technical support.",
    sections: [
      {
        heading: "A Virtual Assistant is a remote role, not one fixed job",
        intro: "The term describes how the work is delivered, not one universal task list. One Virtual Assistant may manage inboxes and calendars, while another works in SEO, bookkeeping, customer support, property management, ecommerce, or loan processing.",
        links: [
          { href: "/types-of-virtual-assistants", label: "Types of Virtual Assistants", description: "See the major VA specialties and how they differ." },
          { href: "/services", label: "Virtual Assistant services", description: "Browse role-specific responsibilities, tools, hiring guidance, and approved talent." }
        ]
      },
      {
        heading: "Common Virtual Assistant tasks",
        intro: "The best tasks to delegate are recurring, documentable, measurable, and supported by a clear source of truth. Specialized work can also be delegated when the person has the right experience and decision boundaries are explicit.",
        bullets: [
          "Inbox, calendar, scheduling, research, data entry, and document administration",
          "CRM updates, lead follow-up, appointment setting, and sales administration",
          "Customer support, phone reception, order follow-up, and help-desk administration",
          "SEO, social media, content operations, email marketing, and advertising support",
          "Bookkeeping administration, billing support, payroll administration, and financial operations",
          "Real estate, property management, ecommerce, healthcare administration, legal operations, and other specialized workflows"
        ]
      },
      {
        heading: "What a Virtual Assistant should own",
        intro: "Delegation works best when the Virtual Assistant owns a recurring outcome instead of receiving random tasks through chat. Define the source of truth, expected output, deadline, quality check, and escalation rule for each workflow.",
        bullets: [
          "Routine execution with a clear definition of done",
          "Accurate records and visible status updates",
          "Follow-up on assigned work and documented blockers",
          "Escalation when a request falls outside the agreed process"
        ]
      },
      {
        heading: "How much does a Virtual Assistant cost?",
        intro: "Cost depends on experience, specialization, working hours, live coverage, tools, communication requirements, and how independently the person is expected to work. Compare the responsibility level before comparing rates.",
        links: [
          { href: "/pricing", label: "Virtual Assistant pricing", description: "See the current hiring models and how service pricing is confirmed." },
          { href: "/how-much-virtual-assistant-philippines", label: "VA cost guide", description: "Learn the factors that change a Filipino Virtual Assistant budget." },
          { href: "/research/virtual-assistant-rates-philippines-2026", label: "2026 rate and skills report", description: "See first-party aggregate profile data from Filipino Virtual Assistants." }
        ]
      }
    ],
    faqs: [
      { q: "What is a Virtual Assistant?", a: "A Virtual Assistant is a remote professional who performs defined business tasks or manages recurring workflows. The role can be general administrative support or a specialized function such as marketing, bookkeeping, real estate, ecommerce, healthcare administration, or technical support." },
      { q: "What does a Virtual Assistant do every day?", a: "Daily work depends on the role. Common examples include inbox and calendar management, research, CRM updates, customer follow-up, scheduling, reporting, content operations, bookkeeping administration, and maintaining specialized business systems." },
      { q: "Is a Virtual Assistant the same as an employee?", a: "Not necessarily. Virtual Assistant describes the remote role, not the legal working arrangement. The person may be engaged through a managed service, direct-hire placement, contractor arrangement, employment structure, or another model depending on the parties and jurisdiction." },
      { q: "When should a business hire a Virtual Assistant?", a: "Consider a Virtual Assistant when recurring work is consuming higher-value staff time, the process can be documented, the expected output is clear, and there is enough ongoing workload to justify consistent ownership." }
    ],
    primary: { href: "/services", label: "Explore VA roles" },
    secondary: { href: "/hire", label: "Hire a Virtual Assistant" },
    ctaTitle: "Turn recurring work into a defined Virtual Assistant role.",
    ctaBody: "Start with the tasks that repeat every week, the systems involved, and what success looks like. That gives you a much better hiring brief than a generic job title."
  },
  types: {
    path: "/types-of-virtual-assistants",
    title: "Types of Virtual Assistants",
    metaTitle: "Types of Virtual Assistants | Roles & Specialties Guide",
    metaDescription: "Compare the main types of Virtual Assistants, including admin, executive, marketing, sales, ecommerce, finance, real estate, healthcare, and more.",
    keywords: [
      "types of virtual assistants",
      "different types of virtual assistants",
      "virtual assistant niches",
      "virtual assistant specialties",
      "types of virtual assistant services"
    ],
    eyebrow: "Role and niche guide",
    h1: "Types of Virtual Assistants: choose the specialty that fits the workload",
    lede: "Virtual Assistants are not one interchangeable job category. The right specialty depends on the workflow, systems, customer or client context, schedule, risk level, and how much independent judgment the role requires.",
    sections: [
      {
        heading: "Administrative and executive support",
        intro: "These roles keep recurring coordination, communication, records, calendars, and management support moving.",
        links: [
          { href: "/service/admin-inbox", label: "Administrative Virtual Assistant", description: "Inbox, administration, records, coordination, and recurring back-office work." },
          { href: "/service/executive-virtual-assistant", label: "Executive Virtual Assistant", description: "High-trust calendar, inbox, meeting, travel, and leadership support." },
          { href: "/service/personal-assistant", label: "Personal Assistant", description: "Personal and business coordination around an individual decision-maker." },
          { href: "/service/project-coordination", label: "Project Coordination VA", description: "Task tracking, deadlines, meeting coordination, status updates, and follow-through." }
        ]
      },
      {
        heading: "Marketing and creative Virtual Assistants",
        intro: "Marketing roles need a clearer channel, output, and measurement model than generic admin work.",
        links: [
          { href: "/service/digital-marketing-virtual-assistant", label: "Digital Marketing Virtual Assistant", description: "Campaign execution, reporting, research, and multi-channel marketing support." },
          { href: "/service/seo", label: "SEO Virtual Assistant", description: "Keyword research, on-page SEO, internal linking, briefs, monitoring, and reporting." },
          { href: "/service/social-media", label: "Social Media Virtual Assistant", description: "Content scheduling, community administration, reporting, and publishing workflows." },
          { href: "/service/graphic-design", label: "Graphic Design Virtual Assistant", description: "Recurring design production, resizing, asset organization, and campaign support." }
        ]
      },
      {
        heading: "Sales, customer, and revenue support",
        intro: "These Virtual Assistants work closer to prospects, customers, appointments, and revenue systems, so scripts, CRM discipline, response standards, and escalation rules matter.",
        links: [
          { href: "/service/sales-virtual-assistant", label: "Sales Virtual Assistant", description: "Pipeline support, follow-up, research, CRM administration, and sales coordination." },
          { href: "/service/lead-generation", label: "Lead Generation Virtual Assistant", description: "Prospect research, list building, enrichment, outreach support, and lead tracking." },
          { href: "/service/customer-service", label: "Customer Service Virtual Assistant", description: "Customer communication, ticket administration, follow-up, and service operations." },
          { href: "/service/phone-receptionist", label: "Virtual Receptionist", description: "Calls, routing, messages, bookings, and front-desk administration." }
        ]
      },
      {
        heading: "Specialized industry and technical Virtual Assistants",
        intro: "Specialists bring workflow or platform familiarity that can shorten onboarding and reduce errors in domain-specific work.",
        links: [
          { href: "/service/real-estate", label: "Real Estate Virtual Assistant", description: "CRM, listing administration, lead follow-up, transaction support, and property research." },
          { href: "/service/bookkeeping", label: "Bookkeeping Virtual Assistant", description: "Recurring bookkeeping administration, reconciliations, record maintenance, and reporting support." },
          { href: "/service/medical-virtual-assistant", label: "Medical Virtual Assistant", description: "Non-clinical scheduling, reminders, referral coordination, records, and practice administration." },
          { href: "/service/ecommerce", label: "Ecommerce Virtual Assistant", description: "Store operations, products, orders, customer support, marketplaces, and reporting." },
          { href: "/service/it-virtual-assistant", label: "IT Virtual Assistant", description: "Technical coordination, support administration, documentation, and recurring IT operations." },
          { href: "/software", label: "Software-specific Virtual Assistants", description: "Browse support organized around the business systems a Virtual Assistant already knows." }
        ]
      }
    ],
    faqs: [
      { q: "How many types of Virtual Assistants are there?", a: "There is no fixed number because Virtual Assistant is a delivery model rather than one standardized profession. Useful categories include administrative, executive, marketing, sales, customer support, ecommerce, finance, real estate, healthcare, legal, creative, technical, and industry-specific support." },
      { q: "Which type of Virtual Assistant should a small business hire first?", a: "Start from the workload. If the pressure is inbox, scheduling, records, and coordination, an administrative or general Virtual Assistant may fit. If the backlog is marketing, bookkeeping, ecommerce, sales, or another specialist workflow, hire for that specialty instead." },
      { q: "Can one Virtual Assistant cover multiple specialties?", a: "Yes when the tasks are compatible and the person has relevant experience. Avoid combining unrelated specialist work into one role simply to reduce headcount. Priorities, tools, standards, and expected outcomes should still be clear." },
      { q: "What is a Virtual Assistant niche?", a: "A niche is a narrower specialty based on function, industry, software, or workflow. Examples include SEO, Amazon operations, mortgage loan processing, dental administration, property management, bookkeeping, and social media." }
    ],
    primary: { href: "/services", label: "Browse all VA services" },
    secondary: { href: "/tools/what-type-of-va-do-i-need", label: "Use the VA role finder" },
    ctaTitle: "Choose the role from the workload, not from a generic title.",
    ctaBody: "If you can describe the recurring tasks, tools, schedule, and outcomes, the right Virtual Assistant specialty becomes much easier to identify."
  },
  nonprofits: {
    path: "/industries/nonprofits",
    title: "Virtual Assistant for Nonprofits",
    metaTitle: "Virtual Assistant for Nonprofits | Philippines Support",
    metaDescription: "Hire a Filipino Virtual Assistant for nonprofit administration, donor CRM updates, events, volunteer coordination, research, scheduling, and communications.",
    keywords: [
      "virtual assistant for nonprofits",
      "nonprofit virtual assistant",
      "virtual assistant services for nonprofits",
      "nonprofit administrative assistant"
    ],
    eyebrow: "Nonprofit support",
    h1: "Virtual Assistant support for nonprofits and mission-driven organizations",
    lede: "Delegate recurring administration around donors, volunteers, events, communications, scheduling, research, and records while fundraising strategy, governance, financial approvals, safeguarding, and sensitive decisions stay with accountable staff.",
    sections: [
      {
        heading: "Administrative workflows a nonprofit can delegate",
        intro: "The best first workflows are recurring, documentable, and easy to review. Build clear access rules before a Virtual Assistant touches donor, volunteer, member, beneficiary, or financial information.",
        bullets: [
          "Donor CRM data entry, tagging, deduplication, and record maintenance",
          "Event registration, calendar coordination, attendee follow-up, and logistics administration",
          "Volunteer records, scheduling, reminders, and routine coordination",
          "Board and committee meeting scheduling, document packs, and action tracking",
          "Research, list building, newsletter preparation, and approved social scheduling",
          "Inbox triage, document organization, recurring reports, and contact database cleanup"
        ]
      },
      {
        heading: "Roles that commonly fit nonprofit workflows",
        intro: "A nonprofit may need one broad administrative role or several specialists depending on workload, funding, systems, and the complexity of donor and community communication.",
        links: [
          { href: "/service/admin-inbox", label: "Administrative Virtual Assistant", description: "Recurring admin, inbox, records, research, and coordination." },
          { href: "/service/crm", label: "CRM Virtual Assistant", description: "Database hygiene, contact updates, tagging, pipeline maintenance, and reporting support." },
          { href: "/service/email-marketing", label: "Email Marketing Virtual Assistant", description: "Newsletter production, list administration, campaign setup, and reporting support." },
          { href: "/service/social-media", label: "Social Media Virtual Assistant", description: "Approved content scheduling, community administration, and channel reporting." },
          { href: "/service/research-data", label: "Research and Data Entry Virtual Assistant", description: "Research, lists, spreadsheets, data validation, and record maintenance." }
        ]
      },
      {
        heading: "Protect donor and beneficiary information",
        intro: "Use minimum necessary access, role-based permissions where available, clear file locations, and written escalation rules. Sensitive cases, safeguarding concerns, financial approvals, grant commitments, legal decisions, and public positions should remain with authorized nonprofit staff."
      },
      {
        heading: "Measure whether support is improving the operation",
        intro: "Track outcomes that reflect cleaner operations rather than activity for its own sake.",
        bullets: [
          "Donor and contact records updated accurately and on time",
          "Open event or volunteer tasks with a named next owner",
          "Turnaround time for routine administrative requests",
          "Reduction in duplicate records and missing follow-up",
          "Recurring reports and meeting packs prepared by the agreed deadline"
        ]
      }
    ],
    faqs: [
      { q: "What can a Virtual Assistant do for a nonprofit?", a: "A Virtual Assistant can support donor CRM administration, event coordination, volunteer scheduling, research, records, meeting administration, newsletters, approved social scheduling, inboxes, calendars, and other recurring back-office work." },
      { q: "Can a Virtual Assistant access donor information?", a: "Only when the role requires it and the nonprofit has appropriate access controls. Use minimum necessary permissions, documented privacy expectations, and clear escalation rules for sensitive information." },
      { q: "Should a nonprofit hire a general or specialist Virtual Assistant?", a: "Use a general administrative role when the workload is compatible across scheduling, records, research, and coordination. Use specialists when the work depends on CRM depth, bookkeeping, marketing systems, grant workflows, or other domain-specific experience." },
      { q: "How should a nonprofit scope the first month?", a: "Choose two or three recurring workflows, provide examples of completed work, define access and approval boundaries, and review quality frequently. Add more scope only after the first workflows are consistent." }
    ],
    primary: { href: "/hire", label: "Hire nonprofit support" },
    secondary: { href: "/services", label: "Browse VA services" },
    ctaTitle: "Give recurring nonprofit administration a clear owner.",
    ctaBody: "Describe the recurring work, systems, weekly hours, and access boundaries. We can help shape the role and screen Filipino Virtual Assistants for the workflow."
  }
};

export function seoAuthorityPage(key: keyof typeof SEO_AUTHORITY_PAGES) {
  return SEO_AUTHORITY_PAGES[key];
}
