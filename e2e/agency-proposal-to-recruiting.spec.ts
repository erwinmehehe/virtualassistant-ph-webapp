import { expect, test, type Browser, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type Fixture = { leadId: string; proposalId: string; token: string; company: string };
type Fixtures = Record<"approved0" | "approved1" | "changes0" | "changes1", Fixture>;

function localOnlyEnv() {
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const browserUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !key) throw new Error("Local E2E Supabase credentials are missing");
  for (const value of [dbUrl, browserUrl]) {
    const host = new URL(value).hostname;
    if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
      throw new Error("The hiring E2E suite refuses remote or production services");
    }
  }
  return { dbUrl, key };
}

async function fixtures(): Promise<Fixtures> {
  return JSON.parse(await readFile(".e2e-hiring-fixtures.json", "utf8")) as Fixtures;
}

async function login(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD || "E2e-Only!Pass12345");
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

test("isolated employer proposal acceptance creates a linked recruiting role and client access", async ({ browser }: { browser: Browser }, testInfo) => {
  const { dbUrl, key } = localOnlyEnv();
  const fixture = (await fixtures())[testInfo.retry > 0 ? "approved1" : "approved0"];
  const admin = createClient(dbUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const recruiterContext = await browser.newContext();
  const clientContext = await browser.newContext();
  try {
    const recruiter = await recruiterContext.newPage();
    await login(recruiter, "recruiter.e2e@example.test", "/workspace/recruiter/today");

    await recruiter.goto(`/workspace/recruiter/crm/${fixture.leadId}/discovery`);
    await expect(recruiter.getByText("Discovery Workspace", { exact: true }).first()).toBeVisible();

    await recruiter.goto(`/workspace/recruiter/crm/${fixture.leadId}/proposal`);
    await expect(recruiter.getByText("Proposal status")).toBeVisible();
    await expect(recruiter.getByRole("heading", { name: new RegExp(fixture.company) })).toBeVisible();

    // The token is a LOCAL fixture. The real public proposal acceptance action
    // invokes the atomic database handoff and must be idempotent.
    await recruiter.goto(`/proposal/${fixture.token}`);
    await expect(recruiter.getByRole("heading", { name: "Approve and start recruiting" })).toBeVisible();
    await recruiter.locator('input[name="acceptance_name"]').fill("E2E Client");
    await recruiter.locator('input[name="fee_ack"]').check();
    await recruiter.getByRole("button", { name: "Accept proposal and start recruiting" }).click();
    await expect(recruiter.getByRole("heading", { name: "Your hiring request is confirmed." })).toBeVisible({ timeout: 30_000 });

    const [{ data: proposal, error: proposalError }, { data: lead, error: leadError }] = await Promise.all([
      admin.from("lead_proposals").select("id,status,accepted_at,job_id").eq("id", fixture.proposalId).single(),
      admin.from("lead_intake").select("id,crm_stage,client_id,job_id").eq("id", fixture.leadId).single(),
    ]);
    expect(proposalError).toBeNull();
    expect(leadError).toBeNull();
    expect(proposal?.status).toBe("accepted");
    expect(proposal?.accepted_at).toBeTruthy();
    expect(lead?.crm_stage).toBe("won");
    expect(lead?.client_id).toBeTruthy();
    expect(lead?.job_id).toBeTruthy();

    const jobId = String(lead?.job_id);
    const [{ data: job, error: jobError }, { data: commercials, error: commercialError }, { count, error: countError }] = await Promise.all([
      admin.from("jobs").select("id,lead_id,client_id,title,status").eq("id", jobId).single(),
      admin.from("job_commercials").select("commercial_status,service_model").eq("job_id", jobId).single(),
      admin.from("jobs").select("id", { count: "exact", head: true }).eq("lead_id", fixture.leadId),
    ]);
    expect(jobError).toBeNull();
    expect(commercialError).toBeNull();
    expect(countError).toBeNull();
    expect(job?.status).toBe("published");
    expect(job?.client_id).toBe(lead?.client_id);
    // The acceptance must attach to the existing E2E client identity, not
    // create a duplicate client with the same email.
    const { data: clientAuth, error: authLookupError } = await admin.auth.admin.listUsers({page:1,perPage:100});
    expect(authLookupError).toBeNull();
    expect(lead?.client_id).toBe(clientAuth.users.find(user => user.email === "client.e2e@example.test")?.id);
    expect(job?.lead_id).toBe(fixture.leadId);
    expect(commercials?.commercial_status).toBe("accepted");
    expect(count).toBe(1);

    await recruiter.reload();
    await expect(recruiter.getByRole("heading", { name: "Your hiring request is confirmed." })).toBeVisible();
    await expect(recruiter.getByRole("button", { name: "Accept proposal and start recruiting" })).toHaveCount(0);

    await recruiter.goto(`/workspace/recruiter/crm/${fixture.leadId}/proposal`);
    await expect(recruiter.getByText("Proposal status")).toBeVisible();
    await expect(recruiter.getByText("Accepted", { exact: true }).first()).toBeVisible();

    const client = await clientContext.newPage();
    await login(client, "client.e2e@example.test", `/workspace/client/jobs/${jobId}`);
    await expect(client.getByRole("heading", { name: "E2E Administrative Virtual Assistant" })).toBeVisible();
    await expect(client.getByText("Recruiting", { exact: true }).first()).toBeVisible();
  } finally {
    await Promise.all([recruiterContext.close(), clientContext.close()]);
  }
});

test("isolated client can request proposal changes without creating a recruiting role", async ({ page }, testInfo) => {
  const { dbUrl, key } = localOnlyEnv();
  const fixture = (await fixtures())[testInfo.retry > 0 ? "changes1" : "changes0"];
  const admin = createClient(dbUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });

  await page.goto(`/proposal/${fixture.token}`);
  await expect(page.getByRole("heading", { name: "Need something changed?" })).toBeVisible();
  await page.locator('textarea[name="reason"]').fill("Please change the planned weekly hours before we approve.");
  await page.getByRole("button", { name: "Request changes" }).click();
  await expect(page.getByRole("heading", { name: "Your recruiter has your feedback." })).toBeVisible();

  const [{ data: proposal, error: proposalError }, { data: lead, error: leadError }, { count, error: countError }] = await Promise.all([
    admin.from("lead_proposals").select("status,changes_requested_at").eq("id", fixture.proposalId).single(),
    admin.from("lead_intake").select("crm_stage,job_id").eq("id", fixture.leadId).single(),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("lead_id", fixture.leadId),
  ]);
  expect(proposalError).toBeNull();
  expect(leadError).toBeNull();
  expect(countError).toBeNull();
  expect(proposal?.status).toBe("changes_requested");
  expect(proposal?.changes_requested_at).toBeTruthy();
  expect(lead?.crm_stage).not.toBe("won");
  expect(lead?.job_id).toBeNull();
  expect(count).toBe(0);
});
