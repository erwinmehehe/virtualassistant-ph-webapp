"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, UserRoundSearch } from "lucide-react";
import { submitDiscoveryBookingAction } from "@/app/actions/leads";
import type { DiscoverySlotDay } from "@/lib/discovery-booking";

type Audience = "client" | "va" | null;

export function ClientBookingForm({ days, error }: { days: DiscoverySlotDay[]; error?: string }) {
  const [audience, setAudience] = useState<Audience>(null);
  const [selectedDay, setSelectedDay] = useState(days[0]?.dateKey || "");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [browserTimeZone, setBrowserTimeZone] = useState("Asia/Manila");

  useEffect(() => {
    setBrowserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila");
  }, []);

  const activeDay = days.find((day) => day.dateKey === selectedDay) || days[0];
  const localSlotLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const day of days) {
      for (const slot of day.slots) {
        labels.set(slot.iso, new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: browserTimeZone,
        }).format(new Date(slot.iso)));
      }
    }
    return labels;
  }, [browserTimeZone, days]);

  return (
    <div className="booking-flow-card">
      <div className="booking-step-head">
        <span>Step 1 of 3</span>
        <h2>First, which best describes you?</h2>
        <p>This calendar is reserved for businesses looking to hire a Virtual Assistant.</p>
      </div>

      <div className="booking-audience-grid" role="radiogroup" aria-label="Choose whether you are hiring or applying">
        <button
          className={`booking-audience-option ${audience === "client" ? "is-selected" : ""}`}
          type="button"
          role="radio"
          aria-checked={audience === "client"}
          onClick={() => setAudience("client")}
        >
          <BriefcaseBusiness size={24} />
          <span><strong>I am hiring</strong><small>I represent a business and need a Virtual Assistant.</small></span>
          {audience === "client" ? <CheckCircle2 size={20} /> : null}
        </button>
        <button
          className={`booking-audience-option ${audience === "va" ? "is-selected" : ""}`}
          type="button"
          role="radio"
          aria-checked={audience === "va"}
          onClick={() => setAudience("va")}
        >
          <UserRoundSearch size={24} />
          <span><strong>I am a Virtual Assistant</strong><small>I want to apply, interview, or ask about VA work.</small></span>
          {audience === "va" ? <CheckCircle2 size={20} /> : null}
        </button>
      </div>

      {audience === "va" ? (
        <div className="booking-va-route" role="status">
          <UserRoundSearch size={30} />
          <div>
            <h3>You are in the right place, but this is not the VA interview calendar.</h3>
            <p>Create or open your VA profile. Recruiter interview invitations and updates appear in your VA workspace.</p>
            <div className="booking-va-actions">
              <Link className="btn btn-primary" href="/auth/join/va">Apply as a Virtual Assistant</Link>
              <Link className="btn" href="/auth/login?next=%2Fworkspace%2Fva">Open VA workspace</Link>
              <Link className="text-link" href="/jobs">Browse VA jobs</Link>
            </div>
          </div>
        </div>
      ) : null}

      {audience === "client" ? (
        <form id="client-discovery-booking" className="booking-client-form" action={submitDiscoveryBookingAction}>
          <input type="hidden" name="audience" value="client" />
          <input type="hidden" name="scheduled_at" value={selectedSlot} />
          <input type="hidden" name="timezone" value={browserTimeZone} />
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="booking-section">
            <div className="booking-section-title">
              <span>Step 2 of 3</span>
              <h3>Choose a time</h3>
              <p><Clock3 size={14} /> 30 minutes. Times shown in {browserTimeZone.replaceAll("_", " ")}.</p>
            </div>
            {days.length ? (
              <>
                <div className="booking-date-tabs" role="tablist" aria-label="Available discovery call dates">
                  {days.map((day) => (
                    <button
                      key={day.dateKey}
                      className={selectedDay === day.dateKey ? "is-active" : ""}
                      type="button"
                      role="tab"
                      aria-selected={selectedDay === day.dateKey}
                      onClick={() => { setSelectedDay(day.dateKey); setSelectedSlot(""); }}
                    >
                      <CalendarDays size={15} /> {day.label}
                    </button>
                  ))}
                </div>
                <div className="booking-time-grid" role="radiogroup" aria-label={`Available times for ${activeDay?.label || "selected date"}`}>
                  {activeDay?.slots.map((slot) => (
                    <button
                      key={slot.iso}
                      className={selectedSlot === slot.iso ? "is-selected" : ""}
                      type="button"
                      role="radio"
                      aria-checked={selectedSlot === slot.iso}
                      onClick={() => setSelectedSlot(slot.iso)}
                    >
                      {localSlotLabels.get(slot.iso) || slot.timeLabel}
                    </button>
                  ))}
                </div>
                <p className="booking-time-note">Availability is managed in Philippine time. Your confirmation will include both your timezone and Asia/Manila.</p>
              </>
            ) : (
              <div className="booking-no-slots">No online slots are currently available. Please use the hiring request form and our team will contact you.</div>
            )}
          </div>

          <div className="booking-section">
            <div className="booking-section-title">
              <span>Step 3 of 3</span>
              <h3>Tell us what you need</h3>
              <p>Your answers let us prepare before the call.</p>
            </div>

            {error ? <div className="alert error" role="alert">{error}</div> : null}
            <div className="booking-question-grid">
              <div className="field"><label htmlFor="booking-name">Your name *</label><input id="booking-name" name="name" required minLength={2} autoComplete="name" /></div>
              <div className="field"><label htmlFor="booking-email">Work email *</label><input id="booking-email" name="email" required type="email" autoComplete="email" /></div>
              <div className="field"><label htmlFor="booking-phone">Phone or WhatsApp</label><input id="booking-phone" name="phone" autoComplete="tel" /></div>
              <div className="field"><label htmlFor="booking-company">Company *</label><input id="booking-company" name="company" required minLength={2} autoComplete="organization" /></div>
              <div className="field"><label htmlFor="booking-company-url">Company website</label><input id="booking-company-url" name="company_url" type="url" placeholder="https://" inputMode="url" /></div>
              <div className="field">
                <label htmlFor="booking-service">What type of VA do you need? *</label>
                <select id="booking-service" name="service" required defaultValue="">
                  <option value="" disabled>Select a role</option>
                  <option>Administrative Support</option>
                  <option>Executive Assistance</option>
                  <option>Customer Service</option>
                  <option>Lead Generation &amp; Sales</option>
                  <option>Marketing &amp; Social Media</option>
                  <option>SEO</option>
                  <option>Bookkeeping &amp; Finance</option>
                  <option>Ecommerce</option>
                  <option>Real Estate</option>
                  <option>Web &amp; WordPress</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="booking-hours">Hours needed each week *</label>
                <select id="booking-hours" name="hours" required defaultValue="">
                  <option value="" disabled>Select hours</option>
                  <option>10 hours or less</option>
                  <option>11-20 hours</option>
                  <option>21-30 hours</option>
                  <option>31-40 hours</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="booking-budget">Hourly VA budget *</label>
                <select id="booking-budget" name="budget" required defaultValue="">
                  <option value="" disabled>Select budget</option>
                  <option>USD 5-7/hour</option>
                  <option>USD 8-10/hour</option>
                  <option>USD 11-15/hour</option>
                  <option>USD 16+/hour</option>
                  <option>I need guidance</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="booking-timeline">When do you want the VA to start? *</label>
                <select id="booking-timeline" name="start_time" required defaultValue="">
                  <option value="" disabled>Select timeline</option>
                  <option>As soon as possible</option>
                  <option>Within 2 weeks</option>
                  <option>Within 30 days</option>
                  <option>Researching for later</option>
                </select>
              </div>
              <div className="field span-2"><label htmlFor="booking-challenge">What should the VA own, and what is your biggest challenge? *</label><textarea id="booking-challenge" name="message" required minLength={15} rows={4} placeholder="Share the main tasks, tools, schedule, and the result you want." /></div>
            </div>

            <button className="btn btn-primary btn-lg booking-submit" type="submit" disabled={!selectedSlot || !days.length}>
              Confirm client discovery call
            </button>
            <p className="small muted booking-consent">By booking, you agree that our hiring team may contact you about this request. No payment is required.</p>
          </div>
        </form>
      ) : null}
    </div>
  );
}
