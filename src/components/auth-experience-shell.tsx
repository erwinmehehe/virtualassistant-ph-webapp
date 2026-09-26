import type { ReactNode } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";

type Variant = "login" | "client" | "va";

const content: Record<Variant, {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  flow: string[];
}> = {
  login: {
    eyebrow: "Welcome back",
    title: "One account. The right workspace.",
    description: "Sign in once and continue directly to your Client, Virtual Assistant, recruiter, or training workspace.",
    points: [
      "Private workspaces for hiring and VA profiles",
      "Google or secure email sign-in",
      "Your existing role and progress stay attached to your account",
    ],
    flow: ["Sign in", "Open workspace", "Continue where you left off"],
  },
  client: {
    eyebrow: "For businesses",
    title: "Turn a hiring request into a clear shortlist.",
    description: "Create a private Client workspace for role briefs, recruiter-curated candidates, interviews, and hiring decisions.",
    points: [
      "Keep role requirements and shortlists in one place",
      "Review candidates privately with your hiring team",
      "Move from shortlist to interview without scattered email threads",
    ],
    flow: ["Create account", "Confirm your brief", "Review matches", "Interview & hire"],
  },
  va: {
    eyebrow: "For Virtual Assistants",
    title: "Build one profile recruiters can actually use.",
    description: "Create your VA workspace, complete your profile and vetting, then use the same account for training and matching roles.",
    points: [
      "Guided profile setup instead of one giant form",
      "One place for vetting, training, and role activity",
      "Your profile remains private until publication requirements are met",
    ],
    flow: ["Create account", "Complete profile", "Vetting", "Role matching"],
  },
};

export function AuthExperienceShell({ variant, children }: { variant: Variant; children: ReactNode }) {
  const item = content[variant];

  return (
    <div className={`auth-experience auth-experience-${variant}`}>
      <aside className="auth-story-panel" aria-label="Account overview">
        <div className="auth-story-brand">VirtualAssistant<span>.com.ph</span></div>
        <div className="auth-story-content">
          <span className="auth-story-kicker">{item.eyebrow}</span>
          <h2>{item.title}</h2>
          <p>{item.description}</p>

          <div className="auth-story-points">
            {item.points.map((point) => (
              <div key={point}><CheckCircle2 size={17}/><span>{point}</span></div>
            ))}
          </div>

          <div className="auth-story-flow" aria-label="Account flow">
            {item.flow.map((step, index) => (
              <div key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-story-security"><LockKeyhole size={15}/><span>Secure account access. Your workspace data stays private.</span></div>
      </aside>
      <div className="auth-form-wrap">{children}</div>
    </div>
  );
}
