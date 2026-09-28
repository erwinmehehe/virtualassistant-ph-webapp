import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("removed booking and homepage CTA markup no longer leaves dead CSS", async () => {
  const [bookingCss, homepageCss, homepage] = await Promise.all([
    read("src/app/book-client-call/booking.css"),
    read("src/app/homepage-sections.css"),
    read("src/components/homepage-sections.tsx"),
  ]);

  assert.doesNotMatch(bookingCss, /\.booking-hero-points/);
  assert.doesNotMatch(homepageCss, /\.hs-whychoose-actions/);
  assert.doesNotMatch(homepage, /hs-whychoose-actions/);
});

test("site footer no longer references the retired global footer CTA", async () => {
  const footer = await read("src/components/site-footer.tsx");
  assert.doesNotMatch(footer, /FooterCta|footer-cta/);

  await assert.rejects(
    access(new URL("../src/components/footer-cta.tsx", import.meta.url)),
  );
});

test("service industry and software detail forms remain intact", async () => {
  const [service, industry, software] = await Promise.all([
    read("src/app/service/[slug]/page.tsx"),
    read("src/app/industries/[slug]/page.tsx"),
    read("src/app/software/[slug]/page.tsx"),
  ]);

  for (const source of [service, industry, software]) {
    assert.match(source, /HiringBriefForm/);
  }
});
