/**
 * Present an answer from already-reviewed, visible editorial copy. Do not
 * fabricate a fresh claim or silently slice a sentence just to hit a word
 * count. Editors can override questions and answers in the post record.
 */
function normalizeSentence(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned && !/[.!?]$/.test(cleaned) ? `${cleaned}.` : cleaned;
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function editorialQuickAnswer(description: string, takeaways: readonly string[]): string {
  const sentences = [description, ...takeaways].map(normalizeSentence).filter(Boolean);
  if (!sentences.length) return "";
  const chosen = [sentences[0]];
  let words = wordCount(chosen[0]);

  for (const sentence of sentences.slice(1)) {
    if (words >= 40) break;
    const count = wordCount(sentence);
    // Prefer a complete, useful sentence to a mechanical 60-word cutoff.
    if (words + count > 60 && words >= 35) continue;
    chosen.push(sentence);
    words += count;
  }
  return chosen.join(" ");
}

export function articleAnswerQuestion(title: string): string {
  const cleaned = title.trim().replace(/[.!]+$/, "");
  if (cleaned.endsWith("?")) return cleaned;
  if (/^how to\s+/i.test(cleaned)) return `How can you ${cleaned.slice(7).replace(/^./, (x) => x.toLowerCase())}?`;
  if (/^(what|how|why|when|where|which|who|can|is|are|does|do|should|will)\b/i.test(cleaned)) return `${cleaned}?`;
  return `What should you know about ${cleaned.replace(/^./, (x) => x.toLowerCase())}?`;
}

/** Keep the stored heading and its anchor intact; render a question for readers. */
export function editorialQuestionHeading(heading: string, override?: string): string {
  if (override?.trim()) return override.trim();
  const cleaned = heading.trim().replace(/[.!]+$/, "");
  if (cleaned.endsWith("?")) return cleaned;
  if (/^(what|how|why|when|where|which|who|can|is|are|does|do|should|will)\b/i.test(cleaned)) return `${cleaned}?`;

  const checklist = cleaned.match(/^(.+? checklist):/i);
  if (checklist) return `What belongs in the ${checklist[1].toLowerCase()}?`;

  const comparison = cleaned.match(/^comparison of\s+(.+)/i);
  if (comparison) return `How do ${comparison[1]} compare?`;

  if (/^(use|set|build|prepare|create|review|give|avoid|write|choose|define|keep|start|track|check|compare|measure|plan|manage|handle|improve|teach|match|evaluate|draft|find|reduce|protect|confirm|organize|test|include|show|explain)\s+/i.test(cleaned)) {
    return `How do you ${cleaned.replace(/^./, (x) => x.toLowerCase())}?`;
  }

  // Avoid robotic questions on unreviewed headings; priority articles use explicit editorial overrides.
  return cleaned;
}
