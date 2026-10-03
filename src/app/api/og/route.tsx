import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { OgCategory } from "@/lib/og";

export const runtime = "nodejs";

const CATEGORY_UI: Record<OgCategory, { label: string; cards: [string, string][]; footer: string }> = {
  general: {
    label: "VIRTUALASSISTANT.COM.PH",
    cards: [["Shortlist", "Vetted role-fit talent"], ["Workflow", "Clear scope and ownership"], ["Support", "Recruiter-guided hiring"], ["Start", "Structured onboarding"]],
    footer: "Vetted Filipino talent | Role-fit before resume volume",
  },
  admin: {
    label: "ADMIN & EXECUTIVE SUPPORT",
    cards: [["Calendar", "Schedule and meeting flow"], ["Inbox", "Triage and follow-up"], ["Task Board", "Priorities and owners"], ["Research", "Prepared decision support"]],
    footer: "Reliable admin systems | Clear handoffs | Consistent follow-through",
  },
  marketing: {
    label: "MARKETING & SEO SUPPORT",
    cards: [["Analytics", "Growth and channel trends"], ["Content", "Publishing workflow"], ["Search", "Keywords and rankings"], ["Engagement", "Community and reporting"]],
    footer: "Marketing execution | SEO workflows | Measurable progress",
  },
  finance: {
    label: "BOOKKEEPING & FINANCE SUPPORT",
    cards: [["Invoices", "Billing administration"], ["Reconciliation", "Clean supporting records"], ["Expenses", "Categorised workflows"], ["Reports", "Monthly visibility"]],
    footer: "Organised finance admin | Review-ready records | Better visibility",
  },
  technical: {
    label: "TECHNICAL & IT SUPPORT",
    cards: [["Code", "Structured implementation"], ["Terminal", "Status: SUCCESS"], ["Tickets", "Tracked technical work"], ["QA", "Checks before handoff"]],
    footer: "Technical execution | Documented changes | Reliable handoffs",
  },
  "customer-support": {
    label: "CUSTOMER SUPPORT",
    cards: [["Inbox", "Responsive email support"], ["Live Chat", "Fast customer replies"], ["Tickets", "Queue ownership"], ["Follow-Up", "Closed support loops"]],
    footer: "Responsive support | Clean queues | Better follow-through",
  },
  ecommerce: {
    label: "ECOMMERCE OPERATIONS",
    cards: [["Products", "Listings and updates"], ["Orders", "Order coordination"], ["Inventory", "Stock visibility"], ["Messages", "Customer follow-up"]],
    footer: "Store operations | Order support | Marketplace administration",
  },
  "real-estate": {
    label: "REAL ESTATE SUPPORT",
    cards: [["Listings", "Property administration"], ["Leads", "Follow-up workflow"], ["CRM", "Clean pipeline records"], ["Calendar", "Appointments and tasks"]],
    footer: "Lead follow-up | CRM discipline | Property workflow support",
  },
  blog: {
    label: "VIRTUAL ASSISTANT GUIDE",
    cards: [["Key Point", "Practical decision support"], ["Checklist", "What to verify"], ["Evidence", "What matters most"], ["Next Step", "What to do from here"]],
    footer: "Practical guidance | Clear takeaways | Philippines context",
  },
  industry: {
    label: "INDUSTRY VA GUIDE",
    cards: [["Workflow", "Industry-specific operations"], ["Tools", "Relevant systems"], ["Handoffs", "Clear responsibilities"], ["Fit", "Role-specific talent"]],
    footer: "Industry context | Relevant workflows | Vetted Filipino talent",
  },
  software: {
    label: "SOFTWARE VA GUIDE",
    cards: [["Platform", "Workflow ownership"], ["Queue", "Tasks and records"], ["Checks", "Quality controls"], ["Status", "Visible exceptions"]],
    footer: "Software fluency | Process discipline | Reliable execution",
  },
  training: {
    label: "FREE VA TRAINING",
    cards: [["Lessons", "Short practical modules"], ["Exercises", "Real workflow practice"], ["Skills", "Role and software learning"], ["Certificate", "Free verified credential"]],
    footer: "Free training | Practical exercises | Free certificates",
  },
  jobs: {
    label: "VA JOBS PHILIPPINES",
    cards: [["Role", "Clear responsibilities"], ["Pay", "Published compensation"], ["Schedule", "Working-hour context"], ["Apply", "One vetted VA profile"]],
    footer: "Remote VA jobs | Published pay | Philippines-based applicants",
  },
  hiring: {
    label: "HIRE A VIRTUAL ASSISTANT",
    cards: [["Brief", "Define the work"], ["Match", "Relevant candidates"], ["Interview", "Compare role fit"], ["Hire", "Confirm terms and start"]],
    footer: "Role-first recruiting | Human vetting | Client choice",
  },
  pricing: {
    label: "VA PRICING",
    cards: [["Scope", "Role complexity"], ["Hours", "Part-time or full-time"], ["Rate", "VA compensation"], ["Support", "Service model"]],
    footer: "Transparent scope | Clear compensation | Terms before commitment",
  },
  legal: {
    label: "LEGAL & COMPLIANCE",
    cards: [["Process", "Supervised admin work"], ["Documents", "Controlled handling"], ["Access", "Defined permissions"], ["Review", "Qualified judgment stays internal"]],
    footer: "Structured legal admin | Clear boundaries | Responsible review",
  },
};

