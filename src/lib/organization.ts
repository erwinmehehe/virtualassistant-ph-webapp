/**
 * One canonical Organization node for the whole site.
 *
 * Keep the public entity name consistent across page schema, publisher/provider
 * references, and site metadata. The domain remains an alternate name/brand
 * reference, while the entity itself is "Virtual Assistant Philippines".
 */

function canonicalBase(base: string) {
  return canonicalBase(base);
}

export function organizationId(base: string) {
  return `${canonicalBase(base)}/#organization`;
}

export function websiteId(base: string) {
  return `${canonicalBase(base)}/#website`;
}

export function websiteRef(base: string) {
  return { "@id": websiteId(base) };
}

export function organizationPointer(base: string) {
  return { "@id": organizationId(base) };
}

export const ORGANIZATION_NAME = "Virtual Assistant Philippines";
export const ORGANIZATION_ALTERNATE_NAME = "VirtualAssistant.com.ph";

/** Profiles we control. Only add a URL that is live and genuinely ours. */
export const ORGANIZATION_SAME_AS = [
  "https://www.linkedin.com/company/virtualassistantphilippines/"
];

/** A reference to the canonical node, for provider/publisher fields. */
export function organizationRef(base: string) {
  return {
    "@type": "Organization",
    "@id": organizationId(base),
    name: ORGANIZATION_NAME,
    alternateName: ORGANIZATION_ALTERNATE_NAME,
    url: canonicalBase(base),
  };
}
