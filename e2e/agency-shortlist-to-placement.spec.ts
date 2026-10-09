import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type ProposalFixture = { leadId: string; proposalId: string; token: string; company: string };
type LocalFixtures = { pipeline0: ProposalFixture; pipeline1: ProposalFixture };

const password = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";

function localAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const site = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  if (!url || !key) throw new Error("An isolated local Supabase instance is required.");
  for (const value of [url, site]) {
    const hostname = new URL(value).hostname;
    if (!["127.0.0.1", "localhost", "::1"].includes(hostname)) {
      throw new Error("Synthetic hiring E2E tests refuse remote/production endpoints.");
    }
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function login(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
}

async function single<T>(result: { data: T | null; error: { message: string } | null }, what: string): Promise<T> {
  if (result.error || !result.data) throw new Error(`${what}: ${result.error?.message || "not found"}`);
  return result.data;
}

test("isolated shortlisted VA moves through interview, two-sided offer, and one hired workroom", async ({ browser }, info) => {
  test.setTimeout(180_000);
  const admin = localAdmin();
  const fixtures = JSON.parse(await readFile(".e2e-hiring-fixtures.json", "utf8")) as LocalFixtures;
  const fixture = fixtures[info.retry > 0 ? "pipeline1" : "pipeline0"];
  const recruiterContext = await browser.newContext();
  const clientContext = await browser.newContext();
  const vaContext = await browser.newContext();

  try {
    const recruiter = await recruiterContext.newPage();
    const client = await clientContext.newPage();
    const va = await vaContext.newPage();
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({page:1,perPage:100});
    expect(authError).toBeNull();
    const recruiterId = authUsers.users.find(user => user.email === "recruiter.e2e@example.test")?.id;
    const clientId = authUsers.users.find(user => user.email === "client.e2e@example.test")?.id;
    const vaId = authUsers.users.find(user => user.email === "va.e2e@example.test")?.id;
    if (!recruiterId || !clientId || !vaId) throw new Error("Missing isolated browser identities");

    // Real server action: accept the fictional proposal and publish a linked role.
    await login(recruiter, "recruiter.e2e@example.test", "/workspace/recruiter/today");
    await recruiter.goto(`/proposal/${fixture.token}`);
    await expect(recruiter.getByRole("heading", { name: "Approve and start recruiting" })).toBeVisible();
    await recruiter.locator('input[name="acceptance_name"]').fill("E2E Client");
    await recruiter.locator('input[name="fee_ack"]').check();
    await recruiter.getByRole("button", { name: "Accept proposal and start recruiting" }).click();
    await expect(recruiter.getByRole("heading", { name: "Your hiring request is confirmed." })).toBeVisible({ timeout: 30_000 });

    const lead = await single(await admin.from("lead_intake").select("job_id,client_id,crm_stage").eq("id",fixture.leadId).single(),"accepted lead");
    expect(lead.crm_stage).toBe("won");
    expect(lead.client_id).toBe(clientId);
    const jobId = String(lead.job_id);
    const jobPage = `/workspace/recruiter/roles/${jobId}`;
    const clientCandidates = `/workspace/client/candidates?role=${jobId}`;

    // The paid candidate-access gate must reject arbitrary paid flags.
    await recruiter.goto(jobPage);
    await expect(recruiter.getByText("Keep this shortlist internal for now.")).toBeVisible();
    await expect(recruiter.getByRole("button", { name: /^Send \d+ to client$/ })).toHaveCount(0);
    const { error: fakePaidError } = await admin.from("job_candidate_access").upsert({
      job_id: jobId, access_status: "paid", access_fee: 25, payment_reference: crypto.randomUUID(),
    }, { onConflict: "job_id" });
    expect(fakePaidError).not.toBeNull();
    const { data: stillLocked } = await admin.from("job_candidate_access").select("access_status").eq("job_id",jobId).maybeSingle();
    expect(stillLocked?.access_status).not.toBe("paid");

    // The only synthetic payment in this test lives in a local-only database.
    // It is deliberately recorded as a settled *manual test fixture*, NOT a
    // production charge or a test of real payment provider webhooks.
    const payment = await single(await admin.from("payments").insert({
      job_id: jobId,
      client_id: clientId,
      created_by: recruiterId,
      description: "LOCAL E2E FIXTURE - synthetic candidate access settlement, no money moved",
      amount_total: 25,
      currency: "usd",
      provider: "manual",
      status: "paid",
      paid_at: new Date().toISOString(),
    }).select("id").single(),"synthetic payment fixture");
    const { error: accessError } = await admin.from("job_candidate_access").upsert({
      job_id: jobId,
      access_status: "paid",
      access_fee: 25,
      payment_reference: payment.id,
      unlocked_by: recruiterId,
      unlocked_at: new Date().toISOString(),
      notes: "LOCAL E2E ONLY - not a real payment",
    }, { onConflict: "job_id" });
    expect(accessError).toBeNull();

    const approved = await single(await admin.from("va_vetting").select("stage").eq("va_id",vaId).single(),"VA vetting");
    expect(approved.stage).toBe("approved");
    await recruiter.goto(jobPage);
    const candidateCheckbox = recruiter.locator(`input[name="va_id"][value="${vaId}"]`);
    await expect(candidateCheckbox).toBeVisible();
    if (!await candidateCheckbox.isChecked()) await candidateCheckbox.check();
    await recruiter.getByRole("button", { name: "Send 1 to client" }).click();
    await expect(recruiter).toHaveURL(/shortlist_released=1/);
    const shortlisted = await single(await admin.from("job_shortlist_candidates")
      .select("id,shortlist_status,created_by").eq("job_id",jobId).eq("va_id",vaId).single(),"client shortlist");
    expect(shortlisted.shortlist_status).toBe("released");
    expect(shortlisted.created_by).toBe(recruiterId);

    // Real client decision action creates the interview request once.
    await login(client, "client.e2e@example.test", clientCandidates);
    await expect(client.getByRole("heading", { name: "Hiring Room" })).toBeVisible();
    await client.getByRole("button", { name: "Request interview" }).click();
    await expect(client).toHaveURL(/decision_saved=1/);
    const request = await single(await admin.from("candidate_interviews")
      .select("id,status,client_id,shortlist_candidate_id").eq("job_id",jobId).eq("va_id",vaId).single(),"interview request");
    expect(request.status).toBe("requested");
    expect(request.client_id).toBe(clientId);
    expect(request.shortlist_candidate_id).toBe(shortlisted.id);

    // External Google Calendar/Meet cannot be called in isolated CI.
    // Simulate ONLY that provider boundary with an already-ended fictional
    // scheduled meeting; do not claim live Calendar integration was verified.
    const { error: calendarFixtureError } = await admin.from("candidate_interviews").update({
      status: "scheduled",
      scheduled_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 30,
      timezone: "Asia/Manila",
      meeting_provider: "google_meet",
      calendar_event_id: "local-e2e-calendar-fixture",
      meeting_url: "https://example.test/local-only-interview-fixture",
    }).eq("id",request.id);
    expect(calendarFixtureError).toBeNull();

    // Real client decision, not a direct DB write: Proceed unlocks offer prep.
    await client.goto("/workspace/client/interviews");
    await expect(client.getByRole("button", { name: "Save interview decision" })).toBeVisible();
    await client.locator('select[name="decision"]').selectOption("proceed");
    await client.getByRole("button", { name: "Save interview decision" }).click();
    await expect(client).toHaveURL(/feedback_saved=1/);
    const reviewed = await single(await admin.from("candidate_interviews")
      .select("status,client_decision,completed_at").eq("id",request.id).single(),"interview decision");
    expect(reviewed.status).toBe("completed");
    expect(reviewed.client_decision).toBe("proceed");
    expect(reviewed.completed_at).toBeTruthy();

    await recruiter.goto(jobPage + "#interviews");
    const offerForm = recruiter.locator("form.role-offer-form");
    await expect(offerForm.getByRole("button", { name: "Prepare placement offer" })).toBeVisible();
    await offerForm.locator('input[name="hourly_rate"]').fill("8");
    await offerForm.locator('input[name="weekly_hours"]').fill("40");
    await offerForm.locator('input[name="start_date"]').fill(new Date(Date.now() + 5 * 86400_000).toISOString().slice(0,10));
    await offerForm.locator('input[name="schedule"]').fill("Monday-Friday, 9:00 AM-5:00 PM Asia/Manila");
    await offerForm.getByRole("button", { name: "Prepare placement offer" }).click();
    await expect(recruiter).toHaveURL(/offer_sent=1/);
    const offer = await single(await admin.from("placement_offers")
      .select("id,status,va_id,client_id").eq("job_id",jobId).single(),"placement offer");
    expect(offer.status).toBe("pending_va");
    expect(offer.va_id).toBe(vaId);
    expect(offer.client_id).toBe(clientId);

    // Real two-sided acceptance actions: VA first, then the employer.
    await login(va, "va.e2e@example.test", "/workspace/va/offers");
    await va.getByRole("button", { name: "Accept final terms" }).click();
    await expect(va).toHaveURL(/accepted=1/);
    const vaAccepted = await single(await admin.from("placement_offers").select("status,va_accepted_at").eq("id",offer.id).single(),"VA offer acceptance");
    expect(vaAccepted.status).toBe("pending_client");
    expect(vaAccepted.va_accepted_at).toBeTruthy();

    await client.goto("/workspace/client/offers");
    await expect(client.getByRole("button", { name: "Confirm placement" })).toBeVisible();
    await client.locator('input[name="confirm_terms"]').check();
    await client.getByRole("button", { name: "Confirm placement" }).click();
    await expect(client).toHaveURL(/confirmed=1/);

    const [finalOffer, job, workrooms, applications] = await Promise.all([
      single(await admin.from("placement_offers").select("status,client_confirmed_at").eq("id",offer.id).single(),"final placement offer"),
      single(await admin.from("jobs").select("status").eq("id",jobId).single(),"filled role"),
      admin.from("workrooms").select("id,status,job_id,client_id,va_id").eq("job_id",jobId),
      admin.from("applications").select("status").eq("job_id",jobId).eq("va_id",vaId),
    ]);
    expect(finalOffer.status).toBe("accepted");
    expect(finalOffer.client_confirmed_at).toBeTruthy();
    expect(job.status).toBe("closed");
    expect(workrooms.error).toBeNull();
    expect(workrooms.data).toHaveLength(1);
    expect(workrooms.data?.[0]).toMatchObject({status:"active",job_id:jobId,client_id:clientId,va_id:vaId});
    expect(applications.error).toBeNull();
    expect(applications.data?.some(a=>a.status==="hired")).toBe(true);

    // The accepted offer cannot be confirmed twice, and only one workroom
    // should exist. The source of truth is the server's final state.
    await client.reload();
    await expect(client.getByRole("button", { name: "Confirm placement" })).toHaveCount(0);
    await expect(client.getByText("Placement active.")).toBeVisible();
  } finally {
    await Promise.all([recruiterContext.close(),clientContext.close(),vaContext.close()]);
  }
});
