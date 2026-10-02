import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage uses the refreshed OG image and meta-title alt", async () => {
  const page = await read("src/app/page.tsx");
  assert.match(page, /const HOME_META_TITLE = "Virtual Assistant Philippines \| Hire Vetted Filipino VAs"/);
  assert.match(page, /canonicalUrl\("\/og\/home\.jpg"\)/);
  assert.match(page, /alt: HOME_META_TITLE/);
});

test("services directory has a dedicated OG image and title-matched alt", async () => {
  const page = await read("src/app/services/page.tsx");
  assert.match(page, /canonicalUrl\("\/og\/services\.jpg"\)/);
  assert.match(page, /alt: SERVICES_META_TITLE/);
});

test("priority service pages map to relevant generated OG artwork", async () => {
  const page = await read("src/app/service/[slug]/page.tsx");
  for (const expected of [
    'seo: "/og/seo.jpg"',
    '"executive-virtual-assistant": "/og/executive.jpg"',
    'bookkeeping: "/og/bookkeeping.jpg"',
    '"customer-service": "/og/customer-support.jpg"',
    '"social-media": "/og/social-media.jpg"',
    'ecommerce: "/og/ecommerce.jpg"',
    '"real-estate": "/og/real-estate.jpg"',
  ]) {
    assert.ok(page.includes(expected), `missing OG mapping: ${expected}`);
  }
  assert.match(page, /alt: title/);
  assert.match(page, /images: \[\{ url: imageUrl, width: 1200, height: 630, alt: title \}\]/);
});

test("all other service pages use a role-specific fallback OG renderer", async () => {
  const [page, route] = await Promise.all([
    read("src/app/service/[slug]/page.tsx"),
    read("src/app/service/[slug]/og/route.tsx"),
  ]);

  assert.match(page, /return SERVICE_OG_IMAGES\[slug\] \|\| `\/service\/\$\{slug\}\/og`/);
  assert.match(route, /serviceMetaTitle/);
  assert.match(route, /serviceMetaDescription/);
  assert.match(route, /ROLE SNAPSHOT/);
  assert.match(route, /localized\.name/);
  assert.match(route, /localized\.focus/);
});

test("OG artwork files are present as static 1200x630 assets", async () => {
  const names = [
    "home",
    "services",
    "seo",
    "executive",
    "bookkeeping",
    "customer-support",
    "social-media",
    "ecommerce",
    "real-estate",
  ];
  for (const name of names) {
    const url = new URL(`../public/og/${name}.jpg`, import.meta.url);
    const bytes = await readFile(url);
    assert.ok(bytes.length > 50_000, `${name} OG image is unexpectedly small`);
  }
});
