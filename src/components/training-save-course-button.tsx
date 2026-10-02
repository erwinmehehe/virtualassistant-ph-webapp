"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleTrainingSavedCourseAction } from "@/app/actions/training-saved-courses";

export function TrainingSaveCourseButton({
  courseId,
  initialSaved,
}: {
  courseId: string;
  initialSaved: boolean;
}) {
  const [saved,setSaved]=useState(initialSaved);
  const [pending,startTransition]=useTransition();

  return (
    <button
      className={`training-course-save ${saved ? "is-saved" : ""}`}
      type="button"
      aria-pressed={saved}
      disabled={pending}
      onClick={()=>{
        const next=!saved;
        setSaved(next);
        startTransition(async()=>{
          const result=await toggleTrainingSavedCourseAction({courseId,save:next});
          if(!result.ok)setSaved(!next);
        });
      }}
      title={saved ? "Remove from saved courses" : "Save course"}
    >
      <Bookmark size={14} fill={saved ? "currentColor" : "none"}/>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
