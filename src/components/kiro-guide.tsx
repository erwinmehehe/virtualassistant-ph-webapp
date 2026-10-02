import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { KiroMascot } from "./kiro-mascot";
import styles from "./kiro-guide.module.css";

export type KiroState =
  | "welcome"
  | "thinking"
  | "success"
  | "reminder"
  | "attention"
  | "training";

type KiroGuideProps = {
  state?: KiroState;
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  action?: {
    href: string;
    label: string;
  };
  compact?: boolean;
  className?: string;
};

const stateLabel: Record<KiroState, string> = {
  welcome: "Welcome",
  thinking: "Working on it",
  success: "Good news",
  reminder: "Next step",
  attention: "Needs attention",
  training: "Training coach",
};

export function KiroGuide({
  state = "welcome",
  eyebrow = "Kiro · VAPH guide",
  title,
  description,
  action,
  compact = false,
  className = "",
}: KiroGuideProps) {
  return (
    <section
      className={[
        styles.guide,
        compact ? styles.compact : "",
        className,
      ].filter(Boolean).join(" ")}
      data-kiro-state={state}
    >
      <div className={styles.visual}>
        <KiroMascot state={state} className={styles.mascot} />
      </div>

      <div className={styles.copy}>
        <div className={styles.meta}>
          <span className={styles.eyebrow}><Sparkles size={13} />{eyebrow}</span>
          <span className={styles.state}>{stateLabel[state]}</span>
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {action ? (
        <Link className={styles.action} href={action.href}>
          {action.label}
          <ArrowRight size={15} />
        </Link>
      ) : null}
    </section>
  );
}
