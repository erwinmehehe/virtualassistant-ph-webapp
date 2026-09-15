"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { scheduleCandidateInterviewAction } from "@/app/actions/recruiter-operations-system";

function localInputValue(iso?:string|null){if(!iso)return"";const d=new Date(iso);const pad=(n:number)=>String(n).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}

export function CandidateInterviewScheduler({interviewId,currentIso}:{interviewId:string;currentIso?:string|null}){
  const [value,setValue]=useState(localInputValue(currentIso));
  const timezone=useMemo(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"Client local time",[]);
  const min=useMemo(()=>localInputValue(new Date(Date.now()+24*60*60*1000).toISOString()),[]);
  const iso=value?new Date(value).toISOString():"";
  return <form action={scheduleCandidateInterviewAction} className="row wrap">
    <input type="hidden" name="interview_id" value={interviewId}/><input type="hidden" name="scheduled_at_iso" value={iso}/><input type="hidden" name="timezone" value={timezone}/><input type="hidden" name="duration_minutes" value="30"/>
    <label className="field" style={{minWidth:230}}><span>{currentIso?"Choose a new time":"Choose interview time"}</span><input type="datetime-local" required min={min} value={value} onChange={(e)=>setValue(e.target.value)}/><small className="muted">Shown in {timezone}. Minimum 24 hours ahead.</small></label>
    <button className="btn btn-primary" type="submit" disabled={!value}><CalendarClock size={15}/>{currentIso?"Reschedule":"Schedule interview"}</button>
  </form>;
}
