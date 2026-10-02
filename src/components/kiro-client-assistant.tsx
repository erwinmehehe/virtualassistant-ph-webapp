"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { KiroMascot, type KiroState } from "@/components/kiro-mascot";

export function KiroClientAssistant({
  state = "welcome",
  currentTitle,
  currentCopy,
  currentHref,
  currentLabel,
  recruiterName,
  className = "",
  fullWidth = false,
}: {
  state?: KiroState;
  currentTitle: string;
  currentCopy: string;
  currentHref: string;
  currentLabel: string;
  recruiterName: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    if(!open)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape")setOpen(false);
    };
    document.addEventListener("keydown",onKey);
    return()=>document.removeEventListener("keydown",onKey);
  },[open]);

  return <>
    <button
      className={"btn kiro-assistant-trigger "+(fullWidth?"kiro-assistant-trigger-wide ":"")+className}
      type="button"
      onClick={()=>setOpen(true)}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <Sparkles size={15}/> Ask Kiro
    </button>

    {open?<div className="kiro-assistant-overlay" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <aside className="kiro-assistant-drawer" role="dialog" aria-modal="true" aria-labelledby="kiro-assistant-title">
        <header className="kiro-assistant-head">
          <div className="kiro-assistant-identity">
            <span className="kiro-assistant-avatar"><KiroMascot state={state}/></span>
            <div><strong id="kiro-assistant-title">Kiro</strong><span>Your VAPH hiring guide</span></div>
          </div>
          <button className="kiro-assistant-close" type="button" onClick={()=>setOpen(false)} aria-label="Close Kiro assistant"><X size={18}/></button>
        </header>

        <div className="kiro-assistant-body">
          <div className="kiro-assistant-message">
            <span><Sparkles size={14}/> Your hiring status</span>
            <h3>{currentTitle}</h3>
            <p>{currentCopy}</p>
          </div>

          <div className="kiro-assistant-quick">
            <strong>What should I do next?</strong>
            <p>The dashboard is already showing the next client action from your real hiring pipeline.</p>
            <Link className="btn btn-primary" href={currentHref} onClick={()=>setOpen(false)}>{currentLabel}<ArrowRight size={15}/></Link>
          </div>

          <div className="kiro-assistant-quick">
            <strong>Who is handling my hire?</strong>
            <p>{recruiterName} is your human recruiting contact. Kiro explains the workflow, while your recruiter owns sourcing, vetting, matching, and hiring decisions.</p>
            <Link className="btn" href="/workspace/client/messages" onClick={()=>setOpen(false)}><MessageCircle size={15}/> Message your recruiter</Link>
          </div>
        </div>

        <footer className="kiro-assistant-foot">
          Kiro currently explains live VAPH status and next actions. Recruiter conversations stay human and private.
        </footer>
      </aside>
    </div>:null}
  </>;
}
