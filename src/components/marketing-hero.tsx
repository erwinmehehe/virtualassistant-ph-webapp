import type { ReactNode } from "react";

export function MarketingHero({
  eyebrow,
  title,
  intro,
  actions,
  trust,
  form,
  className = ""
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro: ReactNode;
  actions?: ReactNode;
  trust?: ReactNode;
  form: ReactNode;
  className?: string;
}) {
  return (
    <section className={`va-marketing-hero ${className}`.trim()}>
      <div className="container va-marketing-hero-grid">
        <div className="va-marketing-hero-copy">
          {eyebrow ? <div className="kicker">{eyebrow}</div> : null}
          {title}
          {intro}
          {actions ? <div className="hero-actions">{actions}</div> : null}
          {trust ? <div className="va-trust-row">{trust}</div> : null}
        </div>
        <aside className="va-marketing-form-shell" aria-label="Start a hiring request">
          {form}
        </aside>
      </div>
    </section>
  );
}
