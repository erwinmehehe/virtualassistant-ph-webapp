import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Runs only as a dedicated, Turnstile-enabled step in Browser and database
// contracts. The ordinary all-role suite continues to use disabled Turnstile.
const ENABLED = process.env.VAPH_AUTH_GATE === "true";
const PASSWORD = process.env.E2E_PASSWORD || "";
const TRAINING = "/workspace/training";
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

function requireIsolatedAuthGate() {
  if (!ENABLED) return;
  const urls = [
    ["E2E_BASE_URL", process.env.E2E_BASE_URL],
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL],
  ] as const;
  for (const [name, value] of urls) {
    if (!value) throw new Error(name + " is required for the isolated authentication gate.");
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)) {
      throw new Error("Refusing to run auth gate against a remote service: " + name);
    }
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !PASSWORD) {
    throw new Error("Isolated Supabase credentials and E2E_PASSWORD are required.");
  }
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== TEST_SITE_KEY ||
      process.env.TURNSTILE_SECRET_KEY !== TEST_SECRET_KEY ||
      process.env.VERCEL_ENV === "production") {
    throw new Error("Use Cloudflare's official test keys, never production keys, in this gate.");
  }
}

test.describe("isolated Turnstile authentication release gate", () => {
  // Never silently mark the dedicated release gate green when the step is
  // misconfigured. The standard all-role suite may skip it explicitly.
  test.skip(!ENABLED, "Runs in the dedicated isolated Turnstile-enabled CI step.");
  test.describe.configure({ mode: "serial" });
  requireIsolatedAuthGate();

  let admin: ReturnType<typeof createClient>;
  let learnerId = "";
  let learnerEmail = "";

  test.beforeAll(async () => {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    learnerEmail = "auth-gate-" + Date.now() + "@example.test";
    const { data, error } = await admin.auth.admin.createUser({
      email: learnerEmail,
      password: PASSWORD,
      email_confirm: false,
      user_metadata: { full_name: "Disposable Training Learner", role: "va" },
      app_metadata: { account_type: "training" },
    });
    if (error || !data.user) throw error || new Error("Could not create disposable training learner.");
    learnerId = data.user.id;
  });

  test.afterAll(async () => {
    if (learnerId) {
      const { error } = await admin.auth.admin.deleteUser(learnerId);
      if (error) throw error;
    }
  });

  async function expectToken(page: Page, action: string) {
    const widget = page.locator('[data-turnstile-action="' + action + '"]');
    await expect(widget).toBeAttached();
    const field = widget.locator("xpath=..").locator('input[name="cf-turnstile-response"]');
    await expect.poll(async () => (await field.inputValue()).length, { timeout: 25_000 }).toBeGreaterThan(10);
    return field;
  }

  test("signup-to-login client navigation mounts independent security challenges", async ({ page }) => {
    test.setTimeout(180_000); // Local dev compilation plus real server actions can be slow in CI.
    await page.goto("/auth/join/training");
    await expect(page.getByRole("heading", { name: "Create your free training account" })).toBeVisible();
    await expectToken(page, "training_join");

    await page.getByRole("link", { name: /Log in and use the same account/ }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/auth/login" && url.searchParams.get("next") === TRAINING);
    await expect(page.getByRole("heading", { name: "Welcome back to training" })).toBeVisible();
    await expectToken(page, "login");

    await page.getByLabel("Email").fill(learnerEmail);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in to training" }).click();
    await expect(page).toHaveURL(/\/auth\/login\?/);
    await expect(page.locator(".auth-alert")).toContainText("Confirm your email before logging in.");
    await expect(page.locator('form .turnstile-wrap [data-turnstile-action="login"]')).toBeAttached();
    await expectToken(page, "resend_confirmation");
    await page.locator('.auth-confirmation-form input[name="email"]').fill(learnerEmail);
    const resendForm = page.locator(".auth-confirmation-form");
    // Check browser-native validity before submitting. Playwright click() alone
    // does not prove a form submitted if HTML validation prevents dispatch.
    expect(await resendForm.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(true);
    // A ready challenge does not prove React dispatched the server action.
    // Observe the POST rather than extending a wait for a possibly inert click.
    // The request is to the local login page only; never record submitted data.
    // Diagnose the actual browser submission without recording credentials
    // or challenge tokens. A successful click alone does not prove submit.
    const localPosts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && new URL(request.url()).hostname === "127.0.0.1") {
        localPosts.push(new URL(request.url()).pathname);
      }
    });
    await resendForm.evaluate((form) => {
      (window as Window & { __resendSubmitCount?: number; __resendInvalidNames?: string[] }).__resendSubmitCount = 0;
      (window as Window & { __resendInvalidNames?: string[] }).__resendInvalidNames = [];
      form.addEventListener("submit", () => {
        (window as Window & { __resendSubmitCount?: number }).__resendSubmitCount! += 1;
      }, true);
      form.addEventListener("invalid", (event) => {
        const invalid = event.target as HTMLInputElement;
        (window as Window & { __resendInvalidNames?: string[] }).__resendInvalidNames!.push(invalid.name || "unnamed");
      }, true);
    });
    const resendRequest = page.waitForRequest(
      (request) => request.method() === "POST" && new URL(request.url()).hostname === "127.0.0.1",
      { timeout: 30_000 },
    );
    await resendForm.locator('button[type="submit"]').click();
    try {
      const dispatched = await resendRequest;
      expect(new URL(dispatched.url()).pathname).toBe("/auth/login");
    } catch {
      const state = await resendForm.evaluate((form) => {
        const win = window as Window & { __resendSubmitCount?: number; __resendInvalidNames?: string[] };
        const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        return {
          submitted: win.__resendSubmitCount || 0,
          invalidNames: win.__resendInvalidNames || [],
          currentlyValid: (form as HTMLFormElement).checkValidity(),
          buttonIsAssociated: button?.form === form,
          buttonDisabled: button?.disabled,
          actionIsBound: form.hasAttribute("action"),
        };
      });
      throw new Error("Resend did not issue a loopback POST; safe form diagnostics: " + JSON.stringify(state) +
        "; POST paths: " + JSON.stringify(localPosts));
    }
    // The earlier unconfirmed-login URL already has confirm=1/next. Await the
    // *new server-action result* visible to learners and retain next intent,
    // rather than wait for a full document 'load' during an RSC redirect.
    // The distinct banner prevents a stale login error from counting as success.
    await expect.poll(async () => {
      const url = new URL(page.url());
      return {
        onLogin: url.pathname === "/auth/login",
        confirmation: url.searchParams.get("confirm") === "1",
        trainingIntent: url.searchParams.get("next") === TRAINING,
        hasMessage: Boolean(url.searchParams.get("message")),
        hasError: url.searchParams.has("error"),
        visibleSuccess: await page.locator(".success-banner").isVisible(),
        staleAlert: await page.locator(".auth-alert").count() > 0,
      };
    }, { timeout: 90_000 }).toEqual({
      onLogin: true,
      confirmation: true,
      trainingIntent: true,
      hasMessage: true,
      hasError: false,
      visibleSuccess: true,
      staleAlert: false,
    });
    await expect(page.locator(".success-banner")).toContainText("If that account still needs confirmation");
  });

  test("email confirmation activates disposable learner and reaches training", async ({ page }) => {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: learnerEmail,
      options: { redirectTo: process.env.NEXT_PUBLIC_APP_URL },
    });
    if (error || !data.properties?.hashed_token) {
      throw error || new Error("Local Supabase did not issue a sandbox confirmation token.");
    }
    const params = new URLSearchParams({
      token_hash: data.properties.hashed_token,
      type: "magiclink",
      next: TRAINING,
    });
    const browserOrigin = new URL(process.env.E2E_BASE_URL!).origin;
    await page.goto("/auth/confirm?" + params.toString());
    // Host-only Supabase session cookies are lost if the confirmation handler
    // silently switches from 127.0.0.1 to localhost during its redirect.
    await expect(page).toHaveURL(
      (url) => url.origin === browserOrigin && url.pathname === TRAINING,
      { timeout: 30_000 },
    );

    const { data: verified, error: lookupError } = await admin.auth.admin.getUserById(learnerId);
    if (lookupError) throw lookupError;
    expect(verified.user?.email_confirmed_at).toBeTruthy();
  });

  test("failed password followed by valid password keeps training intent and refreshes security check", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fworkspace%2Ftraining");
    await expectToken(page, "login");
    await page.getByLabel("Email").fill(learnerEmail);
    await page.getByLabel("Password").fill("Wrong-but-valid-length123!");
    await page.getByRole("button", { name: "Log in to training" }).click();

    await expect(page).toHaveURL((url) => url.pathname === "/auth/login" && url.searchParams.get("next") === TRAINING);
    await expect(page.locator(".auth-alert")).toContainText("Email or password is incorrect.");
    await expectToken(page, "login");

    await page.getByLabel("Email").fill(learnerEmail);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in to training" }).click();
    await expect(page).toHaveURL((url) => url.pathname === TRAINING, { timeout: 30_000 });
    await expect(page.getByRole("navigation", { name: /Training|Workspace/ }).first()).toBeVisible();
  });

  test("password reset uses a fresh protected challenge and non-enumerating response", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fworkspace%2Ftraining");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/auth\/forgot$/);
    await expectToken(page, "password_reset");
    await page.getByLabel("Email").fill("unknown-recovery-gate@example.test");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page).toHaveURL(/\/auth\/login\?message=/, { timeout: 30_000 });
    await expect(page.locator(".success-banner")).toContainText("If that email exists");
  });

  test("missing verification token is rejected without losing training destination", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fworkspace%2Ftraining");
    const tokenField = await expectToken(page, "login");
    await page.getByLabel("Email").fill(learnerEmail);
    await page.getByLabel("Password").fill(PASSWORD);
    // Exercise the real server gate with an absent token, not a mocked action.
    await tokenField.evaluate((input) => input.remove());
    await page.getByRole("button", { name: "Log in to training" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/auth/login" && url.searchParams.get("next") === TRAINING);
    await expect(page.locator(".auth-alert")).toContainText("Please complete the security check");
    await expectToken(page, "login");
  });
});
