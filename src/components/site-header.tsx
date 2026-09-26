import { SiteNav } from "@/components/site-nav";

export function SiteHeader({
  context = "default",
}: {
  context?: "default" | "training";
} = {}) {
  return <SiteNav actionContext={context} />;
}
