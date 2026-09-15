"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Info } from "lucide-react";

export function VaCostCalculator({ compact = false }: { compact?: boolean }) {
  const [hours, setHours] = useState(20);
  const [rate, setRate] = useState(8);
  const [localRate, setLocalRate] = useState(25);

  const monthly = useMemo(() => hours * rate * 4.33, [hours, rate]);
  const localMonthly = useMemo(() => hours * localRate * 4.33, [hours, localRate]);
  const monthlyDifference = Math.max(0, localMonthly - monthly);
  const annualDifference = monthlyDifference * 12;

  const params = useMemo(() => {
    const query = new URLSearchParams({
      hours: hours >= 40 ? "40+ hours/week" : `${hours} to ${Math.min(hours + 10, 40)} hours/week`,
      budget: `USD ${rate} to ${Math.max(rate + 4, rate)}/hour`,
    });
    return `/hire?${query.toString()}`;
  }, [hours, rate]);

  return (
    <div className={`cro-cost-card${compact ? " compact" : ""}`}>
      <div className="cro-cost-head">
        <span><Calculator size={18} /></span>
        <div>
          <strong>Compare your hiring costs</strong>
          <small>Adjust the hours and rates to see a simple side-by-side estimate.</small>
        </div>
      </div>

      <div className="cro-cost-controls">
        <label>
          Hours / week
          <strong>{hours}</strong>
          <input type="range" min="10" max="40" step="5" value={hours} onChange={(event) => setHours(Number(event.target.value))} />
        </label>
        <label>
          VA hourly rate
          <strong>${rate}/hr</strong>
          <input type="range" min="6" max="30" step="1" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </label>
        {!compact ? (
          <label>
            Local hourly rate
            <strong>${localRate}/hr</strong>
            <input type="range" min="10" max="80" step="1" value={localRate} onChange={(event) => setLocalRate(Number(event.target.value))} />
          </label>
        ) : null}
      </div>

      <div className="cro-cost-result">
        <div className="cro-cost-compare-results">
          <div>
            <span>Estimated VA compensation</span>
            <strong>${Math.round(monthly).toLocaleString()}<small>/month</small></strong>
          </div>
          {!compact ? (
            <>
              <div>
                <span>Comparable local base labour</span>
                <strong>${Math.round(localMonthly).toLocaleString()}<small>/month</small></strong>
              </div>
              <div>
                <span>Potential base labour difference</span>
                <strong>${Math.round(monthlyDifference).toLocaleString()}<small>/month</small></strong>
              </div>
            </>
          ) : null}
        </div>
        {!compact && annualDifference > 0 ? <p><Info size={14} /> That is about ${Math.round(annualDifference).toLocaleString()} per year in base labour difference at the rates selected.</p> : null}
        <p><Info size={14} /> Illustrative estimate using 4.33 weeks/month. It does not include local benefits, payroll costs, equipment, taxes, or our agency/managed-service fees. Actual costs vary by role and arrangement.</p>
      </div>

      <Link className="pva-btn pva-btn-primary" href={params}>Get my free VA match <ArrowRight size={16} /></Link>
    </div>
  );
}
