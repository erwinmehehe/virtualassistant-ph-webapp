/**
 * Return trimmed, non-empty strings with case-insensitive duplicates removed.
 * Useful for profile/job tags that can contain the primary category again in
 * their secondary category arrays.
 */
export function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/** Merge several possibly-null string arrays and de-duplicate the result. */
export function mergeUniqueStrings(...groups: unknown[]): string[] {
  const merged: unknown[] = [];
  for (const group of groups) {
    if (Array.isArray(group)) merged.push(...group);
    else if (group != null) merged.push(group);
  }
  return uniqueStrings(merged);
}
