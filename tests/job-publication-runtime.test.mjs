import test from "node:test";
import assert from "node:assert/strict";

test("publication validator executes and returns missing required fields", async () => {
  const { publicationMissingDetails } = await import("../src/lib/job-publication.ts");
  const missing = publicationMissingDetails({
    status: "pending",
    client_id: "client-1",
    title: "Executive Assistant",
    summary: "A sufficiently detailed role summary for publication.",
    responsibilities: ["Calendar management"],
    required_skills: ["Calendar management", "Inbox management"],
    hours_per_week: 20,
    timezone: "Australia/Sydney",
    min_hourly_rate: 8,
    start_timing: null,
  });

  assert.deepEqual(missing, ["start timing"]);
});

test("legacy published roles with missing required fields are visibly flagged", async () => {
  const { publicationBlocker } = await import("../src/lib/job-publication.ts");
  const result = publicationBlocker({
    status: "published",
    client_id: "client-1",
    title: "Ecommerce VA",
    summary: "A sufficiently detailed ecommerce support role summary.",
    responsibilities: ["Manage orders"],
    required_skills: ["Shopify", "Customer support"],
    hours_per_week: 40,
    timezone: "Asia/Manila",
    min_hourly_rate: 5,
    start_timing: null,
  }, { commercial_status: "accepted" });

  assert.equal(result.key, "needs_role_details");
  assert.match(result.detail, /published role is incomplete/i);
  assert.match(result.detail, /start timing/i);
});

test("complete published roles remain healthy", async () => {
  const { publicationBlocker } = await import("../src/lib/job-publication.ts");
  const result = publicationBlocker({
    status: "published",
    client_id: "client-1",
    title: "Executive Assistant",
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
