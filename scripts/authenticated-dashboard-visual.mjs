import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.VISUAL_BASE_URL || "").replace(/\/$/, "");
const supabaseUrl = String(process.env.SMOKE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(process.env.SMOKE_SUPABASE_ANON_KEY || "");
const smokeJobId = String(process.env.SMOKE_JOB_ID || "").trim();

if (!baseUrl || !supabaseUrl || !anonKey) {
  throw new Error("VISUAL_BASE_URL, SMOKE_SUPABASE_URL, and SMOKE_SUPABASE_ANON_KEY are required.");
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const outputDir = path.resolve("artifacts/dashboard-visual");
const roles = [
  { role: "admin", tokenHash: process.env.SMOKE_ADMIN_TOKEN_HASH, email: process.env.SMOKE_ADMIN_EMAIL, password: process.env.SMOKE_ADMIN_PASSWORD, path: "/workspace/admin/today", marker: "Owner Command Center", actionSelector: "#owner-actions" },
  { role: "recruiter", tokenHash: process.env.SMOKE_RECRUITER_TOKEN_HASH, email: process.env.SMOKE_RECRUITER_EMAIL, password: process.env.SMOKE_RECRUITER_PASSWORD, path: "/workspace/recruiter/today", marker: "My Day", actionSelector: "#recruiter-next-action" },
  { role: "client", tokenHash: process.env.SMOKE_CLIENT_TOKEN_HASH, email: process.env.SMOKE_CLIENT_EMAIL, password: process.env.SMOKE_CLIENT_PASSWORD, path: "/workspace/client", marker: "Your hiring progress", actionSelector: ".workflow-current" },
  { role: "va", tokenHash: process.env.SMOKE_VA_TOKEN_HASH, email: process.env.SMOKE_VA_EMAIL, password: process.env.SMOKE_VA_PASSWORD, path: "/workspace/va", marker: "What should you do next?", actionSelector: ".dashboard-next-action" }
];

const accountTabs = ["profile", "security", "notifications", "preferences", "privacy"];

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 }
];

const sessionCache = new Map();

async function signIn(config) {
  if (sessionCache.has(config.role)) return sessionCache.get(config.role);

  const usingTokenHash = Boolean(config.tokenHash);
  if (!usingTokenHash && (!config.email || !config.password)) {
    throw new Error(`A dashboard visual test session is missing for ${config.role}.`);
  }

  const endpoint = usingTokenHash ? `${supabaseUrl}/auth/v1/verify` : `${supabaseUrl}/auth/v1/token?grant_type=password`;
  const body = usingTokenHash
    ? { token_hash: config.tokenHash, type: "email" }
    : { email: config.email, password: config.password };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { apikey: anonKey, ...(anonKey.startsWith("eyJ") ? { authorization: `Bearer ${anonKey}` } : {}), "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok || !session.access_token || !session.refresh_token) {
    throw new Error(`Supabase ${usingTokenHash ? "passwordless" : "password"} sign-in failed for ${config.role} with HTTP ${response.status}.`);
  }
  sessionCache.set(config.role, session);
  return session;
}

