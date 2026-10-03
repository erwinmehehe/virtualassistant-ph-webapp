import type { VaCategory } from "@/lib/constants";

export type SuggestedJobDraft = {
  title: string;
  category: VaCategory;
  skills: string;
  responsibilities: string;
};

export function suggestJobDraft(input: string): SuggestedJobDraft {
  const words = input.toLowerCase();

  if (/real estate|property|listing|tenant|lease|transaction/.test(words)) {
    return {
      title: "Real Estate Virtual Assistant",
      category: "Real Estate",
      skills: "Real estate administration, CRM management, Follow-up",
      responsibilities: "Maintain CRM and property records\nCoordinate listing, tenant, or transaction follow-ups\nKeep deadlines, notes, and documents organized",
    };
  }

  if (/bookkeep|quickbooks|xero|invoice|accounts payable|accounts receivable|reconcil/.test(words)) {
    return {
      title: "Bookkeeping Virtual Assistant",
      category: "Bookkeeping & Finance",
      skills: "Bookkeeping, Reconciliation support, Invoice administration",
      responsibilities: "Maintain accurate bookkeeping records\nPrepare invoices, bills, and reconciliation support\nTrack missing documents and finance follow-ups",
    };
  }

  if (/shopify|ecommerce|e-commerce|amazon|product listing|orders|inventory/.test(words)) {
    return {
      title: "Ecommerce Virtual Assistant",
      category: "Ecommerce",
      skills: "Ecommerce operations, Customer service, Data entry",
      responsibilities: "Maintain product listings and catalog information\nRespond to routine customer and order questions\nKeep orders and inventory information current",
    };
  }

  if (/seo|search engine|keyword|backlink|on-page|technical seo/.test(words)) {
    return {
      title: "SEO Virtual Assistant",
      category: "SEO",
      skills: "SEO, Keyword research, Content operations",
      responsibilities: "Support keyword and competitor research\nImplement approved on-page and content updates\nMaintain SEO trackers, reports, and internal-link tasks",
    };
  }

  if (/social media|content calendar|instagram|facebook|linkedin|marketing|email marketing/.test(words)) {
    return {
      title: "Marketing Virtual Assistant",
      category: "Marketing & Social Media",
      skills: "Marketing support, Content coordination, Social media management",
      responsibilities: "Prepare and schedule approved marketing content\nMaintain campaign and content calendars\nTrack routine marketing tasks and reporting inputs",
    };
  }

  if (/wordpress|website|web page|elementor|cms|landing page/.test(words)) {
    return {
      title: "Web & WordPress Virtual Assistant",
      category: "Web & WordPress",
      skills: "WordPress, CMS updates, Website QA",
      responsibilities: "Update approved website and CMS content\nBuild or maintain routine pages and forms\nCheck links, layouts, and publishing quality",
    };
  }

  if (/dental|medical|patient|clinic|cliniko|healthcare|appointment/.test(words)) {
    return {
      title: "Healthcare Virtual Assistant",
      category: "Dental & Healthcare",
      skills: "Healthcare administration, Scheduling, Records coordination",
      responsibilities: "Coordinate routine scheduling and administrative requests\nMaintain approved patient or client records\nEscalate clinical, billing, or privacy-sensitive decisions",
    };
  }

  if (/lead generation|prospecting|appointment setting|sales|crm|outbound/.test(words)) {
    return {
      title: "Lead Generation Virtual Assistant",
      category: "Lead Generation & Sales",
      skills: "Lead generation, CRM management, Follow-up",
      responsibilities: "Research and organize qualified prospects\nKeep CRM records and next actions current\nPrepare approved outreach and follow-up queues",
    };
  }

  if (/video|graphic|canva|creative|design|reel|thumbnail/.test(words)) {
    return {
      title: "Creative Virtual Assistant",
      category: "Video Editing & Creative",
      skills: "Creative production, Canva, Content formatting",
      responsibilities: "Prepare approved visual or video assets\nOrganize creative files and production requests\nApply brand guidelines and complete pre-publish QA",
    };
  }

  if (/support|customer|email|inbox|ticket|help desk/.test(words)) {
    return {
      title: "Customer Service Virtual Assistant",
      category: "Customer Service",
      skills: "Customer service, Written communication, Problem solving",
      responsibilities: "Respond to routine customer messages\nResolve standard requests and escalate exceptions\nKeep support records and follow-ups current",
    };
  }

  if (/founder|executive|ceo|calendar|meeting|travel|executive assistant/.test(words)) {
    return {
      title: "Executive Virtual Assistant",
      category: "Executive Assistance",
      skills: "Executive support, Calendar management, Inbox management",
      responsibilities: "Manage calendar, meetings, and scheduling priorities\nOrganize inboxes and prepare follow-ups\nKeep action items and executive requests moving",
    };
  }

  if (/phone|reception|call|dispatch/.test(words)) {
    return {
      title: "Reception Virtual Assistant",
      category: "Phone & Reception",
      skills: "Phone support, Scheduling, Customer communication",
      responsibilities: "Handle approved inbound or outbound calls\nCoordinate scheduling and routine enquiries\nRecord outcomes and escalate exceptions",
    };
  }

  return {
    title: "Administrative Virtual Assistant",
    category: "Administrative Support",
    skills: "Administrative support, Communication, Research",
    responsibilities: "Complete recurring administrative tasks\nMaintain accurate records and follow-ups\nEscalate questions and blockers early",
  };
}
