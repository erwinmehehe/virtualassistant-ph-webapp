import "server-only";
import { VA_CATEGORIES } from "@/lib/constants";
import { SPECIALTIES } from "@/lib/specialties";

export type ParsedResumeFields = {
  headline: string | null;
  bio: string | null;
  primary_category: (typeof VA_CATEGORIES)[number] | null;
  categories: string[];
  skills: string[];
  tools: string[];
  industries: string[];
  languages: string[];
  years_experience: number | null;
};

const EMPTY_RESULT: ParsedResumeFields = {
  headline: null,
  bio: null,
  primary_category: null,
  categories: [],
  skills: [],
  tools: [],
  industries: [],
  languages: [],
  years_experience: null
};

/** Extracts raw text from an uploaded resume file (PDF or DOCX). */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  // Legacy .doc (application/msword) has no reliable pure-JS text extractor;
  // callers should skip auto-fill for that format and fall back to manual entry.
  throw new Error("Auto-fill only supports PDF and DOCX resumes. DOC files can still be uploaded, just fill the form manually.");
}

const LANGUAGES = ["English", "Filipino", "Tagalog", "Bisaya", "Cebuano", "Ilocano", "Spanish", "Mandarin", "Chinese", "Japanese", "Korean", "French", "German"];
const INDUSTRIES = ["SaaS", "E-commerce", "Ecommerce", "Healthcare", "Dental", "Real Estate", "Finance", "Legal", "Hospitality", "Education", "Retail", "Insurance", "Logistics", "Nonprofit", "Marketing agency", "Technology"];

function countMatches(haystack: string, needle: string): number {
  const escaped = needle.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = haystack.match(new RegExp(`\\b${escaped}\\b`, "gi"));
  return matches ? matches.length : 0;
}

function extractYearsExperience(text: string): number | null {
  const matches = [...text.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:professional\s+)?experience/gi)];
  if (!matches.length) return null;
  const values = matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n) && n >= 0 && n <= 60);
  if (!values.length) return null;
  return Math.max(...values);
}

// A short, ALL-CAPS-ish line (or a common resume section header) marks the
// start of the next section -- used to know where the summary block ends.
function looksLikeSectionHeading(line: string): boolean {
  if (line.length > 40) return false;
  if (/^(skills?|tools?|experience|education|work history|employment|certifications?|projects?|references?|contact|languages?)\b/i.test(line)) return true;
  const letters = line.replace(/[^a-zA-Z]/g, "");
  return letters.length > 2 && letters === letters.toUpperCase();
}

function extractBio(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const headingIdx = lines.findIndex((l) => /^(summary|profile|objective|about)\b/i.test(l));
  if (headingIdx === -1) return null;
  const collected: string[] = [];
  for (let i = headingIdx + 1; i < lines.length && collected.length < 4; i++) {
    if (looksLikeSectionHeading(lines[i])) break;
    collected.push(lines[i]);
  }
  const candidate = collected.join(" ").trim();
  if (candidate.length < 40) return null;
  return candidate.slice(0, 600);
}

/**
 * Free, keyword-based extraction -- no external API. Matches the resume
 * text against the skills/tools vocabulary already used across the site's
 * specialty pages, plus simple regex/heading heuristics for experience and
 * summary. Deliberately conservative: fields that can't be matched with
 * reasonable confidence are left null/empty for the VA to fill in manually,
 * rather than guessing.
 */
export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeFields> {
  const text = resumeText.trim();
  if (!text) return EMPTY_RESULT;

  const categoryScores = SPECIALTIES.map((specialty) => {
    const vocabulary = [...specialty.skills, ...specialty.tools];
    const score = vocabulary.reduce((sum, term) => sum + countMatches(text, term), 0);
    return { category: specialty.category, score };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);

  const primary_category = (categoryScores[0]?.category as (typeof VA_CATEGORIES)[number]) || null;
  const categories = categoryScores.slice(0, 3).map((entry) => entry.category as (typeof VA_CATEGORIES)[number]);

  const matchedSkills = new Set<string>();
  const matchedTools = new Set<string>();
  for (const specialty of SPECIALTIES) {
    for (const skill of specialty.skills) if (countMatches(text, skill) > 0) matchedSkills.add(skill);
    for (const tool of specialty.tools) if (countMatches(text, tool) > 0) matchedTools.add(tool);
  }

  const languages = LANGUAGES.filter((lang) => countMatches(text, lang) > 0);
  const industries = INDUSTRIES.filter((industry) => countMatches(text, industry) > 0).slice(0, 6);

  return {
    headline: null, // Too unreliable to guess from raw text without AI -- left for manual entry.
    bio: extractBio(text),
    primary_category,
    categories,
    skills: Array.from(matchedSkills).slice(0, 15),
    tools: Array.from(matchedTools).slice(0, 15),
    industries,
    languages: languages.length ? languages : [],
    years_experience: extractYearsExperience(text)
  };
}
