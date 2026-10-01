"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { scheduleCandidateInterviewAction } from "@/app/actions/recruiter-operations-system";

function inputValueInTimeZone(iso?: string | null, timeZone?: string | null) {
  if (!iso || !timeZone) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  } catch {
    return "";
  }
}

export function CandidateInterviewScheduler({
  interviewId,
  currentIso,
  returnTo,
  compact = false,
  timeZone: preferredTimeZone,
}: {
  interviewId: string;
  currentIso?: string | null;
  returnTo?: string;
  compact?: boolean;
  timeZone?: string | null;
}) {
  const [timeZone, setTimeZone] = useState(preferredTimeZone || "");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (preferredTimeZone) {
      setTimeZone(preferredTimeZone);
      return;
    }
    try {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    } catch {
      setTimeZone("");
    }
  }, [preferredTimeZone]);

  useEffect(() => {
    if (currentIso && timeZone) setValue(inputValueInTimeZone(currentIso, timeZone));
  }, [currentIso, timeZone]);

  const min = useMemo(
    () => timeZone ? inputValueInTimeZone(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), timeZone) : "",
    [timeZone],
  );

  return <form action={scheduleCandidateInterviewAction} className="row wrap">
    <input type="hidden" name="interview_id" value={interviewId}/>
    <input type="hidden" name="scheduled_local" value={value}/>
    <input type="hidden" name="timezone" value={timeZone}/>
    <input type="hidden" name="duration_minutes" value="30"/>
    {returnTo?<input type="hidden" name="return_to" value={returnTo}/>:null}
    <label className="field" style={{minWidth:compact?210:230}}>
      <span>{currentIso?"Choose a new time":"Choose interview time"}</span>
      <input type="datetime-local" required min={min || undefined} value={value} onChange={(e)=>setValue(e.target.value)} disabled={!timeZone}/>
      <small className="muted">{timeZone ? `Shown in ${timeZone}. Minimum 24 hours ahead.` : "Detecting your timezone…"}</small>
    </label>
    <button className="btn btn-primary" type="submit" disabled={!value || !timeZone}><CalendarClock size={15}/>{currentIso?"Reschedule":"Schedule interview"}</button>
  </form>;
}
