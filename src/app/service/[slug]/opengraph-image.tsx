import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { localizeContent, localizeEnglish } from "@/lib/content-language";
import { serviceMetaTitle, servicePageBySlug } from "@/lib/service-pages";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPECIAL: Record<string, { label: string; accent: string; cards: string[] }> = {
  seo: {
    label: "SEO WORKFLOWS",
    accent: "Search growth",
    cards: ["Keyword Research", "On-Page SEO", "Content Publishing", "SEO Reporting"],
  },
  "executive-virtual-assistant": {
    label: "EXECUTIVE SUPPORT",
    accent: "Executive coordination",
    cards: ["Calendar", "Inbox", "Meeting Prep", "Travel Planning"],
  },
  bookkeeping: {
    label: "BOOKKEEPING SUPPORT",
    accent: "Finance workflows",
    cards: ["Invoices", "Reconciliation", "Expense Tracking", "Monthly Reports"],
  },
  "customer-service": {
    label: "CUSTOMER SUPPORT",
    accent: "Responsive CX",
    cards: ["Inbox", "Live Chat", "Support Tickets", "Follow-Up"],
  },
  "social-media": {
    label: "SOCIAL MEDIA",
    accent: "Content operations",
    cards: ["Content Calendar", "Scheduling", "Community", "Reporting"],
  },
  ecommerce: {
    label: "ECOMMERCE SUPPORT",
    accent: "Store operations",
    cards: ["Products", "Orders", "Inventory", "Customer Messages"],
  },
  "real-estate": {
    label: "REAL ESTATE",
    accent: "Property operations",
    cards: ["Listings", "Lead Follow-Up", "CRM", "Appointments"],
  },
};

function roleName(name: string) {
  return name.replace(/ Virtual Assistant$/i, "").replace(/^Virtual /i, "");
}

export default async function ServiceOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) notFound();

  const s = localizeContent(page, page.locale);
  const title = localizeEnglish(serviceMetaTitle(s), page.locale);
  const special = SPECIAL[slug];
  const cards = special?.cards || s.tasks.slice(0, 4).map((task) =>
    task.replace(/\b\w/g, (letter) => letter.toUpperCase()),
  );
  const tools = s.tools.slice(0, 4);
  const role = roleName(s.name);
  const label = special?.label || role.toUpperCase();
  const accent = special?.accent || s.focus;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg,#ffffff 0%,#fafaff 46%,#eef2ff 100%)",
          color: "#101828",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 260, right: -90, top: -170, background: "rgba(122,90,248,.13)" }} />
        <div style={{ position: "absolute", width: 430, height: 430, borderRadius: 215, right: 270, bottom: -300, background: "rgba(68,76,231,.09)" }} />

        <div style={{ width: "57%", display: "flex", flexDirection: "column", padding: "52px 34px 44px 58px", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(145deg,#444ce7,#7a5af8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, marginRight: 13 }}>VA</div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: "#17205a" }}>VirtualAssistant<span style={{ color: "#5b45df" }}>.com.ph</span></div>
          </div>

          <div style={{ display: "flex", marginTop: 58, color: "#5b45df", fontSize: 15, fontWeight: 800, letterSpacing: ".14em" }}>{label}</div>
          <div style={{ display: "flex", marginTop: 14, maxWidth: 640, fontSize: title.length > 52 ? 49 : 55, lineHeight: 1.03, letterSpacing: "-.045em", fontWeight: 800, color: "#101a4b" }}>{title}</div>
          <div style={{ display: "flex", marginTop: 20, maxWidth: 600, fontSize: 21, lineHeight: 1.38, color: "#475467" }}>
            {s.metaDescription}
          </div>

          <div style={{ display: "flex", marginTop: "auto", gap: 10 }}>
            {tools.map((tool) => (
              <div key={tool} style={{ display: "flex", padding: "9px 12px", borderRadius: 999, background: "#fff", border: "1px solid #e4e7ec", color: "#475467", fontSize: 13, fontWeight: 700 }}>
                {tool}
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: "43%", display: "flex", position: "relative", padding: "42px 44px 42px 10px", zIndex: 2 }}>
          <div style={{ position: "absolute", top: 54, left: 44, right: 44, height: 118, borderRadius: 24, background: "rgba(255,255,255,.94)", border: "1px solid rgba(255,255,255,.9)", boxShadow: "0 20px 48px rgba(68,76,231,.14)", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 14, color: "#667085", fontWeight: 800, letterSpacing: ".08em" }}>ROLE FOCUS</div>
            <div style={{ display: "flex", marginTop: 9, fontSize: 25, color: "#17205a", fontWeight: 800 }}>{accent}</div>
          </div>

          <div style={{ position: "absolute", top: 194, left: 16, right: 24, display: "flex", flexWrap: "wrap", gap: 14 }}>
            {cards.map((card, index) => (
              <div key={card} style={{ width: index % 2 === 0 ? 222 : 204, minHeight: 118, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px", borderRadius: 22, background: "rgba(255,255,255,.95)", border: "1px solid #eaecf0", boxShadow: "0 16px 36px rgba(68,76,231,.11)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: index === 0 ? "#eef2ff" : index === 1 ? "#f4f3ff" : index === 2 ? "#ecfdf3" : "#fff7ed", color: index === 2 ? "#067647" : "#444ce7", fontSize: 18, fontWeight: 900 }}>
                  {index === 0 ? "✓" : index === 1 ? "↗" : index === 2 ? "●" : "◆"}
                </div>
                <div style={{ display: "flex", marginTop: 12, color: "#17205a", fontSize: 18, lineHeight: 1.15, fontWeight: 800 }}>{card}</div>
              </div>
            ))}
          </div>

          <div style={{ position: "absolute", left: 44, right: 34, bottom: 42, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 18, background: "#17205a", color: "#fff" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", color: "#c7d7fe", fontSize: 12, fontWeight: 800, letterSpacing: ".08em" }}>VETTED FILIPINO TALENT</div>
              <div style={{ display: "flex", marginTop: 4, fontSize: 17, fontWeight: 800 }}>Role-fit before resume volume</div>
            </div>
            <div style={{ display: "flex", width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", background: "#444ce7", fontSize: 20 }}>→</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
