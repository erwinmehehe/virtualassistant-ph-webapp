import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { canAutoPublishLeadJob } from "../src/lib/job-publication.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const complete = {
  optedIn: true,
  clientId: null,
  requestedVaId: null,
  title: "Administrative Virtual Assistant",
  companyName: "Example Operations",
  publicBrief: "We are hiring a remote Virtual Assistant to manage calendar requests, inbox triage, appointment confirmation, and detailed follow-up records for our operations team.",
  hoursPerWeek: 20,
  budget: "USD 8 to 12/hour",
  minHourlyRate: 8,
};

test("only opted-in complete roles publish without an account", () => {
  assert.equal(canAutoPublishLeadJob(complete), true);
  assert.equal(canAutoPublishLeadJob({ ...complete, optedIn: false }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, publicBrief: "Need a VA" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, companyName: "N/A" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, companyName: "https://example.com" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "Not sure yet" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "PHP 40000/month", minHourlyRate: 40000 }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "PHP 8/hour", minHourlyRate: 8 }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "USD 40000/month", minHourlyRate: 40000 }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "8/hour" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "USD 8 to 12/week" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "USD 12 to 8/hour", minHourlyRate: 12 }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "USD 25+/hour", minHourlyRate: 25 }), true);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "USD 8 to 12/hour", minHourlyRate: 6 }), false);

  assert.equal(canAutoPublishLeadJob({ ...complete, budget: "USD 5 to 8/hour", minHourlyRate: 6 }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, budget: null }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, hoursPerWeek: null }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, requestedVaId: "selected-va" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, clientId: "client-one" }), false);
  assert.equal(canAutoPublishLeadJob({ ...complete, publicBrief: "Requested talent profile: Alice. " + complete.publicBrief }), false);
});

test("the anonymous job workflow requires consent and enforces moderation", async () => {
  const [form, leads, role, schema, applications] = await Promise.all([
    read("src/components/hiring-brief-form.tsx"),
    read("src/app/actions/leads.ts"),
    read("src/lib/lead-role.ts"),
    read("supabase/migrations/20261003210000_recruiter_managed_public_jobs.sql"),
    read("src/app/actions/applications.ts"),
  ]);
  assert.match(form, /name="public_listing_consent"/);
  assert.match(form, /Leave unchecked for a private matching request/);
  assert.match(form, /Private by default/);
  const hire = await read("src/app/hire/page.tsx");
  assert.match(hire, /stays private unless you choose the optional public listing/);
  assert.match(leads, /publicListingConsent: formData.get\("public_listing_consent"\) === "yes"/);
  assert.match(role, /canAutoPublishLeadJob/);
  assert.match(role, /hiringCircumventionSignals\(publicContent\)/);
  assert.match(role, /args\.publicBrief, args\.tools/);
  // PII detection must run against the raw brief, before display redaction.
  assert.doesNotMatch(role, /args\.title, args\.company, publicBrief, args\.tools/);
  assert.match(role, /publicJobReviewSignals\(publicContent\)/);
  assert.match(role, /recruiter_managed_public: true/);
  assert.match(role, /status: publishNow \? "published" : "pending"/);
  assert.match(role, /notifyGoogleIndexingBestEffort/);
  assert.match(schema, /j\.client_id is not null or j\.recruiter_managed_public = true/);
  assert.match(applications, /recruiterManagedPublic = Boolean\(job\.recruiter_managed_public && job\.lead_id\)/);
});
