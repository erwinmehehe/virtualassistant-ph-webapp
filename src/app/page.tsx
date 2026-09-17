import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Globe2,
  Headphones,
  PhoneCall,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { PublicAvatar } from "@/components/public-avatar";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { mergeUniqueStrings } from "@/lib/collections";
import { canonicalPath } from "@/lib/seo-url";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { HiringBriefForm } from "@/components/hiring-brief-form";
import {
  FaqSection,
  FinalCtaSection,
  HiringModelsSection,
  HowItWorksSection,
  IndustriesSection,
  SavingsSection,
  ServicesSection,
  TalentSection,
  WhyPhilippinesSection,
} from "@/components/homepage-sections";
import { TalentShortlistBar } from "@/components/talent-shortlist";
import "./premium-home.css";
import "./cro-hiring-tools.css";
import "./homepage-seo-evidence.css";
import "./homepage-growth.css";
import "./homepage-sections.css";

export const metadata: Metadata = {
  title: { absolute: "Virtual Assistant Philippines | Hire Vetted Filipino VAs" },
  description:
    "Hire vetted Filipino virtual assistants with Virtual Assistant Philippines. Get matched by role, tools, schedule, and budget with recruiter support today.",
  keywords: [
    "virtual assistant philippines",
    "hire filipino virtual assistant",
    "filipino virtual assistant",
    "virtual assistant services philippines",
    "outsource to the philippines",
  ],
  alternates: { canonical: canonicalPath("/") },
  openGraph: {
    type: "website",
    title: "Virtual Assistant Philippines | Hire Vetted Filipino VAs",
    description:
      "Get matched with vetted Filipino virtual assistants for your role, tools, schedule, and budget.",
    url: canonicalPath("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Assistant Philippines | Hire Vetted Filipino VAs",
    description:
      "Get matched with vetted Filipino virtual assistants for your role, tools, schedule, and budget.",
  },
};

const BOOKING_URL = "/book-client-call";

const GROUP_BLURBS: Record<string, string> = {
  "Admin & Operations": "Inbox, calendar, data, and recurring coordination that keeps the business moving.",
  Healthcare: "Patient scheduling, records, insurance follow-up, and dependable front-desk support.",
  "Marketing & Growth": "Content, campaigns, reporting, and the execution work between strategy reviews.",
  "Finance & Accounting": "Bookkeeping, invoicing, reconciliations, and month-end support kept current.",
  "Sales & CRM": "Prospect research, outreach, appointment setting, and CRM hygiene your team can trust.",
  Ecommerce: "Listings, orders, returns, supplier follow-up, and day-to-day storefront operations.",
  "Real Estate": "Listing coordination, transaction paperwork, lead follow-up, and calendar management.",
  "Customer & Front Desk": "Email, chat, and phone coverage with consistent service standards.",
  "Creative & Content": "Editing, design support, and production work that keeps publishing on schedule.",
  "Executive Support": "Calendar control, travel, briefing notes, and follow-through after meetings.",
};

const GROUP_DISPLAY_NAMES: Record<string, string> = {
  "Admin & Operations": "Administrative & Executive Virtual Assistants",
  Healthcare: "Healthcare Virtual Assistants",
  "Marketing & Growth": "Marketing & Social Media Virtual Assistants",
  "Finance & Accounting": "Bookkeeping & Finance Virtual Assistants",
  "Sales & CRM": "Sales & Lead Generation Virtual Assistants",
  Ecommerce: "Ecommerce Virtual Assistants",
  "Real Estate": "Real Estate Virtual Assistants",
  "Customer & Front Desk": "Customer Service Virtual Assistants",
  "Creative & Content": "Creative & Content Virtual Assistants",
  "Executive Support": "Executive Virtual Assistants",
};

const roleGroups = Array.from(
  SERVICE_PAGES.reduce((groups, page) => {
    const list = groups.get(page.group) || [];
    list.push(page);
    groups.set(page.group, list);
    return groups;
  }, new Map<string, typeof SERVICE_PAGES>()),
)
  .filter(([group]) => GROUP_BLURBS[group])
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 6);

