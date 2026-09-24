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

export const RESUME_PROCESSING_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxExtractedTextChars: 250_000,
  maxPdfPages: 80,
  maxDocxEntries: 2_000,
  maxDocxUncompressedBytes: 60 * 1024 * 1024,
  maxDocxEntryBytes: 20 * 1024 * 1024,
  maxDocxCompressionRatio: 100,
  extractionTimeoutMs: 8_000,
} as const;

const EMPTY_RESULT: ParsedResumeFields = {
  headline: null,
  bio: null,
  primary_category: null,
  categories: [],
  skills: [],
  tools: [],
  industries: [],
  languages: [],
  years_experience: null,
};

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function assertPdfSignature(buffer: Buffer) {
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The uploaded file is not a valid PDF.");
  }

  // A cheap pre-parse guard. It is intentionally conservative and is not used
  // to determine the real page count; it prevents obviously abusive documents
  // from reaching PDF.js in the request process.
  const pageMarkers = (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
  if (pageMarkers > RESUME_PROCESSING_LIMITS.maxPdfPages) {
    throw new Error(`PDF resumes are limited to ${RESUME_PROCESSING_LIMITS.maxPdfPages} pages.`);
  }
}

function findZipEndOfCentralDirectory(buffer: Buffer) {
  const min = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function assertSafeDocxArchive(buffer: Buffer) {
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x50 ||
    buffer[1] !== 0x4b ||
    buffer[2] !== 0x03 ||
    buffer[3] !== 0x04
  ) {
    throw new Error("The uploaded file is not a valid DOCX archive.");
  }

  const eocd = findZipEndOfCentralDirectory(buffer);
  if (eocd < 0) throw new Error("The DOCX archive is incomplete or malformed.");

  const entries = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (
    entries > RESUME_PROCESSING_LIMITS.maxDocxEntries ||
    centralOffset + centralSize > buffer.length
  ) {
    throw new Error("The DOCX archive exceeds safe processing limits.");
  }

  let offset = centralOffset;
  let totalCompressed = 0;
  let totalUncompressed = 0;
  let sawContentTypes = false;
  let sawDocumentXml = false;

  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("The DOCX archive directory is malformed.");
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20);
    const uncompressed = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const next = offset + 46 + fileNameLength + extraLength + commentLength;

    if (next > buffer.length || compressed === 0xffffffff || uncompressed === 0xffffffff) {
      throw new Error("ZIP64 or malformed DOCX archives are not accepted.");
    }
    if ((flags & 0x1) !== 0) throw new Error("Password-protected DOCX files cannot be processed.");
    if (![0, 8].includes(compressionMethod)) {
      throw new Error("The DOCX file uses an unsupported compression method.");
    }
    if (uncompressed > RESUME_PROCESSING_LIMITS.maxDocxEntryBytes) {
      throw new Error("A DOCX component exceeds safe processing limits.");
    }

    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (fileName === "[Content_Types].xml") sawContentTypes = true;
    if (fileName === "word/document.xml") sawDocumentXml = true;

    totalCompressed += compressed;
    totalUncompressed += uncompressed;
    offset = next;
  }

  if (!sawContentTypes || !sawDocumentXml) {
    throw new Error("The archive does not contain a valid Word document.");
  }
  if (totalUncompressed > RESUME_PROCESSING_LIMITS.maxDocxUncompressedBytes) {
    throw new Error("The DOCX file expands beyond the safe processing limit.");
  }
  if (
    totalCompressed > 0 &&
    totalUncompressed / Math.max(totalCompressed, 1) > RESUME_PROCESSING_LIMITS.maxDocxCompressionRatio
  ) {
    throw new Error("The DOCX compression ratio exceeds the safe processing limit.");
  }
}

