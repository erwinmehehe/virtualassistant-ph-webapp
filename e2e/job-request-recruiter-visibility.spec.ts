import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("a private submitted job request is visible to recruiters but never public", async ({ page }) => {
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  // This acceptance journey can ONLY write to the isolated local E2E database.
  if (!api || !["127.0.0.1", "localhost"].includes(new URL(api).hostname) || !serviceKey) {
    throw new Error("Job request acceptance requires the isolated local Supabase environment.");
  }
  const admin = createClient(api, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [{ data: recruiter, error: recruiterError }, { data: client, error: clientError }] = await Promise.all([
    admin.from("profiles").select("id").eq("role", "recruiter").eq("full_name", "E2E Recruiter").single(),
    admin.from("profiles").select("id").eq("role", "client").eq("full_name", "E2E Client").single(),
  ]);
  if (recruiterError || !recruiter || clientError || !client) {
    throw recruiterError || clientError || new Error("Synthetic test accounts must be seeded.");
  }

  const title = "E2E Pending VA Request " + crypto.randomUUID().slice(0, 8);
  const { data: request, error: createError } = await admin.from("jobs").insert({
    client_id: client.id,
    recruiter_id: recruiter.id,
    title,
    company_name: "E2E Test Company",
    status: "pending",
    summary: "Help a fictional business manage email and calendar requests.",
    responsibilities: ["Organize the shared inbox", "Handle approved calendar bookings"],
    categories: ["Administrative Support"],
    required_skills: ["Inbox Management"],
    hours_per_week: 20,
    min_hourly_rate: 8,
    timezone: "Asia/Manila",
    service_model: "curated_placement",
  }).select("id,status").single();
  if (createError || !request) throw createError || new Error("Could not seed synthetic request.");

  try {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Virtual Assistant Jobs Philippines" })).toBeVisible();
    await expect(page.getByText(title)).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/auth/login?next=%2Fworkspace%2Frecruiter%2Ftoday");
    await page.getByLabel("Email").fill("recruiter.e2e@example.test");
    await page.getByLabel("Password").fill(process.env.E2E_PASSWORD || "E2e-Only!Pass12345");
    await page.getByRole("button", { name: /^Log in$/ }).click();
    await expect(page).toHaveURL(/\/workspace\/recruiter\/today/);

    const requests = page.getByRole("region", { name: "Job requests awaiting review" });
    await expect(requests).toBeVisible();
    await expect(requests.getByText(title)).toBeVisible();
    await expect(requests.locator(`a[href="/workspace/recruiter/roles/${request.id}#overview"]`)).toBeVisible();

    await page.goto("/workspace/recruiter/roles?view=requests&sort=oldest");
    const requestLink = page.locator(`a[href="/workspace/recruiter/roles/${request.id}#overview"]`);
    await expect(requestLink).toBeVisible();
    await expect(requestLink.getByText(title)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await requestLink.click();
    await expect(page).toHaveURL(new RegExp(`/workspace/recruiter/roles/${request.id}#overview$`));
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  } finally {
    const { error: cleanupError } = await admin.from("jobs").delete().eq("id", request.id);
    if (cleanupError) throw cleanupError;
  }
});
