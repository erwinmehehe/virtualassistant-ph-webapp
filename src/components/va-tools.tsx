"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, Clipboard, Search } from "lucide-react";

const WEEKS_PER_MONTH = 52 / 12;

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export function VaCostCalculator({ placementFee = 0, managedMarkup = 0 }: { placementFee?: number; managedMarkup?: number } = {}) {
  const [hours, setHours] = useState(20);
  const [vaRate, setVaRate] = useState(8);
  const [localRate, setLocalRate] = useState(30);
  const [overhead, setOverhead] = useState(20);
  const result = useMemo(() => {
    const va = hours * vaRate * WEEKS_PER_MONTH;
    const localBase = hours * localRate * WEEKS_PER_MONTH;
    const local = localBase * (1 + overhead / 100);
    const managedFee = managedMarkup > 0 ? va * (managedMarkup / 100) : 0;
    const managedTotal = va + managedFee;
    return { va, local, savings: Math.max(0, local - va), percent: local > 0 ? Math.max(0, (1 - va / local) * 100) : 0, managedFee, managedTotal };
  }, [hours, vaRate, localRate, overhead, managedMarkup]);

  return <div className="tool-shell">
    <div className="tool-inputs">
      <div className="field"><label htmlFor="cost-hours">Hours needed per week</label><input id="cost-hours" type="number" min="1" max="80" value={hours} onChange={(e)=>setHours(Math.max(1, Number(e.target.value)||1))}/></div>
      <div className="field"><label htmlFor="cost-va-rate">VA hourly rate, USD</label><input id="cost-va-rate" type="number" min="5" step="0.01" value={vaRate} onChange={(e)=>setVaRate(Math.max(5, Number(e.target.value)||5))}/><span className="small muted">VirtualAssistant.com.ph does not accept ongoing hourly roles below $5.00/hour.</span></div>
      <div className="field"><label htmlFor="cost-local-rate">Comparable local hourly cost, USD</label><input id="cost-local-rate" type="number" min="1" step="0.01" value={localRate} onChange={(e)=>setLocalRate(Math.max(1, Number(e.target.value)||1))}/></div>
      <div className="field"><label htmlFor="cost-overhead">Local benefits and overhead, %</label><input id="cost-overhead" type="number" min="0" max="200" value={overhead} onChange={(e)=>setOverhead(Math.max(0, Number(e.target.value)||0))}/></div>
    </div>
    <div className="tool-results" aria-live="polite">
      <div><span>VA monthly compensation</span><strong>{usd(result.va)}</strong></div>
      {managedMarkup > 0 ? <><div><span>Managed-service margin ({managedMarkup}%)</span><strong>+ {usd(result.managedFee)}</strong></div><div className="tool-result-highlight"><span>Estimated managed monthly total</span><strong>{usd(result.managedTotal)}</strong><small>VA compensation plus the configured managed-service margin.</small></div></> : null}
      {placementFee > 0 ? <div><span>Curated placement fee, one time</span><strong>{usd(placementFee)}</strong></div> : null}
      <div><span>Comparable local estimate</span><strong>{usd(result.local)}</strong></div>
      <div className={managedMarkup > 0 ? "" : "tool-result-highlight"}><span>Compensation-only monthly difference</span><strong>{usd(result.savings)}</strong><small>{result.percent.toFixed(0)}% lower before VirtualAssistant.com.ph service fees in this illustrative model</small></div>
      <Link className="btn btn-primary btn-lg" href="/hire?source=%2Ftools%2Fvirtual-assistant-cost-calculator%2F" data-track="tool_cta_match">Get a managed VA <ArrowRight size={16}/></Link>
      <p className="small muted">Estimate only. Configured service fees are shown when available. Actual compensation, taxes, benefits, equipment, and legal obligations depend on the role and hiring model.</p>
    </div>
  </div>;
}

export function HourlyMonthlyCalculator() {
  const [rate, setRate] = useState(8);
  const [hours, setHours] = useState(40);
  const weekly = rate * hours;
  const monthly = weekly * WEEKS_PER_MONTH;
  const annual = weekly * 52;
  return <div className="tool-shell">
    <div className="tool-inputs">
      <div className="field"><label htmlFor="hm-rate">Hourly rate, USD</label><input id="hm-rate" type="number" min="5" step="0.01" value={rate} onChange={(e)=>setRate(Math.max(5,Number(e.target.value)||5))}/></div>
      <div className="field"><label htmlFor="hm-hours">Hours per week</label><input id="hm-hours" type="number" min="1" max="80" value={hours} onChange={(e)=>setHours(Math.max(1,Number(e.target.value)||1))}/></div>
    </div>
    <div className="tool-results"><div><span>Weekly</span><strong>{usd(weekly)}</strong></div><div><span>Monthly average</span><strong>{usd(monthly)}</strong></div><div><span>Annual</span><strong>{usd(annual)}</strong></div><Link className="btn btn-primary" href="/hire?source=%2Ftools%2Fvirtual-assistant-hourly-to-monthly-calculator%2F" data-track="tool_cta_match">Get a managed VA <ArrowRight size={15}/></Link><Link className="btn" href="/pricing" data-track="tool_complete">See how VA pricing works</Link></div>
  </div>;
}

