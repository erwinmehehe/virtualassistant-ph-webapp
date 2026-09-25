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


export type ContentLocale = "en-AU";

const AU_ENGLISH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\borganizations\b/gi, "organisations"],
  [/\borganization\b/gi, "organisation"],
  [/\borganizing\b/gi, "organising"],
  [/\borganized\b/gi, "organised"],
  [/\borganize\b/gi, "organise"],
  [/\bprioritization\b/gi, "prioritisation"],
  [/\bprioritizing\b/gi, "prioritising"],
  [/\bprioritized\b/gi, "prioritised"],
  [/\bprioritize\b/gi, "prioritise"],
  [/\bspecialization\b/gi, "specialisation"],
  [/\bspecializing\b/gi, "specialising"],
  [/\bspecialized\b/gi, "specialised"],
  [/\bspecialize\b/gi, "specialise"],
  [/\bauthorization\b/gi, "authorisation"],
  [/\bauthorized\b/gi, "authorised"],
  [/\bauthorize\b/gi, "authorise"],
  [/\bcustomization\b/gi, "customisation"],
  [/\bcustomized\b/gi, "customised"],
  [/\bcustomize\b/gi, "customise"],
  [/\boptimization\b/gi, "optimisation"],
  [/\boptimized\b/gi, "optimised"],
  [/\boptimize\b/gi, "optimise"],
  [/\banalyzing\b/gi, "analysing"],
  [/\banalyzed\b/gi, "analysed"],
  [/\banalyze\b/gi, "analyse"],
  [/\bbehavior\b/gi, "behaviour"],
  [/\blabor\b/gi, "labour"],
  [/\bfulfillment\b/gi, "fulfilment"],
  [/\bfulfill\b/gi, "fulfil"],
  [/\benrollment\b/gi, "enrolment"],
  [/\bcanceled\b/gi, "cancelled"],
  [/\bfinancial advisor\b/gi, "financial adviser"],
  [/\badvisors\b/gi, "advisers"]
];

function preserveReplacementCase(match: string, replacement: string) {
  if (match === match.toUpperCase()) return replacement.toUpperCase();
  if (match[0] === match[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

export function localizeEnglish(value: string, locale?: ContentLocale) {
  if (locale !== "en-AU") return value;
  return AU_ENGLISH_REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, (match) => preserveReplacementCase(match, replacement)),
    value
  );
}

const NON_LOCALIZED_CONTENT_KEYS = new Set([
  "slug",
  "clusterSlug",
  "primaryKeyword",
  "directoryCategory",
  "relatedSlugs",
  "serviceSlugs",
  "relatedServiceSlugs",
  "relatedIndustrySlugs",
  "href",
  "url",
  "path",
  "sourcePath"
]);

export function localizeContent<T>(value: T, locale?: ContentLocale, key?: string): T {
  if (locale !== "en-AU") return value;
  if (key && NON_LOCALIZED_CONTENT_KEYS.has(key)) return value;
  if (typeof value === "string") return localizeEnglish(value, locale) as T;
  if (Array.isArray(value)) return value.map((item) => localizeContent(item, locale, key)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, item]) => [
        entryKey,
        localizeContent(item, locale, entryKey)
      ])
    ) as T;
  }
  return value;
}
