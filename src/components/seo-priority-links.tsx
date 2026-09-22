import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { canonicalPath } from "@/lib/seo-url";
import type { SeoPriorityLink } from "@/lib/seo-priority-links";

export function SeoPriorityLinks({
  links,
  title = "Related Philippines VA research"
}: {
  links: SeoPriorityLink[];
  title?: string;
}) {
  if (!links.length) return null;

  return <aside className="blog-context-links" aria-label={title}>
    <div className="blog-context-label">{title}</div>
    <div className="blog-context-grid">
      {links.map((link) => <Link href={canonicalPath(link.href)} key={link.href} data-track="seo_priority_internal_link">
        <span><strong>{link.label}</strong><small>{link.description}</small></span>
        <ArrowRight size={15} aria-hidden="true"/>
      </Link>)}
    </div>
  </aside>;
}
