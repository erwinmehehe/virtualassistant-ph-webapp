import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { disposableLoginHeaders } from "./disposable-login-isolation";

// Isolated-only certificate recovery acceptance. Never create awards or users
// in a hosted Supabase database; every credential here is completely fictional.
const PASSWORD = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";
const ACCOUNT = "/workspace/training/account";
const OUTPUT = "artifacts/training-certificate-recipient-repair";

function loopback(raw: string | undefined): boolean {
  try {
    const url = new URL(raw || "");
    return url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch { return false; }
}

async function login(page: Page, email: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(ACCOUNT));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  await expect(page).toHaveURL((url) => url.pathname === ACCOUNT, { timeout: 30000 });
}

test.describe("Legacy unnamed certificate — verified learner claim", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!loopback(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    !loopback(process.env.E2E_BASE_URL || "http://127.0.0.1:3000"),
    "Never create fictional certificates in a hosted project");
  test.setTimeout(180000);

  let admin: SupabaseClient;
  let userId = "";
  let credentialCode = "";
  let email = "";
  let originalIssueDate = "";

  test.beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!loopback(url) || !key) throw new Error("Disposable Supabase required");
    admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: course, error: courseError } = await admin.from("training_courses")
      .select("id").eq("slug", "virtual-assistant-foundations").eq("status", "published").single();
    if (courseError || !course) throw courseError || new Error("Test training course not found");

    email = "legacy-recipient-" + randomUUID().slice(0, 12) + "@example.test";
    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: { role: "va", full_name: "Unverified Display Alias" },
      app_metadata: { account_type: "training" },
    });
    if (userError || !created.user) throw userError || new Error("Cannot create disposable learner");
    userId = created.user.id;
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId, role: "va", full_name: "Unverified Display Alias",
      account_status: "active", email_verified: true,
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    credentialCode = "VAT-" + randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    originalIssueDate = new Date("2026-10-11T09:11:43Z").toISOString();
    const { error: certificateError } = await admin.from("training_certificates").insert({
      user_id: userId,
      course_id: course.id,
      credential_code: credentialCode,
      issued_at: originalIssueDate,
      metadata: { credential_type: "certificate_of_completion", public_profile_visible: false },
    });
    if (certificateError) throw certificateError;
    await mkdir(OUTPUT, { recursive: true });
  });

  test.afterAll(async () => {
    if (!admin || !loopback(process.env.NEXT_PUBLIC_SUPABASE_URL)) return;
    if (userId) {
      await admin.from("training_certificates").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("name is absent publicly until signed-in account confirms and explicitly claims it", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: disposableLoginHeaders(57) });
    try {
      const page = await context.newPage();
      const credentialPath = "/training/certificates/" + credentialCode;

      await page.goto(credentialPath);
      await expect(page.getByText("Recipient name pending confirmation", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Print" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Confirm certificate name/ })).toBeVisible();
      await expect(page.getByText("Unverified Display Alias")).toHaveCount(0);

      await login(page, email);
      await expect(page.getByText("Not confirmed", { exact: true })).toBeVisible();
      await expect(page.getByText(credentialCode)).toBeVisible();
      await expect(page.getByRole("button", { name: "Add name to certificate" })).toHaveCount(0);

      await page.getByLabel("Full name to print on certificates").fill("Verified Fictional Learner");
      await page.getByRole("checkbox", { name: /I confirm this is the name I want/ }).check();
      await page.getByRole("button", { name: "Confirm certificate name" }).click();
      await expect(page.getByText("Verified Fictional Learner", { exact: true }).first()).toBeVisible();

      // Confirmation alone never silently edits a credential issued earlier.
      const { data: beforeClaim } = await admin.from("training_certificates")
        .select("metadata").eq("credential_code", credentialCode).single();
      expect((beforeClaim?.metadata as Record<string, unknown>)?.recipient_name).toBeUndefined();

      await page.getByRole("checkbox", { name: /I want to add my confirmed name to this unnamed certificate/i }).check();
      await page.getByRole("button", { name: "Add name to certificate" }).click();
      await expect(page.getByText(/Your confirmed name was added to the existing certificate/)).toBeVisible();

      const { data: certificate, error } = await admin.from("training_certificates")
        .select("metadata,credential_code,issued_at").eq("credential_code", credentialCode).single();
      expect(error).toBeNull();
      expect(certificate?.credential_code).toBe(credentialCode);
      expect(new Date(certificate!.issued_at).toISOString()).toBe(originalIssueDate);
      const metadata = certificate?.metadata as Record<string, unknown>;
      expect(metadata.recipient_name).toBe("Verified Fictional Learner");
      expect(metadata.recipient_name_source).toBe("learner_confirmed_legacy_missing_name");
      expect(metadata.recipient_name_corrections).toBeUndefined();

      await page.goto(credentialPath);
      await expect(page.locator(".certificate-recipient")).toHaveText("Verified Fictional Learner");
      await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
      await expect(page.getByText("Recipient name pending confirmation", { exact: true })).toHaveCount(0);
      await page.screenshot({ path: OUTPUT + "/named-certificate-desktop.png", fullPage: true, animations: "disabled" });
      await page.setViewportSize({ width: 390, height: 844 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
      await page.screenshot({ path: OUTPUT + "/named-certificate-mobile.png", fullPage: true, animations: "disabled" });
    } finally {
      await context.close();
    }
  });
});
