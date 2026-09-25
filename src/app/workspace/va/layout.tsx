export const metadata = { robots: { index: false, follow: false } };
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import "./va-workspace.css";
import { requireRoleFast } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function VaLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireRoleFast("va");
  return (
    <AppShell userId={userId} role="va" name={profile.full_name} avatarUrl={profile.avatar_url} title="VA workspace">
      <div className="va-training-announcement" role="status">
        <span className="va-training-announcement-icon"><GraduationCap size={20} aria-hidden="true" /></span>
        <div>
          <strong>Free VA training is now available</strong>
          <p>Access the full training library at no cost, build practical skills, complete assessments, and earn certificates.</p>
        </div>
        <Link className="btn btn-primary btn-sm" href="/workspace/training">Start free training</Link>
      </div>
      {children}
    </AppShell>
  );
}
