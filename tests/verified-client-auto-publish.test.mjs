import assert from "node:assert/strict";
import test from "node:test";
import {
  clientCanSelfPublishJob,
  publicationMissingDetails,
  publicJobReviewSignals,
  resolveClientJobSubmitStatus,
} from "../src/lib/job-publication.ts";
import { hiringCircumventionSignals } from "../src/lib/hiring-circumvention.ts";

const eligibility = (overrides = {}) => ({
  serviceModel: "curated_placement",
  emailVerified: true,
  legacyApproved: false,
  verifiedClientRollout: false,
  ...overrides,
});

test("email-verified employers publish complete roles without admin review or a feature flag", () => {
  assert.equal(clientCanSelfPublishJob(eligibility()), true);
  assert.equal(clientCanSelfPublishJob(eligibility({ verifiedClientRollout: false })), true);
  assert.equal(clientCanSelfPublishJob(eligibility({ serviceModel: "managed_service" })), true);
  assert.equal(clientCanSelfPublishJob(eligibility({ legacyApproved: false })), true);
});

test("unverified accounts never bypass publication verification through legacy permission", () => {
  assert.equal(clientCanSelfPublishJob(eligibility({ emailVerified: false })), false);
  assert.equal(clientCanSelfPublishJob(eligibility({ emailVerified: false, legacyApproved: true })), false);
  assert.equal(clientCanSelfPublishJob(eligibility({ emailVerified: false, verifiedClientRollout: true })), false);
});

test("complete briefs pass the existing company/content/pay floor checks", () => {
  const complete = {
    title: "Executive Assistant",
    company_name: "Acme Studio",
    summary: "Help our team with scheduling, email and follow-up.",
    responsibilities: ["Manage calendar"],
    min_hourly_rate: 8,
  };
  assert.deepEqual(publicationMissingDetails(complete), []);
  assert.deepEqual(publicationMissingDetails({ ...complete, summary: "", min_hourly_rate: 5 }), ["summary", "budget"]);
});

test("automatic moderation detects contact info and suspicious links", () => {
  assert.deepEqual(hiringCircumventionSignals(["Please email me at hire@example.com"]), ["email"]);
  assert.deepEqual(hiringCircumventionSignals(["Text 09171234567 to apply"]), ["phone"]);
  assert.deepEqual(publicJobReviewSignals(["Visit https://example.org/apply"]), ["external_link"]);
  assert.deepEqual(publicJobReviewSignals(["Earn money fast - click here to apply"]), ["promotional_language"]);
  assert.deepEqual(publicJobReviewSignals(["Manage accounts and update daily reports."]), []);
});

test("drafts and moderation holds cannot self-publish or bypass review on edit", () => {
  const status = (overrides = {}) => resolveClientJobSubmitStatus({
    submitMode: "submit",
    canSelfPublish: true,
    needsModeration: false,
    ...overrides,
  });
  assert.equal(status(), "published");
  assert.equal(status({ canSelfPublish: false }), "pending");
  assert.equal(status({ needsModeration: true }), "pending");
  assert.equal(status({ previousStatus: "published", needsModeration: true }), "pending");
  assert.equal(status({ previousStatus: "published", staffHold: true }), "pending");
  assert.equal(status({ submitMode: "draft" }), "draft");
  assert.equal(status({ previousStatus: "published", canSelfPublish: false }), "published");
});
