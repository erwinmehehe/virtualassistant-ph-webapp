import Link from "next/link";
import { RecruiterPerformanceAnalytics } from "@/components/recruiter-performance-analytics";
import { RecruiterPerformanceFunnel } from "@/components/recruiter-performance-funnel";

export default async function RecruiterPerformancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tab = params.tab === "funnel" ? "funnel" : "analytics";
  const childParams = Promise.resolve(params);

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <div className="dash-kicker">Recruiter performance</div>
          <h1>Performance</h1>
          <p>Use one place to understand operating speed, conversion, and where the hiring pipeline is slowing down.</p>
        </div>
      </div>
      <nav className="role-filter-tabs" aria-label="Performance views">
        <Link className={tab === "analytics" ? "active" : ""} aria-current={tab === "analytics" ? "page" : undefined} href="/workspace/recruiter/performance?tab=analytics">Analytics</Link>
        <Link className={tab === "funnel" ? "active" : ""} aria-current={tab === "funnel" ? "page" : undefined} href="/workspace/recruiter/performance?tab=funnel">Agency Funnel</Link>
      </nav>
      {tab === "funnel"
        ? <RecruiterPerformanceFunnel searchParams={childParams}/>
        : <RecruiterPerformanceAnalytics searchParams={childParams}/>}
    </div>
  );
}
