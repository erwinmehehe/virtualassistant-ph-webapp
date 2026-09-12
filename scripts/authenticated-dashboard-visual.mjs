import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.VISUAL_BASE_URL || "").replace(/\/$/, "");
const supabaseUrl = String(process.env.SMOKE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(process.env.SMOKE_SUPABASE_ANON_KEY || "");
const bypassSecret = String(process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "");

if (!baseUrl || !supabaseUrl || !anonKey) {
  throw new Error("VISUAL_BASE_URL, SMOKE_SUPABASE_URL, and SMOKE_SUPABASE_ANON_KEY are required.");
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const outputDir = path.resolve("artifacts/dashboard-visual");
const roles = [
  { role: "recruiter", email: process.env.SMOKE_RECRUITER_EMAIL, password: process.env.SMOKE_RECRUITER_PASSWORD, path: "/workspace/recruiter", marker: "Today’s work" },
  { role: "client", email: process.env.SMOKE_CLIENT_EMAIL, password: process.env.SMOKE_CLIENT_PASSWORD, path: "/workspace/client", marker: "Your hiring progress" },
  { role: "va", email: process.env.SMOKE_VA_EMAIL, password: process.env.SMOKE_VA_PASSWORD, path: "/workspace/va", marker: "What should you do next?" }
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 }
];

async function signIn(email, password) {
  if (!email || !password) throw new Error("A dashboard visual test account is missing credentials.");
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, authorization: `Bearer ${anonKey}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok || !session.access_token || !session.refresh_token) {
    throw new Error(`Supabase sign-in failed with HTTP ${response.status}.`);
  }
  return session;
}

function sessionCookies(session, hostname) {
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
    secure: true,
    sameSite: "Lax"
  }));
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const role of roles) {
    const session = await signIn(role.email, role.password);
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      if (bypassSecret) {
        await context.setExtraHTTPHeaders({ "x-vercel-protection-bypass": bypassSecret });
      }
      await context.addCookies(sessionCookies(session, new URL(baseUrl).hostname));
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      const response = await page.goto(`${baseUrl}${role.path}`, { waitUntil: "networkidle", timeout: 90000 });
      if (!response?.ok()) throw new Error(`${role.role} ${viewport.name} returned HTTP ${response?.status() || "unknown"}.`);
      await page.getByText(role.marker, { exact: false }).first().waitFor({ state: "visible", timeout: 30000 });
      await page.screenshot({ path: path.join(outputDir, `${role.role}-${viewport.name}.png`), fullPage: true });
      if (consoleErrors.length) throw new Error(`${role.role} ${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
      await context.close();
      console.log(`Captured ${role.role} dashboard at ${viewport.width}x${viewport.height}`);
    }
  }
} finally {
  await browser.close();
}

