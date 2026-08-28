import Link from "next/link";
import { Check, Circle } from "lucide-react";

export type OnboardingStep = { label: string; description?: string; done: boolean; href: string };

export function OnboardingChecklist({ title = "Onboarding checklist", steps }: { title?: string; steps: OnboardingStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / Math.max(steps.length, 1)) * 100);
  const nextIndex = steps.findIndex((step) => !step.done);
  return <section className="card onboarding-card">
    <div className="onboarding-head"><div><span className="small muted">Getting set up</span><h2>{title}</h2></div><div className="onboarding-progress-copy"><strong>{pct}%</strong><span>{done} of {steps.length} complete</span></div></div>
    <div className="progress onboarding-progress"><span style={{width:`${pct}%`}}/></div>
    <div className="onboarding-steps">{steps.map((step,index) => <div className={`onboarding-step ${step.done ? "done" : ""} ${index === nextIndex ? "next" : ""}`} key={step.label}><div className="onboarding-step-icon">{step.done ? <Check size={14}/> : <Circle size={13}/>}</div><div><strong>{step.label}</strong>{step.description ? <span>{step.description}</span> : null}</div>{!step.done ? <Link className="onboarding-step-action" href={step.href}>{index === nextIndex ? "Do this next" : "Open"}</Link> : <span className="onboarding-done">Done</span>}</div>)}</div>
  </section>;
}
