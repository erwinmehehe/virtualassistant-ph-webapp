"use client";

import { useEffect, useState } from "react";
import { submitRoleBriefAction } from "@/app/actions/leads";
import { AttributionFields } from "@/components/attribution-fields";
import { VA_CATEGORIES } from "@/lib/constants";
import { FormDraftPersistence } from "@/components/form-draft-persistence";

/**
 * Shared lead form for public marketing pages.
 *
 * The server action returns visitors to the source page. Reading the redirect
 * query string here lets static SEO pages show success and error states without
 * making every page server component depend on searchParams.
 */
export function RoleBriefForm({
  sourcePath,
  heading = "Tell us who you need",
  subheading = "About 60 seconds. Our recruiting team will review the role and follow up.",
  error,
  sent
}: {
  sourcePath: string;
  heading?: string;
  subheading?: string;
  error?: string;
  sent?: boolean;
}) {
  const [urlState, setUrlState] = useState<{ error?: string; sent?: boolean }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlState({
      error: error === undefined ? params.get("error") || undefined : undefined,
      sent: sent === undefined ? params.get("sent") === "1" : undefined
    });
  }, [error, sent]);

  const resolvedError = error ?? urlState.error;
  const resolvedSent = sent ?? urlState.sent ?? false;
  const formId = `role-brief-${sourcePath.replace(/[^a-z0-9]+/gi, "-")}`;

  if (resolvedSent) {
    return (
      <div className="card compact-hire-form role-brief-sent" role="status">
        <h2>Hiring request received</h2>
        <p className="muted">Our recruiting team will review the role, screen for fit, and follow up using the contact details you provide. You do not need to create an account to get started.</p>
        <a className="btn btn-primary" href="/book-client-call">Book a client discovery call</a>
      </div>
    );
  }

  return (
    <form id={formId} action={submitRoleBriefAction} className="card stack compact-hire-form">
      <div className="compact-hire-form-head"><h2>{heading}</h2><p className="small muted">{subheading}</p></div>
      {resolvedError ? <div className="alert" role="alert">{resolvedError}</div> : null}
      <AttributionFields sourcePath={sourcePath} />
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>

      <div className="field"><label htmlFor="rb-category">What type of help do you need? *</label>
        <select id="rb-category" name="category" required defaultValue=""><option value="" disabled>Select a specialty</option>{VA_CATEGORIES.map((x, index) => <option key={`${String(x)}-${index}`}>{x}</option>)}</select>
      </div>

      <div className="form-grid compact-form-grid">
        <div className="field"><label htmlFor="rb-hours">Hours / week *</label>
          <select id="rb-hours" name="hours" required defaultValue=""><option value="" disabled>Select hours</option><option>Under 10 hours/week</option><option>10 to 20 hours/week</option><option>20 to 30 hours/week</option><option>30 to 40 hours/week</option><option>40+ hours/week</option></select>
        </div>
        <div className="field"><label htmlFor="rb-budget">Hourly budget *</label>
          <select id="rb-budget" name="budget" required defaultValue=""><option value="" disabled>Select budget</option><option>USD 6 to 8/hour</option><option>USD 8 to 12/hour</option><option>USD 12 to 18/hour</option><option>USD 18 to 25/hour</option><option>USD 25+/hour</option><option>Not sure yet</option></select>
        </div>
      </div>

      <div className="form-grid compact-form-grid">
        <div className="field"><label htmlFor="rb-timezone">Timezone / overlap *</label><input id="rb-timezone" name="timezone" required placeholder="US Eastern, 3h overlap"/></div>
        <div className="field"><label htmlFor="rb-start">Start date</label>
          <select id="rb-start" name="start_time" defaultValue=""><option value="">Flexible</option><option>As soon as possible</option><option>Within 2 weeks</option><option>Within 30 days</option><option>More than 30 days</option></select>
        </div>
      </div>

      <div className="field"><label htmlFor="rb-message">What should this Virtual Assistant own? *</label><textarea id="rb-message" name="message" rows={3} required minLength={15} placeholder="Main tasks, tools, or must-have experience, for example inbox and calendar management, CRM updates, and customer follow-up in HubSpot."/></div>

      <div className="compact-hire-form-head compact-contact-head">
        <h3>Contact details</h3>
        <p className="small muted">Tell us who to contact about this hiring request.</p>
      </div>
      <div className="form-grid compact-form-grid">
        <div className="field"><label htmlFor="rb-name">Your name *</label><input id="rb-name" name="name" required autoComplete="name"/></div>
        <div className="field"><label htmlFor="rb-company">Company *</label><input id="rb-company" name="company" required autoComplete="organization"/></div>
      </div>
      <div className="form-grid compact-form-grid">
        <div className="field"><label htmlFor="rb-email">Work email *</label><input id="rb-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com"/></div>
        <div className="field"><label htmlFor="rb-phone">Phone / WhatsApp <span className="muted">(optional)</span></label><input id="rb-phone" name="phone" type="tel" autoComplete="tel" maxLength={50} placeholder="+1 555 123 4567"/></div>
      </div>

      <button className="btn btn-primary compact-hire-submit" type="submit" data-track="role_brief_submit">{heading}</button>
      <FormDraftPersistence formId={formId} storageKey={sourcePath} />
      <p className="small muted role-brief-note">Private hiring request. No account is required to start the search.</p>
    </form>
  );
}
