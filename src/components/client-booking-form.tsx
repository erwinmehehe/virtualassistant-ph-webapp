"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, CalendarDays, CheckCircle2, Clock3, Globe2 } from "lucide-react";
import { submitDiscoveryBookingAction } from "@/app/actions/leads";
import type { DiscoverySlotDay } from "@/lib/discovery-booking";
import { TurnstileWidget } from "@/components/turnstile-widget";

function timeZoneLabel(timeZone: string) {
  const labels: Record<string, string> = {
    "Australia/Sydney": "Sydney",
    "Asia/Manila": "Philippines",
    "America/Chicago": "Central Time (US)",
    "America/Denver": "Mountain Time (US)",
    "America/New_York": "Eastern Time (US)",
    "America/Los_Angeles": "Pacific Time (US)",
    "Europe/London": "London",
    "Asia/Singapore": "Singapore",
  };
  return labels[timeZone] || timeZone.replaceAll("_", " ");
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
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [browserTimeZone, setBrowserTimeZone] = useState<string | null>(null);
  const [displayTimeZone, setDisplayTimeZone] = useState<string | null>(null);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila";
    setBrowserTimeZone(detected);
    setDisplayTimeZone(detected);
  }, []);

  const timeZoneOptions = useMemo(() => {
    const supported = (Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }).supportedValuesOf?.("timeZone") || [];
    const priority = [
      browserTimeZone,
      "Australia/Sydney",
      "Asia/Manila",
      "America/Chicago",
      "America/Denver",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Asia/Singapore",
    ].filter((value): value is string => Boolean(value));
    return [...new Set([...priority, ...supported])];
  }, [browserTimeZone]);

  const formatTimeZone = displayTimeZone || browserTimeZone || "Asia/Manila";

  const localDays = useMemo(() => {
    if (!displayTimeZone) return [];
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
  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return "";
    const instant = new Date(selectedSlot);
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: formatTimeZone,
    }).format(instant);
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: formatTimeZone,
    }).format(instant);
    return `${date} · ${time}`;
  }, [selectedSlot, formatTimeZone]);

  return (
    <div className="booking-flow-card">
      <div className="booking-card-head">
        <div>
          <h2>Choose a time</h2>
          <p>All available times are shown below. Your timezone is detected automatically.</p>
        </div>
        <Link className="booking-va-link" href="/auth/join/va">Looking for VA work? Apply here</Link>
      </div>

      <form id="client-discovery-booking" className="booking-client-form" action={submitDiscoveryBookingAction}>
        <input type="hidden" name="audience" value="client" />
        <input type="hidden" name="scheduled_at" value={selectedSlot} />
        <input type="hidden" name="timezone" value={displayTimeZone || ""} />
        <input type="hidden" name="phone" value="" />
        <input type="hidden" name="company_url" value="" />
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <TurnstileWidget />

        {error ? <div className="booking-error" role="alert">{error}</div> : null}

        <section className="booking-section">
          <div className="booking-section-title">
            <span>Date & time</span>
            <div className="booking-timezone-control">
              <Globe2 size={14} />
              <label htmlFor="booking-timezone">Timezone</label>
              <select
                id="booking-timezone"
                value={displayTimeZone || ""}
                onChange={(event) => {
                  setDisplayTimeZone(event.target.value);
                  setSelectedDay("");
                  setSelectedSlot("");
                }}
                aria-label="Timezone used for booking times"
              >
                {!displayTimeZone ? <option value="">Detecting timezone…</option> : null}
                {timeZoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            </div>
          </div>
          <p className="booking-timezone-note" aria-live="polite">
            <Clock3 size={14} />
            {browserTimeZone
              ? `Detected: ${timeZoneLabel(browserTimeZone)}. Times shown in ${timeZoneLabel(formatTimeZone)}.`
              : "Detecting your device timezone…"}
          </p>

          {localDays.length ? (
            <div className="booking-calendar-shell">
              <div className="booking-date-tabs" role="tablist" aria-label="Available dates">
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

              {selectedSlot ? (
                <div className="booking-selected-slot" role="status">
                  <CheckCircle2 size={18} />
                  <div><small>Selected</small><strong>{selectedSlotLabel}</strong></div>
                </div>
              ) : (
                <p className="booking-slot-hint">Select a time above.</p>
              )}
            </div>
          ) : (
            <div className="booking-no-slots">
              No online times are available right now. <Link href="/hire">Send a hiring request instead</Link>.
            </div>
          )}
        </section>

        {localDays.length ? (
          <section className="booking-section booking-details-section">
            <div className="booking-section-title">
              <span>Your details</span>
              <p>Four required fields. That’s it.</p>
            </div>

            <div className="booking-question-grid">
              <div className="field">
                <label htmlFor="booking-name">Your name</label>
                <input id="booking-name" name="name" required minLength={2} autoComplete="name" placeholder="Your name" />
              </div>
              <div className="field">
                <label htmlFor="booking-email">Work email</label>
                <input id="booking-email" name="email" required type="email" autoComplete="email" placeholder="you@company.com" />
              </div>
              <div className="field">
                <label htmlFor="booking-company">Company</label>
                <input id="booking-company" name="company" required minLength={2} autoComplete="organization" placeholder="Company name" />
              </div>
              <div className="field">
                <label htmlFor="booking-role">VA role you need</label>
                <input id="booking-role" name="service" required minLength={3} maxLength={100} placeholder="e.g. Executive Assistant" />
              </div>
              <div className="field span-2">
                <label htmlFor="booking-message">Anything we should know? <span>Optional</span></label>
                <textarea id="booking-message" name="message" maxLength={1200} placeholder="Tools, schedule, must-have experience, or anything useful before the call." />
              </div>
            </div>

            <button className="btn btn-primary btn-lg booking-submit" type="submit" disabled={!selectedSlot}>
              <CalendarCheck2 size={18} />
              {selectedSlot ? "Book discovery call" : "Choose a time first"}
            </button>
            <p className="booking-consent">No payment required. We use these details only to prepare for your hiring conversation.</p>
          </section>
        ) : null}
      </form>
    </div>
  );
}
