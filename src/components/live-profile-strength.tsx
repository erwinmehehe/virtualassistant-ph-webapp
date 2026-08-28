"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, EyeOff } from "lucide-react";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";

type Snapshot = {
  headline?: string | null; bio?: string | null; primary_category?: string | null; skills?: string[] | null;
  tools?: string[] | null; years_experience?: number | null; weekly_hours?: number | null; hourly_rate?: number | null; schedule?: string | null;
  resume_path?: string | null; portfolio_url?: string | null; linkedin_url?: string | null; directory_visible?: boolean | null;
};

const split = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map((x) => x.trim()).filter(Boolean);

export function LiveProfileStrength({ formId, initial }: { formId: string; initial: Snapshot }) {
  const [state, setState] = useState(() => ({ score: 0, done: 0, total: 11, years: Number(initial.years_experience || 0), next: "Complete your profile" }));
  const initialResume = useMemo(() => Boolean(initial.resume_path), [initial.resume_path]);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const calculate = () => {
      const fd = new FormData(form);
      const resume = fd.get("resume");
      const items = [
        [Boolean(String(fd.get("headline") || "").trim()), 10, "Add a professional headline"],
        [String(fd.get("bio") || "").trim().length >= 80, 15, "Write a stronger professional summary"],
        [Boolean(String(fd.get("primary_category") || "").trim()), 10, "Choose your VA category"],
        [split(fd.get("skills")).length >= 5, 15, "Add at least 5 skills"],
        [split(fd.get("tools")).length >= 3, 10, "Add at least 3 tools"],
        [String(fd.get("years_experience") || "").trim() !== "", 5, "Add your years of experience"],
        [Number(fd.get("weekly_hours") || 0) > 0, 10, "Set weekly availability"],
        [Number(fd.get("hourly_rate") || 0) >= 5, 10, "Set your preferred rate"],
        [initialResume || (resume instanceof File && resume.size > 0), 5, "Upload your resume"],
        [Boolean(String(fd.get("portfolio_url") || "").trim() || String(fd.get("linkedin_url") || "").trim()), 5, "Add a portfolio or LinkedIn"],
        [Boolean(String(fd.get("schedule") || "").trim()), 5, "Add your preferred schedule"]
      ] as const;
      const score = items.reduce((sum, [done, weight]) => sum + (done ? weight : 0), 0);
      const done = items.filter(([ok]) => ok).length;
      const next = items.find(([ok]) => !ok)?.[2] || "Profile ready";
      setState({ score, done, total: items.length, years: Number(fd.get("years_experience") || 0), next });
    };
    calculate();
    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    return () => { form.removeEventListener("input", calculate); form.removeEventListener("change", calculate); };
  }, [formId, initialResume]);

  const eligible = state.years >= PUBLIC_VA_MIN_EXPERIENCE;
  return <div className="card profile-strength-card live-strength-card" aria-live="polite">
    <div className="row-between"><div><span className="small muted">Live profile strength</span><strong className="profile-strength-score">{state.score}%</strong></div><span className="badge">{state.done}/{state.total}</span></div>
    <div className="progress profile-strength-progress"><span style={{width:`${state.score}%`}}/></div>
    <div className={`profile-eligibility ${eligible ? "eligible" : ""}`}>{eligible ? <CheckCircle2 size={15}/> : <EyeOff size={15}/>}<span>{eligible ? "Experience requirement met for public discovery." : "Public discovery needs 2+ years of experience."}</span></div>
    <p className="small muted live-strength-next">{state.score === 100 ? "Everything needed for a complete profile is filled in." : `Next: ${state.next}.`}</p>
  </div>;
}
