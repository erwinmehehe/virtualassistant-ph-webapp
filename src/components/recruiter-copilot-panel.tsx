"use client";

import { useMemo, useState, useTransition } from "react";
import { Bot, Check, Copy, Sparkles } from "lucide-react";
import { generateRecruiterCopilotAction } from "@/app/actions/recruiter-operations-system";
import type { CopilotTask } from "@/lib/ai-recruiter";

type CandidateOption = { id: string; name: string; status?: string | null };

const actions: Array<{ task: CopilotTask; label: string; needsCandidate?: boolean; max?: number }> = [
  { task: "role_summary", label: "Summarize role" },
  { task: "compare_candidates", label: "Compare selected", needsCandidate: true, max: 3 },
  { task: "candidate_summary", label: "Summarize VA", needsCandidate: true, max: 1 },
  { task: "client_recommendation", label: "Draft client recommendation", needsCandidate: true, max: 1 },
  { task: "interview_questions", label: "Draft interview questions" },
  { task: "risk_check", label: "Check placement risks" },
  { task: "feedback_summary", label: "Summarize client feedback" },
  { task: "replacement_suggestions", label: "Suggest replacements" }
];

export function RecruiterCopilotPanel({jobId,candidates}:{jobId:string;candidates:CandidateOption[]}) {
  const [selected,setSelected]=useState<string[]>([]);
  const [result,setResult]=useState("");
  const [error,setError]=useState("");
  const [lastTask,setLastTask]=useState<CopilotTask|null>(null);
  const [copied,setCopied]=useState(false);
  const [pending,startTransition]=useTransition();
  const selectedNames=useMemo(()=>candidates.filter((candidate)=>selected.includes(candidate.id)).map((candidate)=>candidate.name),[candidates,selected]);

  function toggle(id:string){setSelected((current)=>current.includes(id)?current.filter((value)=>value!==id):current.length>=3?current:[...current,id]);}
  function run(task:CopilotTask,needsCandidate?:boolean,max?:number){
    if(needsCandidate&&!selected.length){setError("Select a VA first.");return;}
    const ids=max===1?selected.slice(0,1):selected.slice(0,max||3);
    setError("");setCopied(false);setLastTask(task);
    startTransition(async()=>{
      const response=await generateRecruiterCopilotAction({jobId,task,vaIds:ids});
      if(!response.ok){setResult("");setError(response.error);return;}
      setResult(response.text);
    });
  }
  async function copy(){if(!result)return;await navigator.clipboard.writeText(result);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}

  return <section className="card" style={{marginBottom:18}}>
    <div className="row-between wrap"><div><div className="row"><Bot size={18}/><h2 style={{margin:0}}>AI Recruiter Copilot</h2></div><p className="small muted">Uses role, screening, notes, resume evidence where readable, client feedback, and capacity signals. It drafts and summarizes only. A recruiter must approve every candidate decision.</p></div><span className="badge"><Sparkles size={13}/> Human review required</span></div>
    {candidates.length?<div style={{marginTop:14}}><div className="small muted">Optional candidate selection · choose up to 3</div><div className="suggestion-chips" style={{marginTop:8}}>{candidates.slice(0,12).map((candidate)=><button type="button" key={candidate.id} className={`category-chip compact ${selected.includes(candidate.id)?"selected":""}`} onClick={()=>toggle(candidate.id)}>{selected.includes(candidate.id)?<Check size={12}/>:null}{candidate.name}{candidate.status?` · ${candidate.status}`:""}</button>)}</div>{selectedNames.length?<p className="small muted" style={{marginTop:8}}>Selected: {selectedNames.join(", ")}</p>:null}</div>:<p className="small muted" style={{marginTop:12}}>No shortlisted or proposed VAs yet. Role-level Copilot actions still work.</p>}
    <div className="row wrap" style={{marginTop:14}}>{actions.map((action)=><button className="btn btn-sm" type="button" key={action.task} disabled={pending} onClick={()=>run(action.task,action.needsCandidate,action.max)}>{action.label}</button>)}</div>
    {pending?<div className="workspace-skeleton-card" aria-busy="true" style={{marginTop:14}}/>:null}
    {error?<div className="alert" role="alert" style={{marginTop:14}}>{error}</div>:null}
    {result?<div className="review-answer" style={{marginTop:14}}><div className="row-between wrap"><strong>{String(lastTask||"copilot").replaceAll("_"," ")}</strong><button className="btn btn-sm" type="button" onClick={copy}><Copy size={13}/>{copied?"Copied":"Copy"}</button></div><p style={{whiteSpace:"pre-wrap",marginBottom:0}}>{result}</p></div>:null}
  </section>;
}
