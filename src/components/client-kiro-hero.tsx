import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Kiro } from "@/components/kiro";

export function ClientKiroHero({
  greeting,
  firstName,
  title,
  copy,
  href,
  label,
}: {
  greeting: string;
  firstName: string;
  title: string;
  copy: string;
  href: string;
  label: string;
}) {
  return (
    <>
      <header className="client-kiro-greeting">
        <h1>{greeting}, {firstName}!</h1>
        <p>Here’s what’s happening with your hire.</p>
      </header>

      <section className="client-kiro-rendered-hero" aria-labelledby="client-kiro-current-action">
        <div className="client-kiro-rendered-art" aria-hidden="true">
          <Kiro className="client-kiro-rendered-image" priority />
        </div>
        <div className="client-kiro-rendered-copy">
          <span className="client-kiro-rendered-eyebrow">Kiro · Your VAPH Guide</span>
          <h2 id="client-kiro-current-action">{title}</h2>
          <p>{copy}</p>
          <div className="client-kiro-rendered-actions">
            <Link className="btn btn-primary" href={href}>
              {label}<ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
