import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Plus } from "lucide-react";

/**
 * Building blocks for the long-form service and industry hiring pages. They use
 * the homepage's hs-* design system (src/app/homepage-sections.css) plus the
 * sp-* additions in src/app/hiring-pages.css. Wrap the page body in
 * <div className="hs-root"> so the hs-* tokens apply.
 */

export function Band({ tone = "white", id, children }: { tone?: "white" | "soft"; id?: string; children: ReactNode }) {
  return (
    <section className={`hs-section sp-band ${tone === "soft" ? "hs-band-soft" : "hs-band-white"}`} id={id}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHead({ kicker, title, lede, center, action }: { kicker: string; title: ReactNode; lede?: ReactNode; center?: boolean; action?: ReactNode }) {
  const copy = (
    <>
      <span className="hs-kicker">{kicker}</span>
      <h2 className="hs-h2 sp-h2">{title}</h2>
      {lede ? <p className="hs-lede">{lede}</p> : null}
    </>
  );
  if (action) return <div className="hs-head hs-head-row"><div>{copy}</div>{action}</div>;
  return <div className={`hs-head${center ? " hs-head-center" : ""}`}>{copy}</div>;
}

export function Steps({ items, columns = 4 }: { items: { label?: string; title: string; copy: string }[]; columns?: 3 | 4 }) {
  return (
    <ol className={`hs-steps sp-steps-${columns}`}>
      {items.map((item, index) => (
        <li className="hs-step" key={item.title}>
          <div className="hs-step-top">
            <span className="sp-step-label">{item.label || `Step ${index + 1}`}</span>
            <span className="hs-step-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <h3>{item.title}</h3>
          <p>{item.copy}</p>
        </li>
      ))}
    </ol>
  );
}

export function CheckList({ items, tone = "brand" }: { items: ReactNode[]; tone?: "brand" | "green" }) {
  return (
    <ul className={`sp-checks sp-checks-${tone}`}>
      {items.map((item, index) => <li key={index}><CheckCircle2 size={16} aria-hidden="true" /><span>{item}</span></li>)}
    </ul>
  );
}

export function FaqBlock({ kicker = "Frequently asked questions", title, lede, faqs }: { kicker?: string; title: ReactNode; lede: string; faqs: { q: string; a: string }[] }) {
  return (
    <div className="hs-faq">
      <div className="hs-faq-intro">
        <span className="hs-kicker">{kicker}</span>
        <h2 className="hs-h2 sp-h2">{title}</h2>
        <p className="hs-lede">{lede}</p>
      </div>
      <div className="hs-faq-list">
        {faqs.map((faq, index) => (
          <details className="hs-faq-item" key={faq.q} open={index === 0}>
            <summary>{faq.q}<span className="hs-faq-toggle" aria-hidden="true"><Plus size={15} /></span></summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function LinkTiles({ items }: { items: { href: string; label: string; sub?: string; icon?: ReactNode }[] }) {
  return (
    <div className="sp-tiles">
      {items.map((item) => (
        <Link className="sp-tile" href={item.href} key={item.href}>
          {item.icon ? <span className="sp-tile-icon" aria-hidden="true">{item.icon}</span> : null}
          <span className="sp-tile-copy"><strong>{item.label}</strong>{item.sub ? <small>{item.sub}</small> : null}</span>
          <ArrowRight className="hs-tile-arrow" size={15} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

export function JumpNav({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav className="sp-jump" aria-label="On this page">
      <div className="container sp-jump-inner">
        <span>On this page</span>
        {links.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
      </div>
    </nav>
  );
}

export function CtaBand({ kicker = "Ready when you are", title, body, primary, secondary }: { kicker?: string; title: string; body: string; primary: { href: string; label: string; track?: string }; secondary?: { href: string; label: string } }) {
  return (
    <section className="hs-section hs-band-white sp-band">
      <div className="container">
        <div className="hs-cta">
          <span className="hs-kicker">{kicker}</span>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="hs-cta-actions">
            <a className="hs-btn hs-btn-light" href={primary.href} data-track={primary.track}>{primary.label} <ArrowRight size={16} /></a>
            {secondary ? <Link className="hs-btn hs-btn-outline-light" href={secondary.href}>{secondary.label}</Link> : null}
          </div>
          <div className="hs-cta-proof">
            <span><Check size={14} aria-hidden="true" /> Private brief</span>
            <span><Check size={14} aria-hidden="true" /> Human screening</span>
            <span><Check size={14} aria-hidden="true" /> You choose who to hire</span>
          </div>
        </div>
      </div>
    </section>
  );
}
