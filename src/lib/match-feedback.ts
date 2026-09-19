/**
 * Fixed vocabulary for the "Not quite right?" chips on the hiring-form success
 * screen. Shared by the public form, the server action that stores the taps,
 * and the recruiter CRM that reads them back, so a label only changes in one
 * place and nothing free-text reaches the database from an unauthenticated
 * screen.
 */

export const MATCH_FEEDBACK_OPTIONS = [
  { value: "more_experience", label: "More experience" },
  { value: "different_tools", label: "Different tools" },
  { value: "lower_rate", label: "Lower rate" },
  { value: "different_industry", label: "Different industry" },
  { value: "more_availability", label: "More availability" }
] as const;

export type MatchFeedbackValue = (typeof MATCH_FEEDBACK_OPTIONS)[number]["value"];

const LABELS = new Map<string, string>(MATCH_FEEDBACK_OPTIONS.map((option) => [option.value, option.label]));

export function isMatchFeedbackValue(value: string): value is MatchFeedbackValue {
  return LABELS.has(value);
}

/** Recruiter-facing wording for a stored value; unknown values pass through. */
export function matchFeedbackLabel(value: string) {
  return LABELS.get(value) || value;
}
