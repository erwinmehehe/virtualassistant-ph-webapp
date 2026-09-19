import type { ReactNode } from "react";

export function CompactPageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return <section className="compact-page-header">
    <div className="container compact-page-header-inner">
      <div className="compact-page-header-copy">
        {eyebrow ? <div className="compact-page-eyebrow">{eyebrow}</div> : null}
        {title}
        {description ? <div className="compact-page-description">{description}</div> : null}
        {meta ? <div className="compact-page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="compact-page-actions">{actions}</div> : null}
    </div>
  </section>;
}
