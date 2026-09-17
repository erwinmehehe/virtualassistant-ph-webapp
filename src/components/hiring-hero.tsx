import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, Check, Clock3, ShieldCheck } from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";

/**
 * Shared hero for the service and industry hiring pages: copy and delegation
 * checklist on the left, the hiring brief form on the right. Styles live in
 * src/app/hiring-brief-form.css under the "hh-" prefix.
 */

type Crumb = { href?: string; label: string };
type TalentPreview = { user_id: string; full_name?: string | null; avatar_url?: string | null };

export function HiringHero({
  crumbs,
  eyebrow,
  titleLead,
  titleAccent,
  titleTail,
  lede,
  tasks,
  tools = [],
  talent = [],
  talentLabel,
  primary,
  secondary,
  note,
  form,
  footer
}: {
  crumbs: Crumb[];
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  titleTail?: string;
  lede: string;
  tasks: string[];
  tools?: string[];
  talent?: TalentPreview[];
  talentLabel?: string;
  primary: { href: string; label: string; track?: string };
  secondary?: { href: string; label: string };
  note?: ReactNode;
  form: ReactNode;
  footer?: ReactNode;
}) {
  const faces = talent.filter((va) => va.avatar_url).slice(0, 4);

  return (
    <section className="hh">
      <div className="container">
        <nav className="hh-crumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`}>
              {index ? <span className="hh-crumb-sep" aria-hidden="true">/</span> : null}
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
            </span>
          ))}
        </nav>

        <div className="hh-grid">
          <div className="hh-copy">
            <span className="hh-eyebrow"><BadgeCheck size={14} />{eyebrow}</span>
            <h1 className="hh-title">
              {titleLead}{titleAccent ? <> <span className="hh-accent">{titleAccent}</span></> : null}{titleTail ? <> {titleTail}</> : null}
            </h1>
            <p className="hh-lede">{lede}</p>

            <div className="hh-tasks" aria-label="Work you can delegate">
              <div className="hh-tasks-label">What you can hand off</div>
              <ul>
                {tasks.slice(0, 6).map((task, index) => (
                  <li key={`${task}-${index}`}><span className="hh-tick"><Check size={12} strokeWidth={3} /></span>{task}</li>
                ))}
              </ul>
              {tools.length ? (
                <div className="hh-tools"><span>Tools</span>{tools.slice(0, 5).map((tool) => <em key={tool}>{tool}</em>)}</div>
              ) : null}
            </div>

            <div className="hh-actions">
              <Link className="hh-btn" href={primary.href} data-track={primary.track}>{primary.label} <ArrowRight size={15} /></Link>
              {secondary ? <a className="hh-link" href={secondary.href}>{secondary.label}</a> : null}
            </div>

            {faces.length >= 2 ? (
              <div className="hh-talent">
                <div className="hh-faces">{faces.map((va) => <PublicAvatar key={va.user_id} name={va.full_name} src={va.avatar_url} size="sm" />)}</div>
                <span>{talentLabel || "Approved Filipino VAs available to interview"}</span>
              </div>
            ) : null}

            <ul className="hh-assurances">
              <li><ShieldCheck size={15} />Recruiter-vetted</li>
              <li><Clock3 size={15} />Your business hours</li>
              <li><CalendarCheck size={15} />You interview and choose</li>
            </ul>
            {note ? <p className="hh-note">{note}</p> : null}
          </div>

          <div className="hh-form">{form}</div>
        </div>
        {footer}
      </div>
    </section>
  );
}
