import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Database, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";
import { organizationRef } from "@/lib/organization";
import { VA_RATE_REPORT_2026 as report } from "@/lib/va-rate-report-2026";
import styles from "./report.module.css";

const TITLE = "Virtual Assistant Rate & Skills Report Philippines 2026";
const DESCRIPTION = "First-party 2026 data from 137 Filipino Virtual Assistant profiles, including preferred USD hourly rates, experience, specialties, skills, and tools.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: canonicalPath("/research/virtual-assistant-rates-philippines-2026") },
  openGraph: {
    type: "article",
    title: TITLE,
    description: DESCRIPTION,
    url: canonicalPath("/research/virtual-assistant-rates-philippines-2026")
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION
  }
};

function money(value: number) {
  return value % 1 === 0 ? "$" + value.toFixed(0) : "$" + value.toFixed(2);
}

export default function VirtualAssistantRatesReport2026() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const url = base + "/research/virtual-assistant-rates-philippines-2026";
  const maxBucket = Math.max(...report.rateBuckets.map((item) => item.n));

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": url + "#article",
        headline: TITLE,
        description: DESCRIPTION,
        datePublished: report.asOf,
        dateModified: report.asOf,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "VirtualAssistant.com.ph Editorial Team", url: base + "/authors/editorial-team" },
        publisher: organizationRef(base)
      },
      {
        "@type": "Dataset",
        "@id": url + "#dataset",
        name: "VirtualAssistant.com.ph 2026 VA profile rate and skills snapshot",
        description: "Aggregated, anonymized profile-level snapshot used in the Virtual Assistant Rate & Skills Report Philippines 2026.",
        url,
        creator: organizationRef(base),
        dateModified: report.asOf,
        temporalCoverage: "2026",
        spatialCoverage: { "@type": "Country", name: "Philippines" },
        measurementTechnique: "Aggregated self-reported VirtualAssistant.com.ph candidate profile fields",
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/csv",
          contentUrl: base + "/data/virtual-assistant-rates-philippines-2026.csv"
        },
        variableMeasured: [
          "Preferred hourly rate in USD",
          "Years of professional experience",
          "Primary specialty",
          "Weekly availability",
          "Self-reported skills",
          "Self-reported tools"
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": url + "#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: "2026 Virtual Assistant Rate & Skills Report", item: url }
        ]
      }
    ]
  };

  return <>
    <SiteHeader />
    <main className={styles.page} id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      <header className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Research</span>
          </nav>
          <span className={styles.eyebrow}><Database size={15} /> First-party marketplace research</span>
          <h1>Filipino Virtual Assistant Rate &amp; Skills Report 2026</h1>
          <p className={styles.deck}>A transparent snapshot of the preferred USD hourly rates, experience, specialties, skills, and tools recorded in VirtualAssistant.com.ph candidate profiles. This is platform data, not a claim about every Virtual Assistant in the Philippines.</p>
          <div className={styles.meta}>
            <span><CalendarDays size={15} /> Snapshot date: September 22, 2026</span>
            <span><ShieldCheck size={15} /> Aggregated and anonymized</span>
            <a href="/data/virtual-assistant-rates-philippines-2026.csv" download>Download aggregate CSV</a>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}><strong>{report.totalProfiles}</strong><span>Virtual Assistant profiles in the snapshot</span></div>
            <div className={styles.stat}><strong>{report.profilesWithRate}</strong><span>profiles with a stated preferred USD hourly rate</span></div>
            <div className={styles.stat}><strong>{money(report.rateSummary.median)}/hr</strong><span>median preferred hourly rate in the rate-reporting sample</span></div>
            <div className={styles.stat}><strong>{money(report.rateSummary.p25)}–{money(report.rateSummary.p75)}/hr</strong><span>middle 50% of stated preferred hourly rates</span></div>
          </div>
        </div>
      </header>

      <div className={styles.container + " " + styles.body}>
        <section className={styles.section}>
          <h2>What the rate data says</h2>
          <p>Among the {report.profilesWithRate} profiles with a stated preferred hourly rate, the median is {money(report.rateSummary.median)}/hour and the average is {money(report.rateSummary.average)}/hour. The middle 50% runs from {money(report.rateSummary.p25)} to {money(report.rateSummary.p75)}/hour.</p>
          <div className={styles.callout}><strong>Do not read the lowest observed rate as a market floor.</strong> The current VirtualAssistant.com.ph profile form enforces a USD {report.currentProfileMinimumRate}/hour minimum, while older profile records in this snapshot include USD 5/hour preferences. The lower end therefore reflects both candidate preferences and platform rules over time.</div>

          <div className={styles.bars} aria-label="Preferred hourly rate distribution">
            {report.rateBuckets.map((item) => <div className={styles.barRow} key={item.label}>
              <span>{item.label}</span>
              <div className={styles.barTrack}><div className={styles.barFill} style={{ width: ((item.n / maxBucket) * 100) + "%" }} /></div>
              <strong>{item.n}</strong>
            </div>)}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Preferred hourly rates by primary specialty</h2>
          <p>Category rows are only shown when at least five rate-reporting profiles share that primary specialty. Small groups are suppressed because a tiny sample is not a useful benchmark.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Primary specialty</th><th>Profiles</th><th>25th percentile</th><th>Median</th><th>75th percentile</th><th>Average</th><th>Median experience</th></tr></thead>
              <tbody>{report.categoryRates.map((row) => <tr key={row.category}>
                <td><strong>{row.category}</strong></td>
                <td>{row.n}</td>
                <td>{money(row.p25)}</td>
                <td>{money(row.median)}</td>
                <td>{money(row.p75)}</td>
                <td>{money(row.average)}</td>
                <td>{row.medianYears} yrs</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p>Ecommerce has the highest median in the published category rows at $7/hour, while Lead Generation &amp; Sales is $6/hour and Marketing &amp; Social Media is $5.50/hour. These are sample observations, not recommended rates.</p>
        </section>

        <section className={styles.section}>
          <h2>Rate distribution by experience</h2>
          <p>More experience does not translate into a perfectly linear rate curve in this snapshot. The clearest difference appears in the 6+ year group, where the median reaches $6/hour and the 75th percentile reaches $8/hour.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Experience band</th><th>Profiles</th><th>25th percentile</th><th>Median</th><th>75th percentile</th></tr></thead>
              <tbody>{report.experienceRates.map((row) => <tr key={row.band}>
                <td><strong>{row.band}</strong></td><td>{row.n}</td><td>{money(row.p25)}</td><td>{money(row.median)}</td><td>{money(row.p75)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className={styles.callout}>The median professional experience among rate-reporting profiles is {report.rateSummary.medianYearsExperience} years, and the median stated weekly availability is {report.rateSummary.medianWeeklyHours} hours. Rate alone does not show role depth, communication quality, tool fluency, live coverage, or decision ownership.</div>
        </section>

        <section className={styles.section}>
          <h2>Most frequently listed tools and skills</h2>
          <p>Tool and skill counts come from the wider profile pool, not only the rate-reporting sample. They are self-reported profile fields, so they show prevalence in candidate profiles, not independently tested proficiency.</p>
          <div className={styles.twoCol}>
            <div className={styles.listCard}>
              <h3>Top tools</h3>
              <ol>{report.topTools.slice(0, 10).map((item) => <li key={item.label}><strong>{item.label}</strong> · {item.n} profiles</li>)}</ol>
              <p>{report.profilesWithTools} of {report.totalProfiles} profiles contain at least one tool entry.</p>
            </div>
            <div className={styles.listCard}>
              <h3>Top skills</h3>
              <ol>{report.topSkills.slice(0, 10).map((item) => <li key={item.label}><strong>{item.label}</strong> · {item.n} profiles</li>)}</ol>
              <p>{report.profilesWithSkills} of {report.totalProfiles} profiles contain at least one skill entry.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>How to use this report when hiring</h2>
          <p>The safest use is as a reality check, not as a price list. A hiring budget should still be built from the work, weekly hours, required overlap, tools, communication standard, independence, and consequence of mistakes.</p>
          <h3>Use the data to ask better questions</h3>
          <ul className={styles.method}>
            <li>If a role needs several specialties, compare it with specialist categories instead of anchoring on the overall median.</li>
            <li>If the work requires independent prioritization, client communication, or sensitive access, screen the evidence of judgment before negotiating around one hourly number.</li>
            <li>Separate the candidate&apos;s preferred rate from agency fees, payroll costs, benefits, software, equipment, and payment fees.</li>
            <li>For a commercial hiring decision, use the <Link href="/average-hourly-rate-virtual-assistants-philippines">Virtual Assistant hourly rate guide</Link> alongside this data snapshot.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Methodology and limitations</h2>
          <ul className={styles.method}>
            <li><strong>Source:</strong> VirtualAssistant.com.ph VA profile records as of September 22, 2026.</li>
            <li><strong>Rate sample:</strong> {report.profilesWithRate} profiles with a non-null, positive preferred hourly rate in USD.</li>
            <li><strong>Wider profile sample:</strong> {report.totalProfiles} candidate profiles for headline counts. Tool and skill tables use profiles with non-empty self-reported fields.</li>
            <li><strong>Privacy:</strong> the page publishes aggregate statistics only. It does not expose names, contact details, profile IDs, resumes, or individual profile records.</li>
            <li><strong>Small groups:</strong> specialty rows with fewer than five rate-reporting profiles are not published.</li>
            <li><strong>Not market-wide:</strong> the sample reflects people who created profiles on this platform and is not a statistically representative survey of all Filipino Virtual Assistants.</li>
            <li><strong>Not accepted compensation:</strong> preferred profile rates are asking preferences, not verified placement rates, payroll records, or client billing rates.</li>
            <li><strong>Platform floor:</strong> the current profile form requires at least USD {report.currentProfileMinimumRate}/hour; older records may predate that rule.</li>
          </ul>
        </section>

        <aside className={styles.cta}>
          <div>
            <h2>Turn the benchmark into a real hiring budget.</h2>
            <p>Compare the report with the work you need done, then model weekly hours and a realistic rate before you shortlist candidates.</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/tools/virtual-assistant-cost-calculator">Use the cost calculator <ArrowRight size={16} /></Link>
            <Link className={styles.secondary} href="/hire">Start a hiring brief</Link>
          </div>
        </aside>
      </div>
    </main>
    <SiteFooter />
  </>;
}
