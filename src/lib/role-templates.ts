/**
 * Starting points for the job wizard.
 *
 * Posting a role previously began with an empty form: a first-time client had
 * to invent a title, a specialty, skills, tools and a description with no idea
 * what "normal" looks like. Each template fills those in as an editable draft --
 * every field stays writable, so this is a head start, not a constraint.
 *
 * Rates are hourly USD and follow the same bands as BUDGET_GUIDANCE in the
 * wizard; categories must match VA_CATEGORIES exactly.
 */
export type RoleTemplate = {
  id: string;
  label: string;
  blurb: string;
  values: {
    title: string;
    categories: string;
    summary: string;
    description: string;
    responsibilities: string;
    required_skills: string;
    required_tools: string;
    experience_level: string;
    hours_per_week: string;
    min_hourly_rate: string;
    max_hourly_rate: string;
  };
};

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "executive-assistant",
    label: "Executive / Admin Assistant",
    blurb: "Inbox, calendar, travel and follow-ups for a busy founder or exec.",
    values: {
      title: "Executive Assistant",
      categories: "Executive Assistance,Administrative Support",
      summary: "Own my inbox and calendar, coordinate meetings and travel, prepare agendas and follow-ups, and keep action items moving.",
      description: "I need a reliable executive assistant to protect my time. You will be the first person to see my inbox each morning, keep my calendar realistic, and make sure nothing agreed in a meeting gets dropped. This is a long-term role with real ownership, not task-by-task work.",
      responsibilities: "Manage inbox and flag what needs my attention\nOwn calendar scheduling and reschedules across timezones\nPrepare meeting agendas, take notes, track action items\nBook travel and handle expenses\nMaintain files and simple internal documentation",
      required_skills: "Calendar management,Inbox management,Administrative support,Research,Reporting",
      required_tools: "Google Workspace,Slack,Zoom,Notion",
      experience_level: "intermediate",
      hours_per_week: "40",
      min_hourly_rate: "8",
      max_hourly_rate: "12"
    }
  },
  {
    id: "customer-support",
    label: "Customer Support",
    blurb: "Email, chat and ticket handling with a steady response time.",
    values: {
      title: "Customer Support Specialist",
      categories: "Customer Service",
      summary: "Answer customer emails and chats, resolve common issues from our playbook, and escalate anything unusual with full context.",
      description: "We need someone dependable on the front line with our customers. Most questions repeat, so you will work from an existing playbook and help us improve it. Tone matters more than speed: we would rather a careful answer than a fast one.",
      responsibilities: "Answer customer emails and live chat within agreed response times\nResolve routine issues using existing macros and playbooks\nEscalate complex cases with clear written context\nLog recurring problems so we can fix the root cause\nKeep help-centre articles current",
      required_skills: "Customer service,Administrative support,Reporting,Data entry",
      required_tools: "Slack,Google Workspace,HubSpot,Zoom",
      experience_level: "intermediate",
      hours_per_week: "40",
      min_hourly_rate: "7",
      max_hourly_rate: "11"
    }
  },
  {
    id: "ecommerce-ops",
    label: "Ecommerce Operations",
    blurb: "Product listings, orders, returns and supplier follow-up.",
    values: {
      title: "Ecommerce Operations Assistant",
      categories: "Ecommerce,Administrative Support",
      summary: "Keep our storefront accurate: list and update products, process orders and returns, and chase suppliers on stock.",
      description: "Our store runs on details being right. You will own listings, order flow and returns, and be the person who notices when stock numbers stop making sense. Previous Shopify experience matters more than years of experience overall.",
      responsibilities: "Create and update product listings, images and descriptions\nProcess orders, refunds and returns\nMonitor stock levels and flag reorders\nCoordinate with suppliers and fulfilment partners\nProduce a weekly sales and inventory summary",
      required_skills: "Ecommerce operations,Data entry,Customer service,Reporting",
      required_tools: "Shopify,Google Workspace,Slack,Canva",
      experience_level: "intermediate",
      hours_per_week: "40",
      min_hourly_rate: "7",
      max_hourly_rate: "12"
    }
  },
  {
    id: "sales-support",
    label: "Sales / Lead Generation",
    blurb: "Prospect lists, outreach sequences and CRM hygiene.",
    values: {
      title: "Sales Development Assistant",
      categories: "Lead Generation & Sales",
      summary: "Build qualified prospect lists, run outreach sequences, book meetings, and keep the CRM clean.",
      description: "We need consistent top-of-funnel activity. You will research and qualify prospects, run our outreach sequences, and make sure every reply is logged and followed up. Discipline with the CRM matters as much as the outreach itself.",
      responsibilities: "Research and qualify prospects against our target profile\nBuild and maintain prospect lists\nSend outreach sequences and follow-ups\nBook qualified meetings into the sales calendar\nKeep CRM records accurate and current",
      required_skills: "Lead generation,Appointment setting,Research,Data entry,Reporting",
      required_tools: "HubSpot,Salesforce,Google Workspace,Slack",
      experience_level: "intermediate",
      hours_per_week: "40",
      min_hourly_rate: "8",
      max_hourly_rate: "12"
    }
  },
  {
    id: "marketing-social",
    label: "Marketing & Social Media",
    blurb: "Content calendar, scheduling, community replies and reporting.",
    values: {
      title: "Social Media and Marketing Assistant",
      categories: "Marketing & Social Media",
      summary: "Run our content calendar, schedule posts, reply to comments and DMs, and report on what is working.",
      description: "We post consistently and want someone to own that rhythm. You will plan the calendar, prepare simple graphics, schedule everything, and stay on top of the comments. We care more about consistency and voice than viral swings.",
      responsibilities: "Maintain the monthly content calendar\nDraft captions and prepare simple graphics\nSchedule posts across channels\nReply to comments and direct messages\nReport monthly on reach, engagement and growth",
      required_skills: "Social media management,Research,Reporting,Project coordination",
      required_tools: "Canva,Google Workspace,Notion,Slack",
      experience_level: "intermediate",
      hours_per_week: "30",
      min_hourly_rate: "7",
      max_hourly_rate: "12"
    }
  },
  {
    id: "bookkeeping",
    label: "Bookkeeping",
    blurb: "Categorising transactions, reconciliations and monthly reports.",
    values: {
      title: "Bookkeeper",
      categories: "Bookkeeping & Finance",
      summary: "Keep our books current: categorise transactions, reconcile accounts monthly, and prepare simple financial reports.",
      description: "We need our books accurate and up to date without chasing. You will handle day-to-day categorisation, reconcile accounts each month, and flag anything that looks wrong early. Accuracy and clear questions matter more than speed.",
      responsibilities: "Categorise transactions weekly\nReconcile bank and card accounts monthly\nPrepare and send invoices, follow up on unpaid ones\nProduce monthly profit and loss plus cash summaries\nFlag unusual transactions promptly",
      required_skills: "Bookkeeping,Data entry,Reporting,Administrative support",
      required_tools: "QuickBooks,Google Workspace,Microsoft Office,Slack",
      experience_level: "senior",
      hours_per_week: "20",
      min_hourly_rate: "9",
      max_hourly_rate: "14"
    }
  }
];
