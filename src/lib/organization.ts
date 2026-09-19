/**
 * One canonical Organization node for the whole site.
 *
 * Every page used to declare its own unlinked Organization, so a crawler had
 * no way to tell that the publisher on a blog post and the provider on a
 * service page were the same company. Pages now reference this @id instead,
 * and the profile links let an assistant resolve us to the same entity it
 * sees elsewhere.
 */

export function organizationId(base: string) {
  return `${base.replace(/\/$/, "")}/#organization`;
}

export const ORGANIZATION_NAME = "VirtualAssistant.com.ph";

/** Profiles we control. Only add a URL that is live and genuinely ours. */
export const ORGANIZATION_SAME_AS = [
  "https://www.linkedin.com/company/virtualassistantphilippines/"
];

/** A reference to the canonical node, for provider/publisher fields. */
export function organizationRef(base: string) {
  return { "@type": "Organization", "@id": organizationId(base), name: ORGANIZATION_NAME, url: base.replace(/\/$/, "") };
}
