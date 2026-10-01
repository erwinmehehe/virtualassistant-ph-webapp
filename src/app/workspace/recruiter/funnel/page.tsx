import { AgencyFunnelDashboard } from "@/components/agency-funnel-dashboard";
import { requireRoleFast } from "@/lib/auth";

function range(value?: string) {
  const parsed = Number(value || 90);
  return [30,90,180].includes(parsed) ? parsed : 90;
}

export default async function RecruiterFunnelPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const query = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  return <AgencyFunnelDashboard recruiterId={userId} days={range(query.days)} basePath="/workspace/recruiter/funnel" scopeLabel="Your owned hiring pipeline" leadsPath="/workspace/recruiter/leads" rolesPath="/workspace/recruiter/roles" />;
}
