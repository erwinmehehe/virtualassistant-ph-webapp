import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { ProgressRing } from "@/components/db-charts";

export type OnboardingStep = { label: string; description?: string; done: boolean; href: string };

export function OnboardingChecklist({ title = "Onboarding checklist", steps, compact = false }: { title?: string; steps: OnboardingStep[]; compact?: boolean }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / Math.max(steps.length, 1)) * 100);
  const nextIndex = steps.findIndex((step) => !step.done);
  if (compact) return <section className="onboarding-card onboarding-card-compact">
    <div className="onboarding-compact-head"><div><h2>{title}</h2><p>{done} of {steps.length} complete</p></div><span>{pct}%</span></div>
    <div className="onboarding-compact-list">{steps.map((step,index) => <div className={`onboarding-compact-row ${step.done ? "done" : ""} ${index === nextIndex ? "next" : ""}`} key={step.label}><div className="onboarding-step-icon">{step.done ? <Check size={14}/> : <Circle size={13}/>}</div><div><strong>{step.label}</strong>{step.description && index === nextIndex ? <span>{step.description}</span> : null}</div>{!step.done ? <Link className="onboarding-step-action" href={step.href}>{index === nextIndex ? "Continue" : "Open"}</Link> : <span className="onboarding-done">Done</span>}</div>)}</div>
  </section>;

  return <section className="card onboarding-card">
    <div className="onboarding-head"><div className="onboarding-title-group"><span className="onboarding-ring"><ProgressRing pct={pct} size={52} stroke={5}/><strong>{pct}%</strong></span><div><span className="small muted">Getting set up</span><h2>{title}</h2></div></div><div className="onboarding-progress-copy"><span>{done} of {steps.length} complete</span></div></div>
    <div className="onboarding-steps">{steps.map((step,index) => <div className={`onboarding-step ${step.done ? "done" : ""} ${index === nextIndex ? "next" : ""}`} key={step.label}><div className="onboarding-step-icon">{step.done ? <Check size={14}/> : <Circle size={13}/>}</div><div><strong>{step.label}</strong>{step.description ? <span>{step.description}</span> : null}</div>{!step.done ? <Link className="onboarding-step-action" href={step.href}>{index === nextIndex ? "Do this next" : "Open"}</Link> : <span className="onboarding-done">Done</span>}</div>)}</div>
  </section>;
}