const roleOptions = [
  ["Admin, inbox, calendar, research", "/service/admin-inbox/", "Admin & Inbox Virtual Assistant"],
  ["SEO, content optimization, Search Console", "/service/seo/", "SEO Virtual Assistant"],
  ["Medical scheduling, patient admin, records", "/service/medical-virtual-assistant/", "Medical Virtual Assistant"],
  ["Law firm intake, matter admin, calendars", "/service/law-firm-virtual-assistant/", "Law Firm Virtual Assistant"],
  ["Shopify, listings, orders, ecommerce support", "/service/ecommerce/", "Ecommerce Virtual Assistant"],
  ["Real estate CRM, listings, lead follow-up", "/service/real-estate/", "Real Estate Virtual Assistant"],
  ["Bookkeeping, invoicing, reconciliations", "/service/bookkeeping/", "Bookkeeping Virtual Assistant"],
  ["Sales research, prospecting, appointments", "/service/lead-generation/", "Lead Generation Virtual Assistant"],
  ["Customer email, chat, tickets, support", "/service/customer-service/", "Customer Service Virtual Assistant"],
  ["Executive calendar, priorities, follow-up", "/service/executive-virtual-assistant/", "Executive Virtual Assistant"]
] as const;

export function RoleFinder() {
  const [choice, setChoice] = useState("");
  const selected = roleOptions.find(([label]) => label === choice);
  return <div className="tool-shell tool-shell-single">
    <div className="tool-inputs"><div className="field"><label htmlFor="role-choice">Which workload best matches what is falling behind?</label><select id="role-choice" value={choice} onChange={(e)=>setChoice(e.target.value)}><option value="">Choose the closest workload</option>{roleOptions.map(([label])=><option key={label}>{label}</option>)}</select></div></div>
    <div className="tool-results" aria-live="polite">{selected ? <><div className="tool-role-result"><CheckCircle2 size={22}/><div><span>Best starting point</span><strong>{selected[2]}</strong></div></div><Link className="btn btn-primary btn-lg" href={selected[1]} data-track="tool_complete">See the role guide <ArrowRight size={16}/></Link><Link className="btn" href="/hire?source=%2Ftools%2Fwhat-type-of-va-do-i-need%2F" data-track="tool_cta_match">Get a managed VA</Link></> : <><Search size={28}/><h3>Choose the workload, not the title.</h3><p className="muted">The tool will point you to the closest service page. You can still combine responsibilities when you create the final role brief.</p></>}</div>
  </div>;
}

export function JobDescriptionGenerator() {
  const [role, setRole] = useState("SEO Virtual Assistant");
  const [hours, setHours] = useState("20");
  const [tasks, setTasks] = useState("keyword research, on-page SEO updates, internal linking, Search Console monitoring");
  const [tools, setTools] = useState("Ahrefs, Semrush, Google Search Console, WordPress");
  const [copied, setCopied] = useState(false);
  const output = `Job title: ${role}\n\nAbout the role\nWe are hiring a ${role} to own recurring execution work and keep the workflow documented, current, and moving without repeated reminders.\n\nCore responsibilities\n${tasks.split(",").map((x)=>`- ${x.trim()}`).join("\n")}\n\nTools\n${tools.split(",").map((x)=>`- ${x.trim()}`).join("\n")}\n\nWorking arrangement\n- Approximately ${hours} hours per week\n- Hourly budget: USD 5.00/hour minimum on VirtualAssistant.com.ph; set a higher budget when the role requires more experience, judgment, or specialized skills\n- Time-zone overlap and response expectations to be agreed before hiring\n\nWhat good looks like\n- Recurring work is completed on time\n- Quality checks are followed\n- Exceptions and blockers are raised early\n- Work is documented in the agreed system\n- Communication is clear and reliable`;
  async function copy() { try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(()=>setCopied(false),1800); } catch {} }
  return <div className="tool-generator-grid"><div className="tool-inputs"><div className="field"><label htmlFor="jd-role">Role title</label><input id="jd-role" value={role} onChange={(e)=>setRole(e.target.value)}/></div><div className="field"><label htmlFor="jd-hours">Hours per week</label><input id="jd-hours" type="number" min="1" max="80" value={hours} onChange={(e)=>setHours(e.target.value)}/></div><div className="field"><label htmlFor="jd-tasks">Core tasks, comma separated</label><textarea id="jd-tasks" value={tasks} onChange={(e)=>setTasks(e.target.value)}/></div><div className="field"><label htmlFor="jd-tools">Tools, comma separated</label><textarea id="jd-tools" value={tools} onChange={(e)=>setTools(e.target.value)}/></div></div><div className="tool-output"><div className="row-between"><strong>Generated job description</strong><button className="btn btn-sm" type="button" onClick={copy} data-track="tool_complete"><Clipboard size={14}/>{copied?"Copied":"Copy"}</button></div><pre>{output}</pre><Link className="btn btn-primary" href="/hire?source=%2Ftools%2Fvirtual-assistant-job-description-generator%2F" data-track="tool_cta_match">Get a managed VA <ArrowRight size={15}/></Link></div></div>;
}
