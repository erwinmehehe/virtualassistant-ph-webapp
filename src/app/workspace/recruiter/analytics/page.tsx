import { requireRole } from "@/lib/auth";
import { parseSalesRange } from "@/lib/sales-analytics";
import { SalesAnalyticsDashboard } from "@/components/sales-analytics-dashboard";

export default async function RecruiterAnalyticsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const query=await searchParams;
  const {user}=await requireRole("recruiter");
  const days=parseSalesRange(query.days);
  const scope=query.scope==="mine"?"mine":"team";
  return <>
    <div className="page-head"><div><div className="kicker">Sales performance</div><h1>Conversion analytics</h1><p>See where client opportunities move, stall, or convert from enquiry through hire.</p></div></div>
    <SalesAnalyticsDashboard days={days} basePath="/workspace/recruiter/analytics" scope={scope} recruiterId={user.id} allowScopeToggle/>
  </>;
}
