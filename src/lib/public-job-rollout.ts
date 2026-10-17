/** Public job release switch. An absent or malformed value always keeps leads private. */
export function publicJobAutoPublicationEnabled(value: string | undefined): boolean {
  return value === "enabled";
}
