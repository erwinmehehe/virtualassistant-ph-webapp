import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Managed VA vs. Direct Hire",
  description: "Compare Managed VA service and Direct Hire placement so you know exactly who handles recruiting, onboarding, ongoing support, and replacement.",
  keywords: ["managed virtual assistant vs direct hire", "managed va service philippines", "direct hire virtual assistant"],
  alternates: { canonical: canonicalPath("/managed-vs-direct-hire") }
};

const rows: [string, string, string][] = [
  ["Recruiting & screening", "We handle it", "We handle it"],
  ["Skills testing & vetting", "We handle it", "We handle it"],
  ["Onboarding", "Structured onboarding workroom", "Your team handles it"],
  ["Day-to-day management", "Your team", "Your team"],
  ["Ongoing check-ins & support", "Included", "Not included"],
  ["Replacement if it's not working out", "Included in the first 30 days", "Separate placement fee applies"],
  ["Payment model", "VA compensation + ongoing service margin", "VA compensation + one-time placement fee"],
  ["Best for", "Teams that want backup and accountability built in", "Teams confident managing the VA relationship solo"]
];

export default function ManagedVsDirectHirePage() {
  return <><SiteHeader/><main id="main-content">
    <section className="section public-hero-small"><div className="container"><div className="public-page-head">
      <h1 className="public-page-title">Managed VA vs. Direct Hire</h1>
      <p className="public-lede">Both start the same way -- we recruit, screen, and match a vetted candidate to your role. The difference is what happens after your VA starts.</p>
      <div className="row wrap" style={{ marginTop: 20 }}><Link className="btn btn-primary btn-lg" href="/hire">Get a managed VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/pricing">See pricing</Link></div>
    </div></div></section>

    <section className="section section-white"><div className="container">
      <div className="table-wrap responsive-table" style={{ background: "#fff" }}><table>
        <thead><tr><th></th><th>Managed VA</th><th>Direct hire</th></tr></thead>
        <tbody>{rows.map(([label, managed, direct]) => <tr key={label}>
          <td data-label=""><strong>{label}</strong></td>
          <td data-label="Managed VA">{managed}</td>
          <td data-label="Direct hire">{direct}</td>
        </tr>)}</tbody>
      </table></div>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head"><h2>The first 30 days with a Managed VA.</h2><p>What a typical Managed VA onboarding looks like -- your 30-day replacement window runs alongside this.</p></div>
      <div className="process-grid four-step-process">
        <div className="process-step"><div className="process-number">Before start</div><h3>Access &amp; setup</h3><p className="muted">Role brief confirmed, tools and access provisioned, SOPs and expectations agreed before day one.</p></div>
        <div className="process-step"><div className="process-number">Week 1</div><h3>Onboarding &amp; shadowing</h3><p className="muted">Introductions, training, and orientation inside the onboarding workroom.</p></div>
        <div className="process-step"><div className="process-number">Week 2</div><h3>First recurring tasks</h3><p className="muted">Your VA takes ownership of the first agreed recurring responsibilities.</p></div>
        <div className="process-step"><div className="process-number">Weeks 3-4</div><h3>Expanding scope</h3><p className="muted">Responsibilities grow as the working relationship and trust build.</p></div>
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>Day 30: a check-in to confirm fit -- this is also when the replacement window closes. Exact pacing depends on the role and how quickly access and information are provided on your side.</p>
    </div></section>

    <section className="section"><div className="container public-content-grid">
      <div className="card stack"><h3><CheckCircle2 size={18}/> Choose Managed VA if...</h3>
        <p className="muted">You want a backup plan if the placement doesn't work out, ongoing accountability beyond the hire, and someone to call if something goes wrong -- not just an introduction.</p>
      </div>
      <div className="card stack"><h3><X size={18}/> Choose Direct Hire if...</h3>
        <p className="muted">You already have the internal capacity to manage a remote hire day-to-day and just need help finding and vetting the right person.</p>
      </div>
    </div></section>
  </main><SiteFooter/></>;
}
