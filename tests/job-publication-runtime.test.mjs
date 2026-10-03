import test from "node:test";
import assert from "node:assert/strict";

test("publication validator executes and returns missing required fields", async () => {
  const { publicationMissingDetails } = await import("../src/lib/job-publication.ts");
  const missing = publicationMissingDetails({
    status: "pending",
    client_id: "client-1",
    title: "Executive Assistant",
    company_name: "Acme Studio",
    summary: null,
    responsibilities: ["Calendar management"],
    required_skills: ["Calendar management", "Inbox management"],
    hours_per_week: 20,
    timezone: "Australia/Sydney",
    min_hourly_rate: 8,
    start_timing: null,
  });

  assert.deepEqual(missing, ["summary"]);
});

test("legacy published roles with missing required fields are visibly flagged", async () => {
  const { publicationBlocker } = await import("../src/lib/job-publication.ts");
  const result = publicationBlocker({
    status: "published",
    client_id: "client-1",
    title: "Ecommerce VA",
    company_name: "Acme Commerce",
    summary: null,
    responsibilities: ["Manage orders"],
    required_skills: ["Shopify", "Customer support"],
    hours_per_week: 40,
    timezone: "Asia/Manila",
    min_hourly_rate: 5,
    start_timing: null,
  }, { commercial_status: "accepted" });

  assert.equal(result.key, "brief_incomplete");
  assert.match(result.detail, /missing required public content/i);
  assert.match(result.detail, /summary/i);
});

test("complete published roles remain healthy", async () => {
  const { publicationBlocker } = await import("../src/lib/job-publication.ts");
  const result = publicationBlocker({
    status: "published",
    client_id: "client-1",
    title: "Executive Assistant",
    company_name: "Acme Studio",
    summary: "A sufficiently detailed role summary for publication.",
    responsibilities: ["Manage executive calendar"],
    required_skills: ["Calendar management", "Inbox management"],
    hours_per_week: 40,
    timezone: "Australia/Sydney",
    min_hourly_rate: 8,
    start_timing: "Within 2 weeks",
  }, { commercial_status: "accepted" });

  assert.equal(result.key, "published");
});


test("public jobs require a real company name", async () => {
  const { publicationMissingDetails, isPublishableCompanyName } = await import("../src/lib/job-publication.ts");

  assert.equal(isPublishableCompanyName("Acme Studio"), true);
  for (const value of ["", "N/A", "test", "Private employer", "Confidential Client"]) {
    assert.equal(isPublishableCompanyName(value), false, `${value || "empty"} should not be publishable`);
  }

  const missing = publicationMissingDetails({
    status: "pending",
    client_id: "client-1",
    title: "Executive Assistant",
    company_name: "N/A",
    summary: "A sufficiently detailed role summary for publication.",
    responsibilities: ["Manage executive calendar"],
    min_hourly_rate: 8,
  });
  assert.ok(missing.includes("company name"));
});


test("publication validator rejects compensation below the product floor", async () => {
  const { publicationMissingDetails, publicationBlocker } = await import("../src/lib/job-publication.ts");
  const job = {
    status: "published",
    client_id: "client-1",
    title: "Executive Assistant",
    company_name: "Acme Studio",
    summary: "A sufficiently detailed role summary for publication.",
    responsibilities: ["Manage executive calendar"],
    required_skills: ["Calendar management"],
    hours_per_week: 40,
    timezone: "Australia/Sydney",
    min_hourly_rate: 5,
    start_timing: "Within 2 weeks",
  };

  assert.deepEqual(publicationMissingDetails(job), ["budget of at least USD 6/hour"]);
  const result = publicationBlocker(job, { commercial_status: "accepted" });
  assert.equal(result.key, "brief_incomplete");
  assert.match(result.detail, /budget of at least USD 6\/hour/i);
});
