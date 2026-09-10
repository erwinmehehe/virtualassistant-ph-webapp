import { requireRole } from "@/lib/auth";
import { parseSalesRange } from "@/lib/sales-analytics";
import { SalesAnalyticsDashboard } from "@/components/sales-analytics-dashboard";

export default async function AdminSalesAnalyticsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const query=await searchParams;
  await requireRole("admin");
  const days=parseSalesRange(query.days);
  return <>
    <div className="page-head"><div><div className="kicker">Agency revenue funnel</div><h1>Sales analytics</h1><p>Measure response speed, discovery, proposal performance, wins, pipeline value, sources, and recruiter outcomes.</p></div></div>
    <SalesAnalyticsDashboard days={days} basePath="/workspace/admin/sales"/>
  </>;
}
