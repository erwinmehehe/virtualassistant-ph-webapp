"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, UserRoundSearch } from "lucide-react";
import { submitDiscoveryBookingAction } from "@/app/actions/leads";
import type { DiscoverySlotDay } from "@/lib/discovery-booking";

type Audience = "client" | "va" | null;

function timeZoneLabel(timeZone: string) {
  if (timeZone === "Australia/Sydney") return "Sydney time";
  if (timeZone === "Asia/Manila") return "Philippine time";
  return timeZone.replaceAll("_", " ");
}

function localDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function ClientBookingForm({ days, error }: { days: DiscoverySlotDay[]; error?: string }) {
  const [audience, setAudience] = useState<Audience>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  // Browser-only APIs must not decide the server render. Waiting until the
  // component mounts avoids briefly claiming that every visitor is in Manila.
  const [browserTimeZone, setBrowserTimeZone] = useState<string | null>(null);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setBrowserTimeZone(detected || "Asia/Manila");
  }, []);

  const displayTimeZone = browserTimeZone || "Asia/Manila";

  const localDays = useMemo(() => {
    const grouped = new Map<string, DiscoverySlotDay>();
    for (const day of days) {
      for (const slot of day.slots) {
        const instant = new Date(slot.iso);
        const dateKey = localDateKey(instant, displayTimeZone);
        const timeLabel = new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: displayTimeZone,
        }).format(instant);
        const existing = grouped.get(dateKey);
        if (existing) {
          existing.slots.push({ ...slot, timeLabel });
          continue;
        }
        grouped.set(dateKey, {
          dateKey,
          label: new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: displayTimeZone,
          }).format(instant),
          slots: [{ ...slot, timeLabel }],
        });
      }
    }
    return Array.from(grouped.values()).sort((a, b) =>
      (a.slots[0]?.iso || "").localeCompare(b.slots[0]?.iso || ""),
    );
  }, [days, displayTimeZone]);

  useEffect(() => {
    if (!localDays.length) {
      setSelectedDay("");
      setSelectedSlot("");
      return;
    }
    if (!localDays.some((day) => day.dateKey === selectedDay)) {
      setSelectedDay(localDays[0].dateKey);
      setSelectedSlot("");
    }
  }, [localDays, selectedDay]);

  const activeDay = localDays.find((day) => day.dateKey === selectedDay) || localDays[0];

  return (
    <div className="booking-flow-card">
      <div className="booking-step-head">
        <span>Step 1 of 2</span>
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
          <input type="hidden" name="timezone" value={displayTimeZone} />
          <input type="hidden" name="phone" value="" />
          <input type="hidden" name="company_url" value="" />
          <input type="hidden" name="service" value="Virtual Assistant hiring" />
          <input type="hidden" name="hours" value="To discuss on the call" />
          <input type="hidden" name="budget" value="To discuss on the call" />
          <input type="hidden" name="start_time" value="To discuss on the call" />
          <input type="hidden" name="message" value="Client booked a discovery call. Role details will be confirmed during the conversation." />
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="booking-section">
            <div className="booking-section-title">
              <span>Step 2 of 2</span>
              <h3>Choose a time</h3>
              <p aria-live="polite"><Clock3 size={14} /> 30 minutes. 24/7 availability. {browserTimeZone ? `Times shown in ${timeZoneLabel(displayTimeZone)} (${displayTimeZone}).` : "Loading times in your local timezone…"}</p>
            </div>

            {error ? <div className="alert error" role="alert">{error}</div> : null}

            {localDays.length ? (
              <>
                <div className="booking-date-tabs" role="tablist" aria-label="Available conversation dates">
                  {localDays.map((day) => (
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
                      {slot.timeLabel}
                    </button>
                  ))}
                </div>
                <p className="booking-time-note">Scheduling is available around the clock in 30-minute slots. Times are shown in your local timezone, and your confirmation also includes Asia/Manila for our recruiting team.</p>

                <div className="booking-question-grid">
                  <div className="field"><label htmlFor="booking-name">Your name *</label><input id="booking-name" name="name" required minLength={2} autoComplete="name" /></div>
                  <div className="field"><label htmlFor="booking-email">Work email *</label><input id="booking-email" name="email" required type="email" autoComplete="email" /></div>
                  <div className="field"><label htmlFor="booking-company">Company *</label><input id="booking-company" name="company" required minLength={2} autoComplete="organization" /></div>
                </div>

                <button className="btn btn-primary btn-lg booking-submit" type="submit" disabled={!selectedSlot}>
                  Confirm this time
                </button>
                <p className="small muted booking-consent">We only need your contact details here. We will confirm the role, schedule, and priorities together on the call.</p>
              </>
            ) : (
              <div className="booking-no-slots">No online times are currently available. Please use the hiring request form and our team will contact you.</div>
            )}
          </div>
        </form>
      ) : null}
    </div>
  );
}
