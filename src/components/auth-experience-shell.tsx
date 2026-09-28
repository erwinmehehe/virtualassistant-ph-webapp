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
    eyebrow: "Free VA profile",
    title: "Create your profile first. Build the details as you go.",
    description: "Start with a free account and a short setup. Add your experience, skills, tools, availability, resume, and work evidence when you are ready.",
    points: [
      "No fee to create a profile or apply for roles",
      "Short guided setup before the detailed profile",
      "Your profile stays private until you choose to make it public",
    ],
    flow: ["Create account", "Quick setup", "Build profile", "Apply for roles"],
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
