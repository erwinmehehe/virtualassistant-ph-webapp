"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, DollarSign, Sparkles } from "lucide-react";
import { VA_CATEGORIES } from "@/lib/constants";
import { TalentShortlistButton, type ShortlistTalent } from "@/components/talent-shortlist";

export type MatchTalent = ShortlistTalent & {
  category?: string | null;
  categories?: string[] | null;
  weeklyHours?: number | null;
  hourlyRate?: number | null;
  yearsExperience?: number | null;
  schedule?: string | null;
};

function budgetMax(value: string) {
  const matches = value.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  return matches.length > 1 ? matches[1] : matches[0] || 999;
}

export function FindMyVaWizard({ talent }: { talent: MatchTalent[] }) {
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState("20");
  const [budget, setBudget] = useState("8-12");
  const [timezone, setTimezone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const recommendations = useMemo(() => {
    if (!submitted) return [];
    const desiredHours = Number(hours || 0);
    const maxBudget = budgetMax(budget);
    const tz = timezone.trim().toLowerCase();

    return [...talent]
      .map((va) => {
        const categories = [va.category, ...(va.categories || [])].filter(Boolean);
        let score = 0;
        if (category && categories.includes(category)) score += 50;
        if (!category) score += 10;
        if (!desiredHours || Number(va.weeklyHours || 0) >= desiredHours) score += 20;
        if (!va.hourlyRate || Number(va.hourlyRate) <= maxBudget) score += 15;
        if (tz && String(va.schedule || "").toLowerCase().includes(tz)) score += 10;
        score += Math.min(Number(va.yearsExperience || 0), 10);
        return { va, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.va);
  }, [budget, category, hours, submitted, talent, timezone]);

  const hireHref = useMemo(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("hours", hours);
    params.set("budget", `USD ${budget}/hour`);
    if (timezone) params.set("timezone", timezone);
    return `/hire?${params.toString()}`;
  }, [budget, category, hours, timezone]);

  return (
    <section className="cro-match-card" aria-labelledby="find-my-va-title">
      <div className="cro-match-copy">
        <span className="pva-kicker"><Sparkles size={14} /> Find My VA</span>
        <h2 id="find-my-va-title">See who could fit your role before you book a call.</h2>
        <p>Answer four quick questions. We’ll surface approved profiles from the live talent pool, then our recruiter can validate the fit.</p>
        <div className="cro-match-proof">
          <span><BriefcaseBusiness size={15} /> Real approved profiles</span>
          <span><Clock3 size={15} /> Availability-aware</span>
          <span><DollarSign size={15} /> Budget-aware</span>
        </div>
      </div>

      <div className="cro-match-form">
        <label>
          Role
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Any specialty</option>
            {VA_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Hours / week
          <select value={hours} onChange={(event) => setHours(event.target.value)}>
            <option value="10">10+ hours</option>
            <option value="20">20+ hours</option>
            <option value="30">30+ hours</option>
            <option value="40">40 hours</option>
          </select>
        </label>
        <label>
          Preferred VA rate
          <select value={budget} onChange={(event) => setBudget(event.target.value)}>
            <option value="6-8">$6–$8/hr</option>
            <option value="8-12">$8–$12/hr</option>
            <option value="12-18">$12–$18/hr</option>
            <option value="18-25">$18–$25/hr</option>
            <option value="25-40">$25+/hr</option>
          </select>
        </label>
        <label>
          Timezone / overlap
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="US Eastern, Sydney, UK..." />
        </label>
        <button className="pva-btn pva-btn-primary cro-match-submit" type="button" onClick={() => setSubmitted(true)}>
          Show my matches <ArrowRight size={16} />
        </button>
      </div>

      {submitted ? (
        <div className="cro-match-results" aria-live="polite">
          <div className="cro-match-results-head">
            <div>
              <strong>{recommendations.length ? "Best matches from the current approved pool" : "No close match in the current pool"}</strong>
              <span>{recommendations.length ? "Shortlist anyone you want to interview. A recruiter will confirm the final fit and availability." : "Send the role anyway. We can recruit beyond the public profiles."}</span>
            </div>
            <Link href={hireHref}>Send role to recruiter <ArrowRight size={14} /></Link>
          </div>
          {recommendations.length ? (
            <div className="cro-match-result-grid">
              {recommendations.map((va) => (
                <article key={va.slug}>
                  <span className="cro-availability">Available</span>
                  <h3>{va.name}</h3>
                  <p>{va.headline || va.category || "Virtual Assistant"}</p>
                  <div className="cro-match-facts">
                    <span>{va.yearsExperience || 2}+ yrs experience</span>
                    <span>{va.weeklyHours ? `${va.weeklyHours} hrs/week` : "Flexible hours"}</span>
                    {va.hourlyRate ? <span>${Number(va.hourlyRate).toFixed(0)}/hr preferred</span> : null}
                  </div>
                  <div className="cro-match-card-actions">
                    <Link href={`/va/${va.slug}`}>View profile</Link>
                    <TalentShortlistButton talent={{ slug: va.slug, name: va.name, headline: va.headline }} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Link className="pva-btn pva-btn-primary" href={hireHref}>Let us recruit for this role <ArrowRight size={16} /></Link>
          )}
        </div>
      ) : null}
    </section>
  );
}
