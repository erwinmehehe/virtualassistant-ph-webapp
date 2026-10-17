/** A checkbox marked required by the browser is not a server-side consent gate. */
export function hasExplicitPlacementTermsConsent(formData: FormData): boolean {
  return formData.get("confirm_terms") === "on";
}