const faqs = [
  [
    "What does it cost to get started?",
    "Pricing depends on the role, experience level, working hours, schedule, and skills required. Share what you need and we will recommend a suitable hiring setup and show Virtual Assistant compensation and our service fee separately before you commit.",
  ],
  [
    "How fast can my virtual assistant start?",
    "Timelines depend on the role and candidate availability. A focused pool of screened candidates can make hiring much faster than starting a traditional recruitment search from scratch, and we confirm the expected timeline before you hire.",
  ],
  [
    "What if my virtual assistant is not the right fit?",
    "Tell Client Success as soon as something is not working. We review the role, expectations, and working relationship with you and help decide whether the issue can be resolved or a different candidate would be a better fit under your agreed service terms.",
  ],
  [
    "What hours do Filipino virtual assistants work?",
    "Schedules vary by candidate. We can match for Australian, US, UK, or other business-hour overlap, overnight coverage, or a fixed schedule depending on your operational needs.",
  ],
  [
    "How do I communicate with my virtual assistant?",
    "Use the tools your team already uses, including Slack, Microsoft Teams, email, Zoom, WhatsApp, Asana, ClickUp, Trello, or similar collaboration platforms.",
  ],
  [
    "Can I start with part-time support?",
    "Yes. Many businesses start with part-time support and increase hours as the role and workload grow.",
  ],
  [
    "Who handles payroll, tax, and employment administration?",
    "Responsibilities depend on the placement and service arrangement you choose. We explain the structure, service fees, and responsibilities clearly before you make a hiring commitment.",
  ],
  [
    "Can I change virtual assistants if the match is not working?",
    "Yes. If the working style or skill set is not right, we can review the situation with you and help identify a more suitable match under the terms of your placement.",
  ],
  [
    "Who owns the work my virtual assistant produces?",
    "Work ownership and confidentiality are covered in the applicable working and service agreements. Client deliverables should remain with the client business under the agreed terms.",
  ],
  [
    "How do you screen and vet candidates?",
    "Candidates are reviewed across professional experience, practical skills, communication, availability, work evidence, and recruiter evaluation before they are approved for client presentation.",
  ],
  [
    "Will my virtual assistant sign an NDA?",
    "Confidentiality requirements can be included before a Virtual Assistant receives access to your accounts, data, or internal systems.",
  ],
  [
    "What software and tools are your virtual assistants familiar with?",
    "Experience varies by candidate, but common platforms include Google Workspace, Microsoft 365, Slack, Asana, ClickUp, Notion, HubSpot, Shopify, Canva, Xero, QuickBooks, and similar business tools. We aim to match for your existing stack wherever possible.",
  ],
] as const;

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("public_va_directory")
    .select(
      "user_id,slug,full_name,avatar_url,headline,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate,schedule,availability_status",
    )
    .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
    .not("avatar_url", "is", null)
    .order("years_experience", { ascending: false })
    .order("weekly_hours", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(30);

  const featuredWithPhotos = (featured ?? [])
    .filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim())
    .slice(0, 6);
  const matchTalent = (featured ?? [])
    .filter((va: any) => va.slug)
    .map((va: any) => ({
      slug: va.slug,
      name: va.full_name,
      headline: va.headline,
      category: va.primary_category,
      categories: va.categories,
      weeklyHours: va.weekly_hours,
      hourlyRate: va.hourly_rate,
      yearsExperience: va.years_experience,
      schedule: va.schedule,
    }));

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "VirtualAssistant.com.ph",
      url: base,
      logo: `${base}/icon.svg`,
      description:
        "Philippines-focused recruiting and managed hiring for businesses looking for vetted Filipino Virtual Assistants.",
      areaServed: [
        { "@type": "Country", name: "Australia" },
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "United Kingdom" },
      ],
      knowsAbout: [
        "Virtual Assistant Philippines",
        "Filipino Virtual Assistants",
        "Virtual Assistant recruitment",
        "Administrative support",
        "Executive assistance",
        "Customer service",
        "Lead generation",
        "Ecommerce support",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          url: `${base}/contact`,
          availableLanguage: ["English"],
          areaServed: ["AU", "US", "GB"],
        },
      ],
      member: [
        { "@type": "Person", name: "Jervis Accad" },
        { "@type": "Person", name: "Bryan Batarina" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "VirtualAssistant.com.ph",
      url: base,
      inLanguage: "en",
      publisher: { "@id": `${base}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="pva-home">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />

        <section className="pva-hero">
          <div className="pva-grid-pattern" aria-hidden="true" />
          <div className="pva-orb pva-orb-a" aria-hidden="true" />
          <div className="pva-orb pva-orb-b" aria-hidden="true" />
          <div className="container pva-hero-grid">
            <div className="pva-hero-copy">
              <div className="pva-eyebrow">
                <span><ShieldCheck size={14} /> Vetted &amp; managed</span>
                <strong>Virtual Assistant Philippines for AU, US &amp; UK teams</strong>
              </div>
              <h1>
                Hire a Vetted Virtual Assistant <em>in the Philippines</em>
              </h1>
              <p className="pva-hero-lede">
                Get matched with a Filipino virtual assistant who fits your role, tools, schedule, and way of working.
              </p>
              <p className="pva-hero-sub">
                We shortlist vetted candidates, you choose who to hire, and Client Success helps make the handoff smooth from day one.
              </p>

              <div className="pva-hero-actions">
                <a className="pva-btn pva-btn-primary" href="#hero-hiring-form" data-track="hero_hiring_request">
                  Get your free VA match <ArrowRight size={18} />
                </a>
                <a className="pva-btn pva-btn-secondary" href={BOOKING_URL} data-track="booking_click">
                  <span className="pva-call-icon"><PhoneCall size={14} /></span> Discuss your VA needs
                </a>
              </div>

              <div className="pva-proof-row" aria-label="Candidate screening checks">
                <span><ClipboardCheck size={15} /> Skills tested</span>
                <span><Video size={15} /> Video reviewed</span>
                <span><ShieldCheck size={15} /> Recruiter approved</span>
                <span><CheckCircle2 size={15} /> You choose</span>
              </div>
            </div>

            <div id="hero-hiring-form" className="pva-hero-form-shell">
              <HiringBriefForm variant="general" sourcePath="/" />
            </div>
          </div>
        </section>

        <section className="pva-trust-strip" aria-label="Hiring advantages">
          <div className="container pva-trust-grid">
            <div><span>01</span><strong>Human vetted</strong><small>Recruiters review evidence, communication, and role fit.</small></div>
            <div><span>02</span><strong>Skills tested</strong><small>Practical screening helps separate claims from client-ready ability.</small></div>
            <div><span>03</span><strong>You choose</strong><small>Compare the shortlist, interview, and make the final decision.</small></div>
            <div><span>04</span><strong>Support after placement</strong><small>Client Success stays involved after your VA starts.</small></div>
          </div>
        </section>

        <div className="hs-root">
          <ServicesSection />
          <WhyPhilippinesSection />
          <HiringModelsSection bookingUrl={BOOKING_URL} />
          <TalentSection talent={featuredWithPhotos} />
          <HowItWorksSection />
          <IndustriesSection />
          <SavingsSection />
          <FaqSection faqs={faqs} />
          <FinalCtaSection bookingUrl={BOOKING_URL} />
        </div>
      </main>
      <TalentShortlistBar />
      <SiteFooter />
    </>
  );
}
