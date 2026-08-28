import { AlertTriangle } from "lucide-react";

/**
 * Rendered above a dashboard when one or more of its queries failed. Counts and
 * "next best action" copy below are computed from whatever did load, so the
 * page must say plainly that it is showing an incomplete picture.
 */
export function DashboardDegradedNotice({ issues }: { issues: string[] }) {
  if (!issues.length) return null;
  return (
    <div className="dashboard-degraded" role="status">
      <AlertTriangle size={18} />
      <div>
        <strong>Some of this page didn’t load.</strong>
        <p>We couldn’t load {issues.join(", ")}. Any counts or suggested actions below may be incomplete — refresh before acting on them.</p>
      </div>
    </div>
  );
}
