import { AgencyFunnelDashboard } from "@/components/agency-funnel-dashboard";
import { requireRoleFast } from "@/lib/auth";

function range(value?: string) {
  const parsed = Number(value || 90);
  return [30,90,180].includes(parsed) ? parsed : 90;
}

export default async function AdminFunnelPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const query = await searchParams;
  await requireRoleFast("admin");
  return <AgencyFunnelDashboard recruiterId={null} days={range(query.days)} basePath="/workspace/admin/funnel" scopeLabel="Agency-wide hiring pipeline" leadsPath="/workspace/admin/leads" rolesPath="/workspace/admin/jobs" />;
}
