import type { VaProfile } from "./types";

/** `key` is stable: training lessons attach to it, labels are free to change. */
export type CompletionKey =
  | "photo" | "headline" | "bio" | "category" | "skills" | "tools"
  | "experience" | "availability" | "rate" | "resume" | "portfolio";

export type CompletionItem = { key: CompletionKey; label: string; done: boolean; weight: number; href: string };

export function getVaCompletion(profile: Partial<VaProfile> | null, avatarUrl?: string | null) {
  const p = profile ?? {};
  const items: CompletionItem[] = [
    { key: "photo", label: "Add a professional profile photo", done: Boolean(avatarUrl), weight: 10, href: "/workspace/va/profile#basics" },
    { key: "headline", label: "Add a professional headline", done: Boolean(p.headline && p.headline.length >= 8), weight: 10, href: "/workspace/va/profile#basics" },
    { key: "bio", label: "Write your professional summary", done: Boolean(p.bio && p.bio.length >= 80), weight: 15, href: "/workspace/va/profile#basics" },
    { key: "category", label: "Choose your VA category", done: Boolean(p.primary_category), weight: 5, href: "/workspace/va/profile#expertise" },
    { key: "skills", label: "Add at least 5 skills", done: Boolean(p.skills && p.skills.length >= 5), weight: 15, href: "/workspace/va/profile#expertise" },
    { key: "tools", label: "Add at least 3 tools", done: Boolean(p.tools && p.tools.length >= 3), weight: 5, href: "/workspace/va/profile#expertise" },
    { key: "experience", label: "Add your years of experience", done: Number(p.years_experience || 0) >= 1, weight: 10, href: "/workspace/va/profile#expertise" },
    { key: "availability", label: "Set weekly availability", done: Number(p.weekly_hours || 0) >= 1, weight: 10, href: "/workspace/va/profile#availability" },
    { key: "rate", label: "Set your preferred rate", done: Boolean(p.hourly_rate && p.hourly_rate >= 5), weight: 10, href: "/workspace/va/profile#availability" },
    { key: "resume", label: "Upload your resume", done: Boolean(p.resume_path), weight: 5, href: "/workspace/va/profile#trust" },
    { key: "portfolio", label: "Add a portfolio sample or portfolio link", done: Boolean(p.portfolio_url), weight: 5, href: "/workspace/va/profile#trust" }
  ];
  const score = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  return { score, items, next: items.find((item) => !item.done) ?? null };
}
