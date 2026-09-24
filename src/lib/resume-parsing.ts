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

const MAX_EXTRACTED_TEXT = 250_000;
const MAX_PDF_PAGES = 60;
const MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024;
const MAX_DOCX_COMPRESSION_RATIO = 120;
const MAX_DOCX_ENTRIES = 1_000;

function validateDocxArchive(buffer: Buffer) {
  const minEocd = Math.max(0, buffer.length - 65_557);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= minEocd; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("Invalid DOCX archive.");

  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocd + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocd + 16);
  if (entryCount > MAX_DOCX_ENTRIES) throw new Error("DOCX contains too many archive entries.");
  if (centralDirectoryOffset + centralDirectorySize > buffer.length) throw new Error("Invalid DOCX directory.");

  let offset = centralDirectoryOffset;
  let compressedTotal = 0;
  let uncompressedTotal = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid DOCX directory entry.");
    }
    const compressed = buffer.readUInt32LE(offset + 20);
    const uncompressed = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    compressedTotal += compressed;
    uncompressedTotal += uncompressed;
    if (uncompressedTotal > MAX_DOCX_UNCOMPRESSED_BYTES) {
      throw new Error("DOCX expands beyond the safe processing limit.");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }

  if (uncompressedTotal > 0 && compressedTotal <= 0) {
    throw new Error("DOCX compression metadata is invalid.");
  }
  if (compressedTotal > 0 && uncompressedTotal / compressedTotal > MAX_DOCX_COMPRESSION_RATIO) {
    throw new Error("DOCX compression ratio exceeds the safe processing limit.");
  }
}

export function validateResumeBuffer(buffer: Buffer, mimeType: string) {
  if (!buffer.length) throw new Error("Resume file is empty.");
  if (mimeType === "application/pdf") {
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new Error("File contents do not match a PDF.");
    }
    return;
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) {
      throw new Error("File contents do not match a DOCX.");
    }
    validateDocxArchive(buffer);
    return;
  }
  throw new Error("Unsupported resume type.");
}

/** Extracts bounded raw text from an uploaded resume file (PDF or DOCX). */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  validateResumeBuffer(buffer, mimeType);
  if (mimeType === "application/pdf") {
    const { CanvasFactory } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer, CanvasFactory });
    try {
      const result = await parser.getText();
      const pages = Number((result as { total?: number }).total || 0);
      if (pages > MAX_PDF_PAGES) throw new Error("PDF has too many pages for resume auto-fill.");
      if (result.text.length > MAX_EXTRACTED_TEXT) throw new Error("Resume text exceeds the safe processing limit.");
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    if (result.value.length > MAX_EXTRACTED_TEXT) throw new Error("Resume text exceeds the safe processing limit.");
    return result.value;
  }
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
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headingIdx = lines.findIndex((line) => /^(summary|profile|objective|about|professional summary)\b/i.test(line));

  if (headingIdx !== -1) {
    const collected: string[] = [];
    for (let i = headingIdx + 1; i < lines.length && collected.length < 4; i++) {
      if (looksLikeSectionHeading(lines[i])) break;
      collected.push(lines[i]);
    }
    const candidate = collected.join(" ").trim();
    if (candidate.length >= 40) return candidate.slice(0, 600);
  }

  // Many resumes start with a short professional paragraph but omit a
  // "Summary" heading. Use only substantial prose near the top and skip
  // obvious contact details, links, headings, and date-heavy lines.
  const fallback = lines
    .slice(0, 18)
    .filter((line) =>
      line.length >= 55 &&
      !looksLikeSectionHeading(line) &&
      !/@|https?:\/\/|linkedin\.com|\+?\d[\d\s().-]{7,}/i.test(line) &&
      !/\b(19|20)\d{2}\b.*\b(19|20)\d{2}\b/.test(line)
    )
    .slice(0, 3)
    .join(" ")
    .trim();

  return fallback.length >= 60 ? fallback.slice(0, 600) : null;
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
    headline: primary_category ? `${primary_category} Virtual Assistant` : null,
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
