import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

// PR #919 real-action acceptance. Every account, chat, flag, audit entry, and
// rate-limit counter in this suite belongs to a disposable loopback Supabase.
// This NEVER sends messages, changes bans, or creates users in production.
const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const DB = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PASS = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";
const OUTPUT = "artifacts/chat-auth-uat";
type Scenario = "burst" | "repeat" | "hour" | "ban";
type Client = { email: string; id: string; threadId?: string };
type State = Awaited<ReturnType<BrowserContext["storageState"]>>;

function loopback(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function login(page: Page, email: string, destination: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(destination), { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASS);
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  await expect(page).toHaveURL((url) => url.pathname === destination, { timeout: 30000 });
}

async function postChat(page: Page, route: string, message: string, alter?: (page: Page) => Promise<void>, afterFill?: (page: Page) => Promise<void>) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator('textarea[name="body"]')).toBeVisible();
  if (alter) await alter(page);
  await page.locator('textarea[name="body"]').fill(message);
  // Hidden React form values can be restored during the preceding input event.
  // For ownership probes, tamper AFTER filling and inspect real submitted form data.
  if (afterFill) await afterFill(page);
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname === new URL(route, BASE).pathname,
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: /^Send$/ }).click(),
  ]);

  // A response to a Next.js Server Action can arrive before its client-side
  // redirect and RSC refresh finish. Without waiting, the next page.goto in
  // this burst test races the preceding ?sent=1 navigation and flakes.
  // Only successful sends should redirect; rejected/blocked submissions must
  // remain subject to the existing database-count and rate-limit assertions.
  if (response.status() >= 200 && response.status() < 400) {
    const expectedPath = new URL(route, BASE).pathname;
    await expect(page).toHaveURL(
      (url) => url.pathname === expectedPath && url.searchParams.get("sent") === "1",
      { timeout: 30000 },
    );
    // Verify the refreshed server-owned transcript, not just the URL. This
    // prevents a later send from interrupting the previous redirect.
    await expect(page.locator('textarea[name="body"]')).toBeVisible();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
  }
  return response.status();
}

