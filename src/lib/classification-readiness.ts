export type ClassificationEvidenceInput = {
  headline?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  tools?: string[] | null;
  industries?: string[] | null;
};

export const CLASSIFICATION_MIN_SIGNALS = 2;

export const CLASSIFICATION_SIGNAL_LABELS: Record<string, string> = {
  headline: "professional headline",
  bio: "professional summary",
  skills: "3+ skills",
  tools: "2+ tools",
  industries: "industry experience",
};

export function getClassificationEvidenceReadiness(input: ClassificationEvidenceInput) {
  const signals = {
    headline: Boolean(String(input.headline || "").trim().length >= 8),
    bio: Boolean(String(input.bio || "").trim().length >= 80),
    skills: Array.isArray(input.skills) && input.skills.filter(Boolean).length >= 3,
    tools: Array.isArray(input.tools) && input.tools.filter(Boolean).length >= 2,
    industries: Array.isArray(input.industries) && input.industries.filter(Boolean).length >= 1,
  };

  const roleSignalCount = [
    signals.headline,
    signals.bio,
    signals.skills,
    signals.tools,
  ].filter(Boolean).length;
  const totalSignalCount = roleSignalCount + (signals.industries ? 1 : 0);
  const ready = roleSignalCount >= 1 && totalSignalCount >= CLASSIFICATION_MIN_SIGNALS;
  const missing = Object.entries(signals)
    .filter(([, done]) => !done)
    .map(([key]) => key);

  return {
    ready,
    roleSignalCount,
    totalSignalCount,
    missing,
    signals,
  };
}