export function assertResumeFileSafe(buffer: Buffer, mimeType: string) {
  if (!buffer.length || buffer.length > RESUME_PROCESSING_LIMITS.maxFileBytes) {
    throw new Error("Resume must be 5 MB or smaller.");
  }
  if (mimeType === PDF_MIME) {
    assertPdfSignature(buffer);
    return;
  }
  if (mimeType === DOCX_MIME) {
    assertSafeDocxArchive(buffer);
    return;
  }
  throw new Error("Auto-fill only supports PDF and DOCX resumes.");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function boundedExtractedText(text: string) {
  if (text.length > RESUME_PROCESSING_LIMITS.maxExtractedTextChars) {
    throw new Error("The resume contains too much extracted text to process safely.");
  }
  return text;
}

/** Extracts raw text from a bounded, validated PDF or DOCX resume. */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  assertResumeFileSafe(buffer, mimeType);

  if (mimeType === PDF_MIME) {
    const { CanvasFactory } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer, CanvasFactory });
    try {
      const result = await withTimeout(
        parser.getText(),
        RESUME_PROCESSING_LIMITS.extractionTimeoutMs,
        "PDF text extraction timed out.",
      );
      return boundedExtractedText(result.text);
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  if (mimeType === DOCX_MIME) {
    const mammoth = await import("mammoth");
    const result = await withTimeout(
      mammoth.extractRawText({ buffer }),
      RESUME_PROCESSING_LIMITS.extractionTimeoutMs,
      "DOCX text extraction timed out.",
    );
    return boundedExtractedText(result.value);
  }

  throw new Error("Auto-fill only supports PDF and DOCX resumes.");
}

const LANGUAGES = [
  "English",
  "Filipino",
  "Tagalog",
  "Bisaya",
  "Cebuano",
  "Ilocano",
  "Spanish",
  "Mandarin",
  "Chinese",
  "Japanese",
  "Korean",
  "French",
  "German",
];
const INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Ecommerce",
  "Healthcare",
  "Dental",
  "Real Estate",
  "Finance",
  "Legal",
  "Hospitality",
  "Education",
  "Retail",
  "Insurance",
  "Logistics",
  "Nonprofit",
  "Marketing agency",
  "Technology",
];

function countMatches(haystack: string, needle: string): number {
  const escaped = needle.toLowerCase().replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  const matches = haystack.match(new RegExp(`\\b${escaped}\\b`, "gi"));
  return matches ? matches.length : 0;
}

function extractYearsExperience(text: string): number | null {
  const matches = [
    ...text.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:professional\s+)?experience/gi),
  ];
  if (!matches.length) return null;
  const values = matches
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 60);
  if (!values.length) return null;
  return Math.max(...values);
}

function looksLikeSectionHeading(line: string): boolean {
  if (line.length > 40) return false;
  if (
    /^(skills?|tools?|experience|education|work history|employment|certifications?|projects?|references?|contact|languages?)\b/i.test(
      line,
    )
  ) {
    return true;
  }
  const letters = line.replace(/[^a-zA-Z]/g, "");
  return letters.length > 2 && letters === letters.toUpperCase();
}

function extractBio(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headingIdx = lines.findIndex((line) =>
    /^(summary|profile|objective|about|professional summary)\b/i.test(line),
  );

  if (headingIdx !== -1) {
    const collected: string[] = [];
    for (let i = headingIdx + 1; i < lines.length && collected.length < 4; i++) {
      if (looksLikeSectionHeading(lines[i])) break;
      collected.push(lines[i]);
    }
    const candidate = collected.join(" ").trim();
    if (candidate.length >= 40) return candidate.slice(0, 600);
  }

  const fallback = lines
    .slice(0, 18)
    .filter(
      (line) =>
        line.length >= 55 &&
        !looksLikeSectionHeading(line) &&
        !/@|https?:\/\/|linkedin\.com|\+?\d[\d\s().-]{7,}/i.test(line) &&
        !/\b(19|20)\d{2}\b.*\b(19|20)\d{2}\b/.test(line),
    )
    .slice(0, 3)
    .join(" ")
    .trim();

  return fallback.length >= 60 ? fallback.slice(0, 600) : null;
}

/**
 * Conservative deterministic profile suggestions. It never writes profile
 * data and never invents unsupported resume claims.
 */
export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeFields> {
  const text = resumeText.trim();
  if (!text) return EMPTY_RESULT;

  const categoryScores = SPECIALTIES.map((specialty) => {
    const vocabulary = [...specialty.skills, ...specialty.tools];
    const score = vocabulary.reduce((sum, term) => sum + countMatches(text, term), 0);
    return { category: specialty.category, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const primary_category =
    (categoryScores[0]?.category as (typeof VA_CATEGORIES)[number]) || null;
  const categories = categoryScores
    .slice(0, 3)
    .map((entry) => entry.category as (typeof VA_CATEGORIES)[number]);

  const matchedSkills = new Set<string>();
  const matchedTools = new Set<string>();
  for (const specialty of SPECIALTIES) {
    for (const skill of specialty.skills) {
      if (countMatches(text, skill) > 0) matchedSkills.add(skill);
    }
    for (const tool of specialty.tools) {
      if (countMatches(text, tool) > 0) matchedTools.add(tool);
    }
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
    languages,
    years_experience: extractYearsExperience(text),
  };
}
