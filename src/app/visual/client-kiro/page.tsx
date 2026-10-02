import Link from "next/link";
import { notFound } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClientKiroHero } from "@/components/client-kiro-hero";

export const dynamic = "force-dynamic";

export default function ClientKiroVisualFixturePage() {
  if (process.env.CLIENT_KIRO_VISUAL_FIXTURE !== "1") notFound();

  return (
    <AppShell role="client" name="Erwin" title="Client workspace">
      <div className="dash-page role-overview client-overview client-mobile-dashboard">
        <ClientKiroHero
          greeting="Good afternoon"
          firstName="Erwin"
          title="3 recruiter-selected VAs ready"
          copy="Review the shortlist and tell your recruiter who should move forward."
          href="#shortlist"
          label="Review shortlist"
        />

        <section className="client-concierge-strip client-mobile-concierge">
          <div>
            <span className="small">Your recruiter</span>
            <h2>Bryan Santos</h2>
            <p>One accountable hiring owner handles the role from brief to placement and post-hire follow-up.</p>
          </div>
          <Link className="btn" href="#message">
            <LifeBuoy size={16} /> Message your recruiter
          </Link>
        </section>

        <section className="workflow-progress card client-mobile-workflow" aria-label="Hiring progress">
          <div className="workflow-steps">
            {["Tell us what you need", "We recruit & vet", "Review shortlist", "Interview", "Confirm & start"].map((label, index) => (
              <div className={`workflow-step ${index < 2 ? "done" : index === 2 ? "current" : ""}`} key={label}>
                <span>{index < 2 ? "✓" : index + 1}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
          <div className="workflow-current">
            <div>
              <span className="small">Current action</span>
              <h2>3 recruiter-selected VAs ready</h2>
              <p>Review the shortlist and tell your recruiter who should move forward.</p>
              <small className="muted">Waiting on you</small>
            </div>
            <Link className="btn btn-primary" href="#shortlist">Review shortlist</Link>
          </div>
        </section>

        <section className="card dashboard-section-card client-mobile-attention" id="shortlist">
          <div className="dashboard-section-head">
            <div>
              <h2>Needs your attention</h2>
              <p>Only client decisions appear here.</p>
            </div>
            <span className="badge badge-warning">1 action</span>
          </div>
          <div className="attention-grid">
            <div className="attention-card">
              <div className="attention-count">3</div>
              <div>
                <strong>Recruiter shortlist waiting</strong>
                <p>Review the vetted VAs selected for you.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
