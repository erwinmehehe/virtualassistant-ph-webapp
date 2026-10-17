import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hasExplicitPlacementTermsConsent } from "../src/lib/placement-confirmation-consent.ts";

test("only an explicitly checked placement terms checkbox authorizes confirmation", () => {
  const form = new FormData();
  assert.equal(hasExplicitPlacementTermsConsent(form), false, "missing checkbox must fail");
  for (const value of ["", "yes", "true", "1", "false", "off", "ON"]) {
    form.set("confirm_terms", value);
    assert.equal(hasExplicitPlacementTermsConsent(form), false, `invalid value ${value}`);
  }
  form.set("confirm_terms", "on");
  assert.equal(hasExplicitPlacementTermsConsent(form), true);
  form.append("confirm_terms", "off");
  assert.equal(hasExplicitPlacementTermsConsent(form), true, "first submitted checkbox value governs");
  form.set("confirm_terms", "off");
  assert.equal(hasExplicitPlacementTermsConsent(form), false);
});

test("client placement confirmation enforces the server gate before database writes", async () => {
  const [actions, form] = await Promise.all([
    readFile(new URL("../src/app/actions/recruiter-operations-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/workspace/client/offers/page.tsx", import.meta.url), "utf8"),
  ]);
  const start = actions.indexOf("export async function confirmPlacementOfferAction(formData: FormData)");
  assert.ok(start >= 0, "server action should exist");
  const action = actions.slice(start);
  const guard = action.indexOf("if (!hasExplicitPlacementTermsConsent(formData))");
  const firstLookup = action.indexOf('admin.from("placement_offers")');
  const hire = action.indexOf('admin.rpc("confirm_hire_transaction"');
  assert.ok(guard >= 0, "server must require terms consent");
  assert.ok(firstLookup > guard, "guard must precede offer lookup");
  assert.ok(hire > guard, "guard must precede hire transaction");
  assert.match(form, /name="confirm_terms"\s+required/);
  assert.match(form, /Confirm placement/);
});
