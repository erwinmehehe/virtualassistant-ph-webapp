"use client";

import { useState } from "react";
import type { DiscoverySlotDay } from "@/lib/discovery-booking";
import { cancelDiscoveryBookingAction, rescheduleDiscoveryBookingAction } from "@/app/actions/booking";

export function ManageBookingForm({ token, days }: { token: string; days: DiscoverySlotDay[] }) {
  const [slot, setSlot] = useState("");
  return <div className="booking-client-form">
    <section className="booking-section">
      <div className="booking-section-title"><h2>Choose a new time</h2><p>All available times are shown in Philippine time.</p></div>
      <form action={rescheduleDiscoveryBookingAction}>
        <input type="hidden" name="token" value={token}/><input type="hidden" name="scheduled_at" value={slot}/>
        <div className="booking-time-grid" role="radiogroup" aria-label="Available discovery call times">
          {days.flatMap((day) => day.slots.map((item) => <button key={item.iso} type="button" role="radio" aria-checked={slot === item.iso} className={slot === item.iso ? "is-selected" : ""} onClick={() => setSlot(item.iso)}>{day.label}, {item.timeLabel}</button>))}
        </div>
        <button className="btn btn-primary" type="submit" disabled={!slot}>Reschedule call</button>
      </form>
    </section>
    <section className="booking-section">
      <div className="booking-section-title"><h2>Cancel this call</h2><p>This releases the time for another client.</p></div>
      <form action={cancelDiscoveryBookingAction}><input type="hidden" name="token" value={token}/><button className="btn" type="submit">Cancel booking</button></form>
    </section>
  </div>;
}