test.describe("PR #919 real chat and Auth-ban acceptance with isolated test identities", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    !loopback(BASE) || !loopback(DB),
    "Refusing to test against any hosted app, hosted Supabase, or production users.",
  );

  let admin: SupabaseClient;
  const clients = {} as Record<Scenario, Client>;
  const state = new Map<string, State>();
  const evidence: Array<{ case: string; result: "passed" }> = [];
  let recruiterId = "";

  const fromClient = (key: Scenario) => state.get(clients[key].email)!;

  async function withPage(browser: Browser, saved: State, task: (page: Page) => Promise<void>) {
    const context = await browser.newContext({ baseURL: BASE, storageState: saved });
    try {
      await task(await context.newPage());
    } finally {
      await context.close();
    }
  }

  async function messageCount(key: Scenario) {
    const { data, error } = await admin.from("client_recruiter_messages")
      .select("id").eq("thread_id", clients[key].threadId!);
    if (error) throw error;
    return data?.length || 0;
  }

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240000);
    if (!loopback(BASE) || !loopback(DB)) throw new Error("Loopback-only guard failed");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceKey) throw new Error("No disposable Supabase service credential");
    admin = createClient(DB, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Existing scripted E2E recruiter/admin are owned by the disposable seed script.
    const [{ data: recruiters }, { data: administrators }] = await Promise.all([
      admin.from("profiles").select("id").eq("role", "recruiter").eq("full_name", "E2E Recruiter").limit(1),
      admin.from("profiles").select("id").eq("role", "admin").eq("full_name", "E2E Admin").limit(1),
    ]);
    recruiterId = recruiters?.[0]?.id || "";
    const administratorId = administrators?.[0]?.id || "";
    if (!recruiterId || !administratorId) throw new Error("Missing seeded local recruiter/admin");

    const batch = String(Date.now());
    for (const kind of ["burst", "repeat", "hour", "ban"] as Scenario[]) {
      const email = "pr919-" + kind + "-" + batch + "@example.test";
      const fullName = kind === "ban" ? "E2E Auth Ban Target" : "E2E " + kind + " Client";
      const { data: auth, error: createError } = await admin.auth.admin.createUser({
        email, password: PASS, email_confirm: true,
        user_metadata: { role: "client", full_name: fullName },
      });
      if (createError || !auth.user) throw createError || new Error("Cannot create disposable client");
      clients[kind] = { email, id: auth.user.id };

      const { error: profileError } = await admin.from("profiles").upsert({
        id: auth.user.id,
        role: "client",
        full_name: fullName,
        account_status: kind === "ban" ? "banned" : "active",
        email_verified: true,
        ...(kind === "ban" ? {
          banned_at: new Date().toISOString(),
          banned_reason: "Disposable local UAT account",
          banned_by: administratorId,
        } : {}),
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      if (kind !== "ban") {
        const { error: companyError } = await admin.from("client_profiles").upsert({
          user_id: auth.user.id,
          company_name: "Disposable Fictional Company",
          timezone: "Asia/Manila",
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (companyError) throw companyError;
      }
    }

    // Sign in through the real app once, then reuse browser cookie states.
    for (const kind of ["burst", "repeat", "hour"] as Scenario[]) {
      const context = await browser.newContext({ baseURL: BASE });
      try {
        const page = await context.newPage();
        await login(page, clients[kind].email, "/workspace/client/messages");
        // The login URL can change before the destination Server Component finishes.
        // Its chat form renders only after the database thread has been created.
        await expect(page.locator('textarea[name="body"]')).toBeVisible({ timeout: 30000 });
        const { data: thread, error } = await admin.from("client_recruiter_threads")
          .select("id").eq("client_id", clients[kind].id).is("job_id", null).single();
        if (error || !thread) throw error || new Error("Synthetic client thread missing");
        clients[kind].threadId = thread.id;
        const { error: assignError } = await admin.from("client_recruiter_threads")
          .update({ recruiter_id: recruiterId }).eq("id", thread.id);
        if (assignError) throw assignError;
        state.set(clients[kind].email, await context.storageState());
      } finally {
        await context.close();
      }
    }
    const context = await browser.newContext({ baseURL: BASE });
    try {
      const page = await context.newPage();
      await login(page, "admin.e2e@example.test", "/workspace/admin/moderation");
      state.set("admin", await context.storageState());
    } finally {
      await context.close();
    }
    const recruiterContext = await browser.newContext({ baseURL: BASE });
    try {
      const page = await recruiterContext.newPage();
      await login(page, "recruiter.e2e@example.test", "/workspace/recruiter/messages");
      state.set("recruiter", await recruiterContext.storageState());
    } finally {
      await recruiterContext.close();
    }
    await mkdir(OUTPUT, { recursive: true });
  });

  test("eighth distinct client message succeeds; ninth is atomically blocked", async ({ browser }) => {
    test.setTimeout(240000);
    await withPage(browser, fromClient("burst"), async (page) => {
      for (let i = 1; i <= 8; i++) {
        await postChat(page, "/workspace/client/messages", "Fake update " + i);
        await expect.poll(() => messageCount("burst")).toBe(i);
      }
      await postChat(page, "/workspace/client/messages", "Fake update 9");
      await expect.poll(() => messageCount("burst")).toBe(8);
      const hash = createHash("sha256").update(clients.burst.id.toLowerCase()).digest("hex");
      const { data, error } = await admin.from("action_rate_limits")
        .select("attempts").eq("action_key", "client_recruiter_chat:client:burst")
        .eq("subject_hash", hash).single();
      if (error) throw error;
      expect(data.attempts).toBe(9);
      evidence.push({ case: "8-per-minute burst enforcement", result: "passed" });
    });
  });

  test("normalizing uppercase and whitespace blocks the third long duplicate", async ({ browser }) => {
    test.setTimeout(120000);
    await withPage(browser, fromClient("repeat"), async (page) => {
      const copies = [
        "Please confirm the fictional handoff at noon.",
        "PLEASE    CONFIRM THE FICTIONAL HANDOFF AT NOON.",
        "please confirm the fictional handoff at noon.",
      ];
      for (let i = 0; i < copies.length; i++) {
        await postChat(page, "/workspace/client/messages", copies[i]);
        await expect.poll(() => messageCount("repeat")).toBe(Math.min(i + 1, 2));
      }
      evidence.push({ case: "normalized duplicate-content throttle", result: "passed" });
    });
  });

  test("hourly counter accepts the fortieth attempt and blocks the forty-first", async ({ browser }) => {
    test.setTimeout(120000);
    const hash = createHash("sha256").update(clients.hour.id.toLowerCase()).digest("hex");
    const { error } = await admin.from("action_rate_limits").insert({
      action_key: "client_recruiter_chat:client:hour",
      subject_hash: hash,
      attempts: 39,
      window_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    await withPage(browser, fromClient("hour"), async (page) => {
      await postChat(page, "/workspace/client/messages", "Fictional hourly forty");
      await expect.poll(() => messageCount("hour")).toBe(1);
      await postChat(page, "/workspace/client/messages", "Fictional hourly forty-one");
      await expect.poll(() => messageCount("hour")).toBe(1);
      const { data, error: readError } = await admin.from("action_rate_limits")
        .select("attempts").eq("action_key", "client_recruiter_chat:client:hour")
        .eq("subject_hash", hash).single();
      if (readError) throw readError;
      expect(data.attempts).toBe(41);
      evidence.push({ case: "40-per-hour boundary enforcement", result: "passed" });
    });
  });

  test("forged conversation and oversize message are rejected before a database write", async ({ browser }) => {
    test.setTimeout(120000);
    await withPage(browser, fromClient("repeat"), async (page) => {
      await postChat(page, "/workspace/client/messages", "Forbidden cross-client thread", undefined, async (p) => {
        const forgedThread = clients.burst.threadId!;
        const actual = await p.locator('input[name="thread_id"]').evaluate((el, id) => {
          const input = el as HTMLInputElement;
          input.value = id;
          return new FormData(input.form!).get("thread_id");
        }, forgedThread);
        expect(actual).toBe(forgedThread);
      });
      await expect.poll(() => messageCount("repeat")).toBe(2);
      const { data: borrowed, error: borrowedError } = await admin.from("client_recruiter_messages")
        .select("id").eq("thread_id", clients.burst.threadId!).eq("sender_id", clients.repeat.id);
      if (borrowedError) throw borrowedError;
      expect(borrowed).toHaveLength(0);

      await postChat(page, "/workspace/client/messages", "x".repeat(4001), async (p) => {
        await p.locator('textarea[name="body"]').evaluate((el) => el.removeAttribute("maxlength"));
      });
      await expect.poll(() => messageCount("repeat")).toBe(2);
      evidence.push({ case: "thread ownership and 4000-character boundary", result: "passed" });
    });
  });

  test("a recruiter can still reply when client sends are rate-limited", async ({ browser }) => {
    test.setTimeout(90000);
    await withPage(browser, state.get("recruiter")!, async (page) => {
      const route = "/workspace/recruiter/messages?thread=" + encodeURIComponent(clients.burst.threadId!);
      await postChat(page, route, "Fictional recruiter reply");
      const { data, error } = await admin.from("client_recruiter_messages")
        .select("id").eq("thread_id", clients.burst.threadId!)
        .eq("sender_id", recruiterId).eq("body", "Fictional recruiter reply");
      if (error) throw error;
      expect(data).toHaveLength(1);
      evidence.push({ case: "independent recruiter reply", result: "passed" });
    });
  });

  test("admin-only Auth ban reconciliation is verified and idempotent, then unban restores both layers", async ({ browser }) => {
    test.setTimeout(180000);
    const targetId = clients.ban.id;
    const { data: initial, error: initialError } = await admin.auth.admin.getUserById(targetId);
    if (initialError) throw initialError;
    expect(initial.user?.banned_until ? Date.parse(initial.user.banned_until) > Date.now() : false).toBe(false);

    await withPage(browser, state.get("admin")!, async (page) => {
      for (let i = 0; i < 2; i++) {
        await page.goto("/workspace/admin/moderation");
        const row = page.locator(".card").filter({ hasText: "E2E Auth Ban Target" });
        await expect(row.getByRole("button", { name: "Verify / retry Auth ban" })).toBeVisible();
        const [response] = await Promise.all([
          page.waitForResponse(
            (r) => r.request().method() === "POST" &&
              new URL(r.url()).pathname === "/workspace/admin/moderation",
            { timeout: 30000 },
          ),
          row.getByRole("button", { name: "Verify / retry Auth ban" }).click(),
        ]);
        expect(response.status()).toBeLessThan(500);
        const { data, error } = await admin.auth.admin.getUserById(targetId);
        if (error) throw error;
        expect(Date.parse(data.user!.banned_until!)).toBeGreaterThan(Date.now());
      }
      // An actual login using an anonymous client must be refused by Supabase Auth.
      // Reading a future banned_until field alone is not sufficient evidence.
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      if (!anonKey) throw new Error("No local anonymous API key");
      const blockedClient = createClient(DB, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: blockedLogin } = await blockedClient.auth.signInWithPassword({
        email: clients.ban.email,
        password: PASS,
      });
      expect(blockedLogin).not.toBeNull();

      const { data: audited, error: auditError } = await admin.from("admin_audit_log")
        .select("action").eq("target_id", targetId).eq("action", "user_auth_ban_reconciled");
      if (auditError) throw auditError;
      expect(audited?.length).toBeGreaterThanOrEqual(2);

      // Restore only the disposable user via the genuine admin action.
      await page.goto("/workspace/admin/moderation");
      const row = page.locator(".card").filter({ hasText: "E2E Auth Ban Target" });
      const [restored] = await Promise.all([
        page.waitForResponse(
          (r) => r.request().method() === "POST" &&
            new URL(r.url()).pathname === "/workspace/admin/moderation",
          { timeout: 30000 },
        ),
        row.getByRole("button", { name: "Restore account" }).click(),
      ]);
      expect(restored.status()).toBeLessThan(500);
      const { data: user, error } = await admin.auth.admin.getUserById(targetId);
      if (error) throw error;
      expect(user.user?.banned_until ? Date.parse(user.user.banned_until) > Date.now() : false).toBe(false);
      const { data: profile, error: profileError } = await admin.from("profiles")
        .select("account_status").eq("id", targetId).single();
      if (profileError) throw profileError;
      expect(profile.account_status).toBe("active");
      const unblockedClient = createClient(DB, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: loginData, error: loginError } = await unblockedClient.auth.signInWithPassword({
        email: clients.ban.email,
        password: PASS,
      });
      expect(loginError).toBeNull();
      expect(loginData.user?.id).toBe(targetId);
      const { data: audits, error: auditReadError } = await admin.from("admin_audit_log")
        .select("action").eq("target_id", targetId).eq("action", "user_unbanned");
      if (auditReadError) throw auditReadError;
      expect(audits?.length).toBeGreaterThanOrEqual(1);
      evidence.push({ case: "verified idempotent Auth ban, audited unban", result: "passed" });
    });
  });

  test("a client cannot access the moderation workspace", async ({ browser }) => {
    await withPage(browser, fromClient("hour"), async (page) => {
      await page.goto("/workspace/admin/moderation");
      await expect(page).not.toHaveURL((url) => url.pathname === "/workspace/admin/moderation");
      evidence.push({ case: "moderation unauthorized client denied", result: "passed" });
    });
  });

  test.afterAll(async () => {
    // Evidence contains no identity IDs, messages, cookies, or credentials.
    if (!loopback(DB) || !loopback(BASE)) return;
    await mkdir(OUTPUT, { recursive: true });
    await writeFile(OUTPUT + "/acceptance-summary.json", JSON.stringify({
      kind: "local-browser-real-action-tests-not-production-acceptance",
      timestamp: new Date().toISOString(),
      localOnly: true,
      cases: evidence,
    }, null, 2));
  });
});