function fontSafeText(value: string, max: number) {
  return value
    .normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function textParam(url: URL, key: string, fallback: string, max: number) {
  return fontSafeText(url.searchParams.get(key) || fallback, max);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const title = textParam(url, "title", "VirtualAssistant.com.ph", 120);
  const description = textParam(url, "description", "Vetted Filipino Virtual Assistants for growing teams.", 240);
  const eyebrow = textParam(url, "eyebrow", "", 48);
  const author = textParam(url, "author", "", 72);
  const rawCategory = textParam(url, "category", "general", 32) as OgCategory;
  const category: OgCategory = rawCategory in CATEGORY_UI ? rawCategory : "general";
  const model = CATEGORY_UI[category];
  const points = url.searchParams.getAll("point").map((point) => fontSafeText(point, 54)).filter(Boolean).slice(0, 4);
  const cards = points.length
    ? model.cards.map((card, index) => [card[0], points[index] || card[1]] as [string, string])
    : model.cards;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#ffffff 0%,#fafaff 48%,#eef2ff 100%)", color: "#101828", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 260, right: -110, top: -180, background: "rgba(79,70,229,.12)" }} />
      <div style={{ position: "absolute", width: 390, height: 390, borderRadius: 195, left: 380, bottom: -260, background: "rgba(122,90,248,.08)" }} />

      <div style={{ width: "58%", height: "100%", display: "flex", flexDirection: "column", padding: "50px 36px 44px 58px", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg,#4F46E5,#7A5AF8)", color: "#fff", fontSize: 18, fontWeight: 800, marginRight: 13 }}>VA</div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: "#17205a" }}>VirtualAssistant<span style={{ color: "#4F46E5" }}>.com.ph</span></div>
        </div>

        <div style={{ display: "flex", marginTop: 56, color: "#4F46E5", fontSize: 15, fontWeight: 800, letterSpacing: ".13em" }}>{eyebrow || model.label}</div>
        <div style={{ display: "flex", marginTop: 13, maxWidth: 650, fontSize: title.length > 72 ? 43 : title.length > 52 ? 49 : 56, lineHeight: 1.03, letterSpacing: "-.045em", fontWeight: 800, color: "#101a4b" }}>{title}</div>
        <div style={{ display: "flex", marginTop: 19, maxWidth: 610, fontSize: 20, lineHeight: 1.38, color: "#475467" }}>{description}</div>

        <div style={{ display: "flex", marginTop: "auto", alignItems: "center" }}>
          {author ? <div style={{ display: "flex", padding: "9px 12px", borderRadius: 999, background: "#fff", border: "1px solid #e4e7ec", color: "#344054", fontSize: 14, fontWeight: 700 }}>By {author}</div> : null}
          <div style={{ display: "flex", marginLeft: author ? 10 : 0, padding: "9px 12px", borderRadius: 999, background: "#eef2ff", color: "#3538cd", fontSize: 14, fontWeight: 800 }}>Philippines</div>
        </div>
      </div>

      <div style={{ width: "42%", height: "100%", display: "flex", position: "relative", padding: "50px 40px 46px 4px", zIndex: 2 }}>
        <div style={{ position: "absolute", top: 66, left: 22, right: 26, display: "flex", flexWrap: "wrap", gap: 14 }}>
          {cards.map(([heading, copy], index) => (
            <div key={heading} style={{ width: index % 2 === 0 ? 222 : 204, minHeight: 145, display: "flex", flexDirection: "column", padding: "18px", borderRadius: 22, background: "rgba(255,255,255,.96)", border: "1px solid #eaecf0", boxShadow: "0 18px 42px rgba(68,76,231,.12)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 39, height: 39, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: index === 0 ? "#eef2ff" : index === 1 ? "#f4f3ff" : index === 2 ? "#ecfdf3" : "#fff7ed", color: index === 2 ? "#067647" : "#4F46E5", fontSize: 13, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</div>
                <div style={{ display: "flex", color: "#98a2b3", fontSize: 11, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div>
              </div>
              <div style={{ display: "flex", marginTop: 15, color: "#17205a", fontSize: 19, fontWeight: 800 }}>{heading}</div>
              <div style={{ display: "flex", marginTop: 7, color: "#667085", fontSize: 13, lineHeight: 1.25 }}>{copy}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", left: 26, right: 26, bottom: 42, display: "flex", padding: "14px 18px", borderRadius: 18, background: "#17205a", color: "#fff", fontSize: 14, lineHeight: 1.3, fontWeight: 700 }}>{model.footer}</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
