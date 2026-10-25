import { redirect } from "next/navigation";

// The old first-party acquisition/training telemetry report was retired.
// Sales and training operations reports remain on their dedicated pages.
export default function RetiredAnalyticsPage() {
  redirect("/workspace/admin/today");
}
