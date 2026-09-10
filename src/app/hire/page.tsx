import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { submitRoleBriefAction } from "@/app/actions/leads";
import { VA_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { PublicAvatar } from "@/components/public-avatar";
import { AttributionFields } from "@/components/attribution-fields";
import { canonicalPath } from "@/lib/seo-url";

const HIRING_CALL_URL = "https://calendar.app.google/FxedmioyeJhKras87";

export const metadata: Metadata = {
  title: "Hire a Virtual Assistant from the Philippines",
  description:
    "Tell us the role, hours, timezone, and budget. Our recruiting team screens and matches vetted Filipino Virtual Assistants for your business.",
  keywords: ["hire a virtual assistant", "hire filipino virtual assistant", "get matched with a virtual assistant"],
  alternates: { canonical: canonicalPath("/hire") },
};

const screeningSteps = [
  [BriefcaseBusiness, "Relevant experience", "We look for evidence that matches the actual responsibilities in your brief."],
  [SearchCheck, "Practical skills", "Role-specific capability is checked before a candidate reaches your shortlist."],
  [Video, "Communication", "Video and recruiter review help assess clarity, professionalism, and client readiness."],
  [Clock3, "Schedule fit", "Availability, timezone overlap, hours, and start timing are checked against the role."],
] as const;

const processSteps = [
  ["01", "Send the workload", "Tell us the tasks, hours, timezone, tools, budget, and must-have experience."],
  ["02", "We recruit and screen", "Our team searches for the strongest fit and reviews the evidence before recommending anyone."],
  ["03", "Interview the shortlist", "You meet the strongest candidates, compare fit, and make the final hiring decision."],
  ["04", "Start with support", "Managed placements include onboarding guidance and continued support after your Virtual Assistant starts."],
] as const;

export default async function HirePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const talent = params.talent?.trim();
  const lead = params.lead?.trim();
  const sourcePath = params.source?.startsWith("/") && !params.source.startsWith("//") ? params.source : "/hire";
  const supabase = await createClient();
  const { data: requested } = talent
    ? await supabase
        .from("public_va_directory")
        .select("slug,full_name,avatar_url,headline,primary_category")
        .eq("slug", talent)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="pva-hire">
        <section className="pvh-hero">
          <div className="pvh-grid-pattern" aria-hidden="true" />
          <div className="pvh-orb pvh-orb-a" aria-hidden="true" />
          <div className="pvh-orb pvh-orb-b" aria-hidden="true" />
          <div className="container pvh-hero-grid">
            <div className="pvh-hero-copy">
              <div className="pvh-eyebrow">
                <span><ShieldCheck size={14} /> Human-reviewed hiring</span>
                <strong>Philippines-based recruiting support</strong>
              </div>

              <h1>
                Tell us the role. <em>We&apos;ll help you hire the right Virtual Assistant.</em>
              </h1>
              <p className="pvh-lede">
                Share the work, hours, timezone, and budget. Our recruiting team reviews the role, screens for fit, and helps you meet vetted Filipino Virtual Assistants worth interviewing.
              </p>

              <div className="pvh-choice-grid" aria-label="Hiring options">
                <div className="pvh-choice pvh-choice-featured">
                  <div className="pvh-choice-top">
                    <span><Sparkles size={13} /> Recommended</span>
                    <small>Managed</small>
                  </div>
                  <strong>Managed Virtual Assistant</strong>
                  <p>Recruiting, matching, onboarding support, and ongoing placement support after your hire starts.</p>
                </div>
                <div className="pvh-choice">
                  <div className="pvh-choice-top">
                    <span><UsersRound size={13} /> Flexible</span>
                    <small>Direct hire</small>
                  </div>
                  <strong>Recruit &amp; Direct Hire</strong>
                  <p>We recruit and screen the role, then your team takes over day-to-day management after hiring.</p>
                </div>
              </div>

              <div className="pvh-proof-list">
                <div><BadgeCheck size={18} /><span><strong>Screened before you interview</strong><small>Skills, communication, availability, and role fit are reviewed first.</small></span></div>
                <div><UsersRound size={18} /><span><strong>A focused shortlist</strong><small>No open marketplace resume pile. We recruit against the workload you actually need covered.</small></span></div>
                <div><Headphones size={18} /><span><strong>Human follow-up</strong><small>A recruiter can refine the brief with you and stay involved through the placement.</small></span></div>
              </div>

              <div className="pvh-callout">
                <span className="pvh-call-icon"><CalendarDays size={18} /></span>
                <div><strong>Prefer to talk through the role?</strong><span>Book a 15-minute hiring call with the team.</span></div>
                <a href={HIRING_CALL_URL} target="_blank" rel="noopener noreferrer">Book a call <ArrowRight size={14} /></a>
              </div>

              <div className="pvh-private-note"><ShieldCheck size={14} /> No account required. Your hiring request stays private while our team reviews it.</div>

              {requested ? (
                <div className="pvh-requested-talent">
                  <div className="pvh-requested-main">
                    <PublicAvatar name={requested.full_name} src={requested.avatar_url} size="sm" />
                    <div>
                      <small>Introduction requested for</small>
                      <strong>{requested.full_name}</strong>
                      <span>{requested.headline || requested.primary_category}</span>
                    </div>
                  </div>
                  <Link href={`/va/${requested.slug}`}>Review profile <ArrowRight size={14} /></Link>
                </div>
              ) : talent ? (
                <div className="alert">We could not find that talent profile, but you can still send your role brief.</div>
              ) : null}
            </div>

            <section id="hire-form" className="pvh-form-shell" aria-label="Hiring request form">
              <div className="pvh-form-glow" aria-hidden="true" />
              <div className="pvh-form-card">
                {params.sent ? (
                  <div className="pvh-success">
                    <div className="pvh-success-icon"><CheckCircle2 size={30} /></div>
                    <span className="pvh-kicker">Request received</span>
                    <h2>Your hiring request is with our team.</h2>
                    <p>A recruiter will review the role and use it to screen relevant candidates. We will follow up using the contact details you provide, and you do not need an account to get started.</p>

                    <div className="pvh-success-next">
                      <div><span>01</span><p><strong>We review the brief</strong><small>Responsibilities, schedule, tools, budget, and must-have experience.</small></p></div>
                      <div><span>02</span><p><strong>We screen for fit</strong><small>Relevant skills, communication, availability, and working overlap.</small></p></div>
                      <div><span>03</span><p><strong>We follow up</strong><small>We bring you the strongest next step for the role.</small></p></div>
                    </div>

                    <div className="pvh-success-actions">
                      <a className="pvh-btn pvh-btn-primary" href={HIRING_CALL_URL} target="_blank" rel="noopener noreferrer">Book a 15-minute call <ArrowRight size={16} /></a>
                      <Link className="pvh-btn pvh-btn-secondary" href="/find-talent">Browse vetted talent</Link>
                      {lead ? <Link className="pvh-text-link" href="/auth/login?next=%2Fworkspace%2Fclient">Already a client? Open Client Portal</Link> : null}
                    </div>
                  </div>
                ) : (
                  <form action={submitRoleBriefAction} className="compact-hire-form pvh-form">
                    <div className="pvh-form-head">
                      <div>
                        <span className="pvh-kicker">Free hiring request</span>
                        <h2>Tell us who you need</h2>
                        <p>About 60 seconds. Our recruiting team will review the role.</p>
                      </div>
                      <span className="pvh-secure-pill"><ShieldCheck size={13} /> Private</span>
                    </div>

                    <div className="pvh-form-steps" aria-hidden="true">
                      <span className="active"><i>1</i> Brief</span>
                      <span><i>2</i> Screen</span>
                      <span><i>3</i> Interview</span>
                    </div>

                    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}
                    {talent ? <input type="hidden" name="talent" value={talent} /> : null}
                    <AttributionFields sourcePath={sourcePath} />
                    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

                    <div className="field">
                      <label htmlFor="category">What type of help do you need? *</label>
                      <select id="category" name="category" required defaultValue={requested?.primary_category || (VA_CATEGORIES.includes(params.category as any) ? params.category : "")}>
                        <option value="" disabled>Select a specialty</option>
                        {VA_CATEGORIES.map((x, index) => <option key={`${String(x)}-${index}`}>{x}</option>)}
                      </select>
                    </div>

                    <div className="form-grid compact-form-grid">
                      <div className="field"><label htmlFor="hours">Hours / week *</label><select id="hours" name="hours" required defaultValue=""><option value="" disabled>Select hours</option><option>Under 10 hours/week</option><option>10 to 20 hours/week</option><option>20 to 30 hours/week</option><option>30 to 40 hours/week</option><option>40+ hours/week</option></select></div>
                      <div className="field"><label htmlFor="budget">Hourly budget *</label><select id="budget" name="budget" required defaultValue=""><option value="" disabled>Select budget</option><option>USD 5 to 8/hour</option><option>USD 8 to 12/hour</option><option>USD 12 to 18/hour</option><option>USD 18 to 25/hour</option><option>USD 25+/hour</option><option>Not sure yet</option></select></div>
                    </div>

                    <div className="form-grid compact-form-grid">
                      <div className="field"><label htmlFor="timezone">Timezone / overlap *</label><input id="timezone" name="timezone" required placeholder="US Eastern, 3h overlap" /></div>
                      <div className="field"><label htmlFor="start_time">Start date</label><select id="start_time" name="start_time" defaultValue=""><option value="">Flexible</option><option>As soon as possible</option><option>Within 2 weeks</option><option>Within 30 days</option><option>More than 30 days</option></select></div>
                    </div>

                    <div className="field"><label htmlFor="email">Work email *</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></div>
                    <div className="field"><label htmlFor="message">What should this Virtual Assistant own? *</label><textarea id="message" name="message" rows={3} required minLength={15} placeholder="Main tasks, tools, or must-have experience. Example: inbox and calendar management, CRM updates, and customer follow-up in HubSpot." /></div>

                    <details className="hire-optional-details pvh-optional-details">
                      <summary>Add contact details <span>(optional)</span></summary>
                      <div className="form-grid compact-form-grid">
                        <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" /></div>
                        <div className="field"><label htmlFor="company">Company</label><input id="company" name="company" autoComplete="organization" /></div>
                      </div>
                      <div className="field"><label htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} placeholder="+1 555 123 4567" /></div>
                    </details>

                    <button className="pvh-btn pvh-btn-primary pvh-submit" type="submit" data-track="role_brief_submit">Start my hiring request <ArrowRight size={16} /></button>
                    <p className="pvh-fineprint"><ShieldCheck size={13} /> Private hiring request. No account is required to start the search.</p>
                  </form>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="pvh-trust-strip" aria-label="Hiring advantages">
          <div className="container pvh-trust-grid">
            <div><span>01</span><strong>Skip the resume pile</strong><small>Start with screened candidates worth interviewing.</small></div>
            <div><span>02</span><strong>Human recruiter review</strong><small>Skills and communication are checked before the shortlist.</small></div>
            <div><span>03</span><strong>You make the final decision</strong><small>Interview the strongest fits and choose who joins your team.</small></div>
            <div><span>04</span><strong>Support after hiring</strong><small>Managed placements stay supported after your Virtual Assistant starts.</small></div>
          </div>
        </section>

        <section className="pvh-section pvh-section-white">
          <div className="container pvh-section-grid">
            <div className="pvh-section-copy">
              <span className="pvh-kicker">What we screen</span>
              <h2>A shortlist built around the work, not just a job title.</h2>
              <p>We use your brief to focus the search on the things that actually matter in the role. That means less time sorting profiles and more time interviewing candidates who can plausibly do the job.</p>
              <Link href="/how-vetting-works" className="pvh-text-link">See how our vetting works <ArrowRight size={15} /></Link>
            </div>
            <div className="pvh-screen-grid">
              {screeningSteps.map(([Icon, title, copy]) => (
                <article key={title} className="pvh-screen-card">
                  <span className="pvh-screen-icon"><Icon size={20} /></span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <span className="pvh-screen-check"><Check size={13} /> Reviewed before shortlist</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pvh-section pvh-section-soft">
          <div className="container">
            <div className="pvh-section-head pvh-centered">
              <span className="pvh-kicker">How hiring works</span>
              <h2>From role brief to the right hire, with a human team behind the process.</h2>
              <p>You do not need to manage an open marketplace. Give us the workload and we help move the role through recruiting, screening, interviews, and placement.</p>
            </div>
            <div className="pvh-process-grid">
              {processSteps.map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pvh-final">
          <div className="pvh-final-grid-pattern" aria-hidden="true" />
          <div className="container pvh-final-inner">
            <div>
              <span className="pvh-final-kicker"><MessageSquareText size={14} /> Start with a private role brief</span>
              <h2>Ready to stop sorting applicants and start meeting the right people?</h2>
              <p>Tell us the role and our recruiting team will review the workload, budget, schedule, and experience you need.</p>
            </div>
            <div className="pvh-final-actions">
              <a className="pvh-btn pvh-btn-light" href="#hire-form">Start your hiring request <ArrowRight size={16} /></a>
              <a className="pvh-btn pvh-btn-ghost" href={HIRING_CALL_URL} target="_blank" rel="noopener noreferrer">Book a 15-minute call</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
