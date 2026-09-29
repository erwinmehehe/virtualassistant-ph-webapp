"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { usePathname } from "next/navigation";

export function VaTrainingAnnouncement() {
  const pathname = usePathname();
  if (pathname === "/workspace/va/onboarding") return null;

  return (
    <div className="va-training-announcement" role="status">
      <span className="va-training-announcement-icon"><GraduationCap size={20} aria-hidden="true" /></span>
      <div>
        <strong>Free VA training is now available</strong>
        <p>Access the full training library at no cost, build practical skills, complete assessments, and earn certificates.</p>
      </div>
      <Link className="btn btn-primary btn-sm" href="/workspace/training">Start free training</Link>
    </div>
  );
}
