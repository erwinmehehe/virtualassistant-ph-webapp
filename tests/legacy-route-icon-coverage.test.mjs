import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("legacy public hiring URLs permanently redirect to the canonical jobs marketplace", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  for (const source of ["/virtual-assistant-jobs", "/careers"]) {
    const rule = config.redirects?.find(
      (item) =>
        item.source === source &&
        item.destination === "https://virtualassistant.com.ph/jobs" &&
        item.permanent === true
    );
    assert.ok(rule, `missing permanent redirect for ${source}`);
  }
});

test("common browser icon probes resolve instead of generating production 404s", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  const expected = new Map([
    ["/favicon.gif", "https://virtualassistant.com.ph/favicon.png"],
    ["/apple-touch-icon-precomposed.png", "https://virtualassistant.com.ph/apple-touch-icon.png"],
    ["/apple-touch-icon-120x120.png", "https://virtualassistant.com.ph/apple-touch-icon.png"],
    ["/apple-touch-icon-120x120-precomposed.png", "https://virtualassistant.com.ph/apple-touch-icon.png"],
  ]);

  for (const [source, destination] of expected) {
    const rule = config.redirects?.find(
      (item) => item.source === source && item.destination === destination && item.permanent === true
    );
    assert.ok(rule, `missing icon probe redirect for ${source}`);
  }

  const [favicon, apple] = await Promise.all([
    readFile("src/app/favicon.png/route.ts", "utf8"),
    readFile("src/app/apple-touch-icon.png/route.ts", "utf8"),
  ]);
  assert.match(favicon, /createSiteIconResponse\(96\)/);
  assert.match(apple, /createSiteIconResponse\(180\)/);
});

test("root metadata advertises both browser and Apple touch icons", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");
  assert.match(layout, /url: "\/favicon\.png"[^\n]*type: "image\/png"[^\n]*sizes: "96x96"/);
  assert.match(layout, /url: "\/apple-touch-icon\.png"[^\n]*type: "image\/png"[^\n]*sizes: "180x180"/);
});

test("email signup uses the branded confirmation path without the old Supabase resend fallback", async () => {
  const auth = await readFile("src/app/actions/auth.ts", "utf8");
  const joinStart = auth.indexOf("export async function joinAction");
  const joinEnd = auth.indexOf("export async function chooseOAuthRoleAction");
  const join = auth.slice(joinStart, joinEnd);

  assert.match(join, /admin\.auth\.admin\.generateLink/);
  assert.match(join, /sendAccountConfirmationEmail/);
  assert.doesNotMatch(join, /auth\.resend/);
  assert.doesNotMatch(join, /fallback_confirmation_failed/);
});
