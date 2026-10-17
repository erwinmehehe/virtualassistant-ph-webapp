import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { certificateRecipientNameSize } from "../src/lib/training-certificate-name-fit.ts";

test("recipient fitting uses smaller type for lengthy names without changing text", () => {
  const regularName = "Maria L. Labuan";
  const compactName = "Maria Alexandra Celestina Labuan";
  const longName = "Maria Alexandra Celestina Isabelle de la Cruz Villanueva Santos";
  const uninterrupted = "AlexandriaMarianellaConstantinople";
  assert.equal(certificateRecipientNameSize(regularName), "regular");
  assert.equal(certificateRecipientNameSize(compactName), "compact");
  assert.equal(certificateRecipientNameSize(longName), "dense");
  assert.equal(certificateRecipientNameSize(uninterrupted), "dense");
  assert.equal(regularName, "Maria L. Labuan");
  assert.equal(compactName, "Maria Alexandra Celestina Labuan");
});

test("public verifier displays the exact stored recipient and applies print-safe size tiers", async () => {
  const [page, css] = await Promise.all([
    readFile("src/app/training/certificates/[code]/page.tsx", "utf8"),
    readFile("src/app/training/certificates/[code]/certificate.css", "utf8"),
  ]);
  assert.match(page, /certificateRecipientNameSize\(credential\.recipientName\)/);
  assert.match(page, /<strong>\{credential\.recipientName\}<\/strong>/);
  assert.match(css, /\.credential-recipient strong\s*\{[^}]*overflow-wrap: anywhere/s);
  assert.match(css, /\.credential-recipient--compact strong/);
  assert.match(css, /\.credential-recipient--dense strong/);
  assert.match(css, /@media print\s*\{[^]*\.credential-recipient--dense strong/);
  // The name must wrap rather than clip/ellipsis, also in print.
  const fittingRules = css.slice(css.lastIndexOf("/* Recipient identity on verified and printable certificates. */"));
  assert.doesNotMatch(fittingRules, /text-overflow\s*:\s*ellipsis|white-space\s*:\s*nowrap|line-clamp/);
});