function sessionCookies(session, baseUrlValue) {
  const parsedBaseUrl = new URL(baseUrlValue);
  const hostname = parsedBaseUrl.hostname;
  const secure = parsedBaseUrl.protocol === "https:";
  const value = `base64-${Buffer.from(JSON.stringify({
    ...session,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600)
  }), "utf8").toString("base64url")}`;
  const key = `sb-${projectRef}-auth-token`;
  const maxChunkSize = 3180;
  const values = value.length <= maxChunkSize
    ? [[key, value]]
    : Array.from({ length: Math.ceil(value.length / maxChunkSize) }, (_, index) => [`${key}.${index}`, value.slice(index * maxChunkSize, (index + 1) * maxChunkSize)]);
  return values.map(([name, cookieValue]) => ({
    name,
    value: cookieValue,
    domain: hostname,
    path: "/",
    httpOnly: false,
    secure,
    sameSite: "Lax"
  }));
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const role of roles) {
    const session = await signIn(role);
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      await context.addCookies(sessionCookies(session, baseUrl));
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      const response = await page.goto(`${baseUrl}${role.path}`, { waitUntil: "networkidle", timeout: 90000 });
      if (!response?.ok()) throw new Error(`${role.role} ${viewport.name} returned HTTP ${response?.status() || "unknown"}.`);
      await page.getByRole("heading", { name: role.marker, exact: true }).first().waitFor({ state: "visible", timeout: 30000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (overflow) throw new Error(`${role.role} ${viewport.name} has horizontal page overflow.`);

      const primaryAction = page.locator(role.actionSelector).first();
      await primaryAction.waitFor({ state: "visible", timeout: 30000 });
      if (viewport.name === "mobile") {
        const box = await primaryAction.boundingBox();
        if (!box || box.y >= viewport.height) {
          throw new Error(`${role.role} mobile primary action starts below the first viewport.`);
        }
      }

      await page.screenshot({ path: path.join(outputDir, `${role.role}-${viewport.name}.png`), fullPage: true });
      if (consoleErrors.length) throw new Error(`${role.role} ${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
      await context.close();
      console.log(`Captured ${role.role} dashboard at ${viewport.width}x${viewport.height}`);
    }
  }

  const recruiterSession = await signIn(roles.find((role) => role.role === "recruiter"));
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.addCookies(sessionCookies(recruiterSession, baseUrl));
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    const response = await page.goto(`${baseUrl}/workspace/recruiter/roles?view=intervention&sort=urgent`, { waitUntil: "networkidle", timeout: 90000 });
    if (!response?.ok()) throw new Error(`recruiter roles ${viewport.name} returned HTTP ${response?.status() || "unknown"}.`);
    await page.getByRole("heading", { name: "Roles", exact: true }).waitFor({ state: "visible", timeout: 30000 });
    const firstAction = page.locator('a[href="/workspace/recruiter/roles?view=needs_candidates&sort=urgent"]').first();
    await firstAction.waitFor({ state: "visible", timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) throw new Error(`recruiter roles ${viewport.name} has horizontal page overflow.`);
    if (viewport.name === "mobile") {
      const box = await firstAction.boundingBox();
      if (!box || box.y >= viewport.height) throw new Error("recruiter roles mobile first action starts below the first viewport.");
    }
    await page.screenshot({ path: path.join(outputDir, `recruiter-roles-${viewport.name}.png`), fullPage: true });
    if (consoleErrors.length) throw new Error(`recruiter roles ${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
    await context.close();
    console.log(`Captured recruiter roles at ${viewport.width}x${viewport.height}`);
  }

  for (const tab of accountTabs) {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      await context.addCookies(sessionCookies(recruiterSession, baseUrl));
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      const response = await page.goto(`${baseUrl}/workspace/account?tab=${tab}`, { waitUntil: "networkidle", timeout: 90000 });
      if (!response?.ok()) throw new Error(`account ${tab} ${viewport.name} returned HTTP ${response?.status() || "unknown"}.`);
      await page.locator(".account-settings-content").waitFor({ state: "visible", timeout: 30000 });
      await page.locator(`.account-settings-nav a[href="/workspace/account?tab=${tab}"]`).waitFor({ state: "visible", timeout: 30000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (overflow) throw new Error(`account ${tab} ${viewport.name} has horizontal page overflow.`);
      await page.screenshot({ path: path.join(outputDir, `account-${tab}-${viewport.name}.png`), fullPage: true });
      if (consoleErrors.length) throw new Error(`account ${tab} ${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
      await context.close();
      console.log(`Captured account ${tab} at ${viewport.width}x${viewport.height}`);
    }
  }

  const smokeVaId = "17def9aa-931c-432e-842c-090ffb45f896";
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.addCookies(sessionCookies(recruiterSession, baseUrl));
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    const response = await page.goto(`${baseUrl}/workspace/recruiter/candidates/${smokeVaId}`, { waitUntil: "networkidle", timeout: 90000 });
    if (!response?.ok()) throw new Error(`recruiter candidate profile ${viewport.name} returned HTTP ${response?.status() || "unknown"}.`);
    await page.getByText("Internal Recruiter View", { exact: true }).waitFor({ state: "visible", timeout: 30000 });
    await page.getByRole("heading", { name: "Smoke VA One", exact: true }).waitFor({ state: "visible", timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) throw new Error(`recruiter candidate profile ${viewport.name} has horizontal page overflow.`);
    await page.screenshot({ path: path.join(outputDir, `recruiter-candidate-profile-${viewport.name}.png`), fullPage: true });
    if (consoleErrors.length) throw new Error(`recruiter candidate profile ${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
    await context.close();
    console.log(`Captured recruiter candidate profile at ${viewport.width}x${viewport.height}`);
  }


  if (smokeJobId) {
    const smokeTitle = "[SMOKE QA] Admin Support";
    const smokeNames = ["Smoke VA One", "Smoke VA Two", "Smoke VA Three"];
    const recruiterSession = await signIn(roles.find((role) => role.role === "recruiter"));
    const recruiterContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await recruiterContext.addCookies(sessionCookies(recruiterSession, baseUrl));
    const recruiterPage = await recruiterContext.newPage();

    const roleResponse = await recruiterPage.goto(`${baseUrl}/workspace/recruiter/roles/${smokeJobId}`, { waitUntil: "networkidle", timeout: 90000 });
    if (!roleResponse?.ok()) throw new Error(`Smoke recruiter role returned HTTP ${roleResponse?.status() || "unknown"}.`);
    await recruiterPage.getByText("Role Control Center", { exact: false }).waitFor({ state: "visible", timeout: 30000 });
    const roleHeading = await recruiterPage.locator("h1").first().textContent();
    if (!String(roleHeading || "").includes(smokeTitle)) throw new Error("SMOKE_JOB_ID does not point to the protected smoke QA role.");

    // Make repeat runs idempotent by removing only the three named smoke VAs from a previous shortlist.
    for (const name of smokeNames) {
      const search = recruiterPage.getByRole("searchbox", { name: "Search candidates" });
      await search.fill(name);
      const row = recruiterPage.locator("tbody tr").filter({ hasText: name }).first();
      if (await row.count()) {
        const remove = row.getByRole("button", { name: "Remove", exact: true });
        if (await remove.count()) {
          await Promise.all([
            recruiterPage.waitForLoadState("networkidle"),
            remove.click()
          ]);
        }
      }
    }

    const search = recruiterPage.getByRole("searchbox", { name: "Search candidates" });
    await search.fill("Smoke VA");
    for (const name of smokeNames) {
      const checkbox = recruiterPage.getByRole("checkbox", { name: `Select ${name}` });
      await checkbox.waitFor({ state: "visible", timeout: 30000 });
      await checkbox.check();
    }
    await recruiterPage.getByText("3 selected", { exact: false }).waitFor({ state: "visible" });
    await recruiterPage.getByRole("button", { name: "Preview client view" }).click();
    const preview = recruiterPage.getByRole("region", { name: "Client shortlist preview" });
    await preview.waitFor({ state: "visible", timeout: 30000 });

    // Force a non-default order and verify that exact sequence survives the client handoff.
    await recruiterPage.getByRole("button", { name: "Move Smoke VA Three up" }).click();
    await recruiterPage.getByRole("button", { name: "Move Smoke VA Three up" }).click();
    await recruiterPage.screenshot({ path: path.join(outputDir, "recruiter-smoke-shortlist-preview.png"), fullPage: true });

    await recruiterPage.getByRole("button", { name: "Send 3 to client" }).click();
    await recruiterPage.waitForURL(/shortlist_released=1/, { timeout: 90000 });
    await recruiterPage.getByText("Shortlist released to the client.", { exact: true }).waitFor({ state: "visible", timeout: 30000 });
    await recruiterContext.close();

    const clientSession = await signIn(roles.find((role) => role.role === "client"));
    const clientContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await clientContext.addCookies(sessionCookies(clientSession, baseUrl));
    const clientPage = await clientContext.newPage();
    const clientResponse = await clientPage.goto(`${baseUrl}/workspace/client/candidates?role=${encodeURIComponent(smokeJobId)}`, { waitUntil: "networkidle", timeout: 90000 });
    if (!clientResponse?.ok()) throw new Error(`Smoke client Hiring Room returned HTTP ${clientResponse?.status() || "unknown"}.`);
    await clientPage.getByText(`Recruiter shortlist for ${smokeTitle}`, { exact: false }).waitFor({ state: "visible", timeout: 30000 });
    const shortlistText = await clientPage.locator("#recruiter-shortlist .browse-va-grid").innerText();
    const positions = ["QA Smoke Candidate 3", "QA Smoke Candidate 1", "QA Smoke Candidate 2"].map((name) => shortlistText.indexOf(name));
    if (positions.some((value) => value < 0) || !(positions[0] < positions[1] && positions[1] < positions[2])) {
      throw new Error(`Client shortlist order did not match recruiter order: ${positions.join(",")}`);
    }
    await clientPage.screenshot({ path: path.join(outputDir, "client-smoke-shortlist.png"), fullPage: true });

    if (smokeNames.some((name) => shortlistText.includes(name))) throw new Error("Client shortlist exposed an unmasked smoke VA full name.");
    const firstCard = clientPage.locator("#recruiter-shortlist .browse-va-grid > *").filter({ hasText: "QA Smoke Candidate 3" }).first();
    await firstCard.getByRole("button", { name: "Request interview" }).click();
    await clientPage.waitForURL(/\/workspace\/client\/interviews\?requested=1/, { timeout: 90000 });
    await clientContext.close();

    const verifyContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await verifyContext.addCookies(sessionCookies(recruiterSession, baseUrl));
    const verifyPage = await verifyContext.newPage();
    const verifyResponse = await verifyPage.goto(`${baseUrl}/workspace/recruiter/roles/${smokeJobId}#interviews`, { waitUntil: "networkidle", timeout: 90000 });
    if (!verifyResponse?.ok()) throw new Error(`Smoke recruiter interview verification returned HTTP ${verifyResponse?.status() || "unknown"}.`);
    const interviewSection = verifyPage.locator("#interviews");
    await interviewSection.getByText("Smoke VA Three", { exact: true }).waitFor({ state: "visible", timeout: 30000 });
    await interviewSection.getByText("requested", { exact: false }).waitFor({ state: "visible", timeout: 30000 });
    await verifyPage.screenshot({ path: path.join(outputDir, "recruiter-smoke-interview-requested.png"), fullPage: true });
    await verifyContext.close();
    console.log("Verified smoke recruiter → shortlist order → client handoff → interview request");
  }
} finally {
  await browser.close();
}

