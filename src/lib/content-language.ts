const SPOKEN_VOWEL_ACRONYM_STARTS = /^(?:[FHILMNRSX](?:[A-Z]|\b))/;

const ACRONYMS = ["API", "BIM", "CPA", "CRM", "EHR", "FAQ", "GA4", "HR", "HVAC", "IT", "NDIS", "SEO", "SMSF", "SOP", "VA"];

export function indefiniteArticleFor(value: string) {
  const word = value.trim().split(/\s+/)[0] || "";
  if (SPOKEN_VOWEL_ACRONYM_STARTS.test(word)) return "an";
  return /^[AEIOU]/i.test(word) ? "an" : "a";
}

export function preserveAcronyms(value: string) {
  return ACRONYMS.reduce((result, acronym) => result.replace(new RegExp(`\\b${acronym}\\b`, "gi"), acronym), value);
}

export function titleCaseWithAcronyms(value: string) {
  return preserveAcronyms(value.replace(/\b\w/g, (match) => match.toUpperCase()));
}
