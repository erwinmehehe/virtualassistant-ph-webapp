const DEFAULT_BLOCKED_CONTACT_DOMAINS = [
  "blastleadgeneration.com",
  "freeb2bdata.org",
  "instagrow.business",
  "unsub.agency",
] as const;

const OWN_DOMAINS = new Set([
  "virtualassistant.com.ph",
  "www.virtualassistant.com.ph",
]);

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  return at >= 0 ? normalizeHost(email.slice(at + 1)) : "";
}

function configuredBlockedDomains() {
  const extra = (process.env.CONTACT_BLOCKED_DOMAINS || "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
  return new Set([...DEFAULT_BLOCKED_CONTACT_DOMAINS, ...extra]);
}

function hostMatchesBlockedDomain(host: string, blocked: Set<string>) {
  const normalized = normalizeHost(host);
  for (const domain of blocked) {
    if (normalized === domain || normalized.endsWith(`.${domain}`)) return true;
  }
  return false;
}

function extractExternalHosts(text: string) {
  const hosts: string[] = [];
  const matches = text.matchAll(/https?:\/\/([^\s/?#)>"']+)/gi);
  for (const match of matches) {
    const host = normalizeHost(match[1] || "");
    if (host && !OWN_DOMAINS.has(host) && !OWN_DOMAINS.has(`www.${host}`)) hosts.push(host);
  }
  return hosts;
}

export function shouldSilentlyDropContactSubmission(input: {
  email: string;
  company?: string | null;
  topic?: string | null;
  message: string;
}) {
  const blocked = configuredBlockedDomains();
  const senderDomain = emailDomain(input.email);
  if (hostMatchesBlockedDomain(senderDomain, blocked)) return true;

  const haystack = [input.company, input.topic, input.message]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  for (const domain of blocked) {
    if (haystack.includes(domain)) return true;
  }

  const externalHosts = extractExternalHosts(input.message);
  if (!externalHosts.length) return false;
  if (externalHosts.some((host) => hostMatchesBlockedDomain(host, blocked))) return true;

  let score = 2; // Unsolicited commercial pitches normally point away from our site.

  if (/\b(generate|get|bring|capture|convert)(?:\s+\w+){0,3}\s+leads?\b/i.test(input.message)) score += 2;
  if (/\blead[ -]?generation\b|\bweb visitors? into leads?\b/i.test(input.message)) score += 2;
  if (/\b(?:live|free) demo\b|\bbook (?:a )?demo\b|\btry (?:it|this|our) (?:out )?(?:now|today)\b/i.test(input.message)) score += 1;
  if (/\b(?:increase|boost|grow)\b[\s\S]{0,45}\b(?:traffic|sales|revenue|leads?|customers?)\b/i.test(input.message)) score += 1;
  if (/\bseo services?\b|\bguest post(?:ing)?\b|\blink insertion\b|\bbacklinks?\b/i.test(input.message)) score += 2;
  if (/\b(?:cost[- ]effective|profitable|special offer|free trial)\b/i.test(input.message)) score += 1;
  if (/\b(?:we|i) (?:can|could|would like to|want to) help\b[\s\S]{0,80}\b(?:website|business|company)\b/i.test(input.message)) score += 1;
  if (externalHosts.length >= 2) score += 1;

  return score >= 5;
}
