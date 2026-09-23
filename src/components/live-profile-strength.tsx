"use client";

import Link from "next/link";
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
  const [state, setState] = useState(() => ({ score: 0, done: 0, total: 11, years: Number(initial.years_experience || 0), next: "Complete your profile", nextHref: "/workspace/va/profile" }));
  const initialResume = useMemo(() => Boolean(initial.resume_path), [initial.resume_path]);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const calculate = () => {
      const fd = new FormData(form);
      const resume = fd.get("resume");
      const items = [
        [Boolean(String(fd.get("headline") || "").trim()), 10, "Add a professional headline", "#basics"],
        [String(fd.get("bio") || "").trim().length >= 80, 15, "Write a stronger professional summary", "#basics"],
        [Boolean(String(fd.get("primary_category") || "").trim()), 10, "Choose your VA category", "#expertise"],
        [split(fd.get("skills")).length >= 5, 15, "Add at least 5 skills", "#expertise"],
        [split(fd.get("tools")).length >= 3, 10, "Add at least 3 tools", "#expertise"],
        [String(fd.get("years_experience") || "").trim() !== "", 5, "Add your years of experience", "#expertise"],
        [Number(fd.get("weekly_hours") || 0) > 0, 10, "Set weekly availability", "#availability"],
        [Number(fd.get("hourly_rate") || 0) >= 5, 10, "Set your preferred rate", "#availability"],
        [initialResume || (resume instanceof File && resume.size > 0), 5, "Upload your resume", "#resume"],
        [Boolean(String(fd.get("portfolio_url") || "").trim() || String(fd.get("linkedin_url") || "").trim()), 5, "Add a portfolio or LinkedIn", "#links"],
        [Boolean(String(fd.get("schedule") || "").trim()), 5, "Add your preferred schedule", "#availability"]
      ] as const;
      const score = items.reduce((sum, [done, weight]) => sum + (done ? weight : 0), 0);
      const done = items.filter(([ok]) => ok).length;
      const nextItem = items.find(([ok]) => !ok);
      const next = nextItem?.[2] || "Profile ready";
      const nextHref = nextItem?.[3] || "/workspace/va/profile";
      setState({ score, done, total: items.length, years: Number(fd.get("years_experience") || 0), next, nextHref });
    };
    calculate();
    const resumeInput = form.elements.namedItem("resume") as HTMLInputElement | null;
    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    // The resume picker is form-associated but rendered outside the form so
    // the parser can submit independently. Its events do not bubble through
    // the profile form DOM tree, so listen to it directly as well.
    resumeInput?.addEventListener("change", calculate);
    return () => {
      form.removeEventListener("input", calculate);
      form.removeEventListener("change", calculate);
      resumeInput?.removeEventListener("change", calculate);
    };
  }, [formId, initialResume]);

  const eligible = state.years >= PUBLIC_VA_MIN_EXPERIENCE;
  return <div className="card profile-strength-card live-strength-card" aria-live="polite">
    <div className="row-between"><div><span className="small muted">Profile completeness</span><strong className="profile-strength-score">{state.score}%</strong></div><span className="badge">{state.done}/{state.total}</span></div>
    <div className="progress profile-strength-progress"><span style={{width:`${state.score}%`}}/></div>
    <div className={`profile-eligibility ${eligible ? "eligible" : ""}`}>{eligible ? <CheckCircle2 size={15}/> : <EyeOff size={15}/>}<span>{eligible ? "2+ years of experience recorded." : "Public profile requires 2+ years of experience."}</span></div>
    {state.score === 100 ? <p className="small muted live-strength-next">Profile complete.</p> : <p className="small muted live-strength-next">Next: <Link className="text-link" href={state.nextHref}>{state.next}</Link>.</p>}
  </div>;
}
