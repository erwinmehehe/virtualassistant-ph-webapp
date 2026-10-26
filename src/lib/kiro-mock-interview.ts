/**
 * Fictional, coaching-only interview practice. This module is safe to load in the
 * browser: no provider calls, learner storage, official grading or hiring decisions.
 */
export const INTERVIEW_ROUNDS = 6;
export const INTERVIEW_FOCUS_OPTIONS = [
  "General VA", "Administrative Support", "Executive Assistance", "Customer Service",
  "SEO", "Marketing & Social Media", "Ecommerce", "Bookkeeping & Finance",
  "Dental & Healthcare", "Real Estate", "Lead Generation & Sales",
] as const;
export const INTERVIEW_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTIES)[number];
export type InterviewSpeaker = "recruiter" | "client" | "trainer";
export type InterviewTurn = { speaker: InterviewSpeaker; question: string; answer: string };
export type InterviewCourse = { slug: string; title: string; summary: string };

export const INTERVIEW_PANEL: Record<InterviewSpeaker, { label: string; role: string }> = {
  recruiter: { label: "Recruiter", role: "Communication and professionalism" },
  client: { label: "Client", role: "Realistic work situations" },
  trainer: { label: "Senior VA Trainer", role: "Process, quality and boundaries" },
};

export const INTERVIEW_RUBRIC = [
  { label: "Problem solving and judgment", weight: 25, check: "Did you explain the steps you would take and why?" },
  { label: "Client communication", weight: 20, check: "Did you clarify needs and explain the next update?" },
  { label: "Workflow and tools", weight: 20, check: "Did you describe a practical method, tools and a quality check?" },
  { label: "Confidentiality and boundaries", weight: 20, check: "Did you identify permissions, confidentiality or escalation?" },
  { label: "Professionalism and clarity", weight: 15, check: "Was your explanation structured, concise and respectful?" },
] as const;

export function speakerForRound(index: number): InterviewSpeaker {
  return (["recruiter", "client", "trainer", "recruiter", "client", "trainer"] as const)[index] || "trainer";
}

export function questionForRound(input: {
  courseTitle: string; courseSummary?: string; focus: string;
  difficulty: InterviewDifficulty; index: number; previousAnswer?: string;
}): string {
  const course = input.courseTitle.trim().slice(0, 90) || "virtual assistant training";
  const focus = INTERVIEW_FOCUS_OPTIONS.includes(input.focus as typeof INTERVIEW_FOCUS_OPTIONS[number])
    ? input.focus : "General VA";
  const summary = (input.courseSummary || "").replace(/\s+/g, " ").slice(0, 130);
  const questions = [
    "You are interviewing for a " + focus + " role. After studying " + course + ", how would you explain your approach to a new client assignment and confirm expectations?",
    "A fictional client asks you to apply a skill from " + course + " on a tight deadline. What do you clarify first, and how do you organize your work?",
    "Walk me through a practical task from " + course + ". What tools or steps would you use, and how would you check your work before delivery?",
    "A client sends contradictory instructions about a " + focus + " task. How would you respond without making promises you cannot keep?",
    "You spot an inconsistency in a fictional client's " + course + " project close to the deadline. What do you investigate, escalate and communicate?",
    "You have finished a fictional " + focus + " assignment. Explain your quality check, client handoff and one improvement you would make next time.",
  ];
  const difficultyHint: Record<InterviewDifficulty, string> = {
    beginner: "Explain your answer in clear, practical steps.",
    intermediate: "Include priorities, time zones and one approval checkpoint.",
    advanced: "Consider competing stakeholders, privacy constraints and an unexpected blocker.",
  };
  let prompt = questions[Math.max(0, Math.min(INTERVIEW_ROUNDS - 1, input.index))];
  if (input.index === 2 && summary) prompt += " Course focus: " + summary + ".";
  if (input.index > 0 && input.previousAnswer && !/approv|escalat|authoriz|permission/i.test(input.previousAnswer)) {
    prompt += " Also explain when you would seek approval.";
  }
  return prompt + " " + difficultyHint[input.difficulty];
}

/** Transparent wording cues, not an evaluation of competency or a hiring score. */
export function practiceFeedback(answer: string): string[] {
  const text = answer.trim();
  if (!text) return ["Write your own response before requesting feedback."];
  const notes: string[] = [];
  if (text.length < 100) notes.push("Add a concrete example or a more detailed first step.");
  if (!/ask|confirm|clarif|check|verify|review|understand|priorit/i.test(text))
    notes.push("Explain what you would clarify or verify before acting.");
  if (!/plan|track|document|list|schedule|organize|audit|investigat|test|draft|coordinate|process|step|tool/i.test(text))
    notes.push("Name a workflow, tool or practical action you would use.");
  if (!/approv|escalat|permission|client|manager|supervisor|update|handoff|report|notify/i.test(text))
    notes.push("Describe permissions, escalation and how you would update the client.");
  if (notes.length === 0) notes.push("Your response includes several useful process cues. Add a specific example and check the rubric against your actual answer.");
  return notes.slice(0, 3);
}

export function practiceReport(turns: InterviewTurn[]) {
  const answers = turns.map((turn) => turn.answer.trim()).filter(Boolean);
  return {
    answered: answers.length,
    total: INTERVIEW_ROUNDS,
    nextSteps: [
      "Review each question using the five rubric criteria below.",
      "Rewrite one answer with a concrete example and an approval or escalation step.",
      "Practice explaining the same workflow aloud in 60–90 seconds.",
    ],
    notice: "Practice reflection only. This is not an AI hiring score, official assessment, certificate result or measure of job readiness.",
  };
}

export type InterviewRequest = {
  courseSlug: string;
  focus: typeof INTERVIEW_FOCUS_OPTIONS[number];
  difficulty: InterviewDifficulty;
  turns: InterviewTurn[];
};

/** Validate the entire transcript on every request before an external call. */
export function parseInterviewRequest(value: unknown): InterviewRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.courseSlug !== "string" || !/^[a-z0-9-]{3,80}$/.test(row.courseSlug)) return null;
  if (!INTERVIEW_FOCUS_OPTIONS.includes(row.focus as typeof INTERVIEW_FOCUS_OPTIONS[number])) return null;
  if (!INTERVIEW_DIFFICULTIES.includes(row.difficulty as InterviewDifficulty)) return null;
  if (!Array.isArray(row.turns) || row.turns.length < 1 || row.turns.length > INTERVIEW_ROUNDS) return null;
  let total = 0;
  const turns: InterviewTurn[] = [];
  for (const [index, item] of row.turns.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const turn = item as Record<string, unknown>;
    if (turn.speaker !== speakerForRound(index) || typeof turn.question !== "string" || typeof turn.answer !== "string") return null;
    const question = turn.question.trim();
    const answer = turn.answer.trim();
    if (!question || question.length > 600 || !answer || answer.length > 1200) return null;
    total += question.length + answer.length;
    if (total > 9500) return null;
    turns.push({ speaker: speakerForRound(index), question, answer });
  }
  return {
    courseSlug: row.courseSlug,
    focus: row.focus as InterviewRequest["focus"],
    difficulty: row.difficulty as InterviewDifficulty,
    turns,
  };
}
