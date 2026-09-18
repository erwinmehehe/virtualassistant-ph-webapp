"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ExternalLink, GripVertical } from "lucide-react";
import { moveLeadStageAction } from "@/app/actions/recruiter-stage";

export type PipelineStage = "new" | "contacted" | "discovery_booked" | "qualified" | "terms_sent" | "nurture" | "won";

export type PipelineLead = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  service: string | null;
  crm_stage: PipelineStage;
  score: number;
  temperature: "hot" | "warm" | "cold";
  reasons: string[];
  daysSinceTouch: number;
  daysOverdue: number;
  estimatedValue: number;
};

const STAGES: { value: PipelineStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "discovery_booked", label: "Discovery" },
  { value: "qualified", label: "Qualified" },
  { value: "terms_sent", label: "Terms sent" },
  { value: "nurture", label: "Nurture" },
  { value: "won", label: "Won" }
];

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function RecruiterLeadKanban({ initialLeads }: { initialLeads: PipelineLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const map = new Map<PipelineStage, PipelineLead[]>(STAGES.map((stage) => [stage.value, []]));
    for (const lead of leads) map.get(lead.crm_stage)?.push(lead);
    for (const [, rows] of map) rows.sort((a, b) => b.score - a.score || b.daysOverdue - a.daysOverdue || a.name.localeCompare(b.name));
    return map;
  }, [leads]);

  function moveLead(id: string, nextStage: PipelineStage) {
    const current = leads.find((lead) => lead.id === id);
    if (!current || current.crm_stage === nextStage || isPending) return;
    const previous = current.crm_stage;
    setError(null);
    setLeads((rows) => rows.map((lead) => lead.id === id ? { ...lead, crm_stage: nextStage } : lead));
    startTransition(async () => {
      const result = await moveLeadStageAction(id, nextStage);
      if (!result?.ok) {
        setLeads((rows) => rows.map((lead) => lead.id === id ? { ...lead, crm_stage: previous } : lead));
        setError(result?.error || "Could not move the lead.");
      }
    });
  }

  return <div>
    {error ? <div className="alert pipeline-card-error" role="alert">{error}</div> : null}
    <div className="pipeline-board" aria-label="Sales pipeline board" aria-busy={isPending}>
      {STAGES.map((stage) => {
        const rows = grouped.get(stage.value) || [];
        return <section
          className={`pipeline-column${overStage === stage.value ? " is-over" : ""}`}
          key={stage.value}
          onDragOver={(event) => { event.preventDefault(); setOverStage(stage.value); }}
          onDragLeave={() => setOverStage((current) => current === stage.value ? null : current)}
          onDrop={(event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData("text/lead-id") || draggedId;
            setOverStage(null);
            setDraggedId(null);
            if (id) moveLead(id, stage.value);
          }}
        >
          <div className="pipeline-column-head"><strong>{stage.label}</strong><span>{rows.length}</span></div>
          <div className="pipeline-column-body">
            {rows.length ? rows.map((lead) => <article
              className={`pipeline-card${draggedId === lead.id ? " is-dragging" : ""}`}
              draggable
              key={lead.id}
              onDragStart={(event) => {
                setDraggedId(lead.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/lead-id", lead.id);
              }}
              onDragEnd={() => { setDraggedId(null); setOverStage(null); }}
            >
              <div className="pipeline-card-head">
                <span className={`lead-temperature ${lead.temperature}`}>{lead.temperature === "hot" ? "Hot" : lead.temperature === "warm" ? "Warm" : "Cold"}</span>
                <span className="pipeline-score" title="Lead score">{lead.score}</span>
              </div>
              <div>
                <h3>{lead.name}</h3>
                <div className="pipeline-card-company">{lead.company || "Individual client"}{lead.service ? ` · ${lead.service}` : ""}</div>
              </div>
              <div className="pipeline-card-meta">
                <span>{lead.daysSinceTouch === 0 ? "Touched today" : `${lead.daysSinceTouch}d since touch`}</span>
                {lead.daysOverdue ? <span className="overdue">{lead.daysOverdue}d overdue</span> : null}
                {lead.estimatedValue ? <span>{usd(lead.estimatedValue)}</span> : null}
              </div>
              {lead.reasons.length ? <div className="pipeline-card-meta">{lead.reasons.map((reason) => <span className="badge" key={reason}>{reason}</span>)}</div> : null}
              <div className="pipeline-card-actions">
                <span className="btn btn-sm" aria-hidden="true" title="Drag on desktop"><GripVertical size={14}/></span>
                <select
                  aria-label={`Move ${lead.name} to another stage`}
                  disabled={isPending}
                  value={lead.crm_stage}
                  onChange={(event) => moveLead(lead.id, event.target.value as PipelineStage)}
                >
                  {STAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <Link className="btn btn-sm" href={`/workspace/recruiter/leads?view=all&q=${encodeURIComponent(lead.id)}`}><ExternalLink size={13}/> Open</Link>
              </div>
            </article>) : <div className="pipeline-empty">No leads in this stage.</div>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
