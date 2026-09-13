"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Info } from "lucide-react";

export function VaCostCalculator({ compact = false }: { compact?: boolean }) {
  const [hours, setHours] = useState(20);
  const [rate, setRate] = useState(8);

  const monthly = useMemo(() => hours * rate * 4.33, [hours, rate]);
  const params = useMemo(() => {
    const query = new URLSearchParams({
      hours: hours >= 40 ? "40+ hours/week" : `${hours} to ${Math.min(hours + 10, 40)} hours/week`,
      budget: `USD ${rate} to ${Math.max(rate + 4, rate)}/hour`,
      source: "/",
    });
    return `/hire?${query.toString()}`;
  }, [hours, rate]);

  return (
    <div className={`cro-cost-card${compact ? " compact" : ""}`}>
      <div className="cro-cost-head">
        <span><Calculator size={18} /></span>
        <div><strong>Estimate VA compensation</strong><small>Use this to set a realistic starting budget.</small></div>
      </div>
      <div className="cro-cost-controls">
        <label>Hours / week<strong>{hours}</strong><input type="range" min="10" max="40" step="5" value={hours} onChange={(event) => setHours(Number(event.target.value))} /></label>
        <label>Hourly rate<strong>${rate}/hr</strong><input type="range" min="5" max="30" step="1" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label>
      </div>
      <div className="cro-cost-result">
        <span>Estimated VA compensation</span>
        <strong>${Math.round(monthly).toLocaleString()}<small>/month</small></strong>
        <p><Info size={14} /> Approx. 4.33 weeks/month. Agency or managed-service fees are separate and shown before commitment.</p>
      </div>
      <Link className="pva-btn pva-btn-primary" href={params}>Get candidates in this budget <ArrowRight size={16} /></Link>
    </div>
  );
}
