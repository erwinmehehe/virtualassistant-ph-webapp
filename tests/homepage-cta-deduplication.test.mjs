import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage proof sections do not repeat hiring and booking CTAs", async () => {
  const source = await readFile(new URL("../src/components/homepage-sections.tsx", import.meta.url), "utf8");

  const hiringModels = source.slice(
    source.indexOf("export function HiringModelsSection"),
    source.indexOf("/* -------------------------------------------------------------------------- */\n/* Why choose")
  );
  assert.doesNotMatch(hiringModels, /Book a discovery call|bookingUrl/);
  assert.match(hiringModels, /Compare managed vs\. direct hire in detail/);

  const whyChoose = source.slice(
    source.indexOf("export function WhyChooseSection"),
    source.indexOf("/* -------------------------------------------------------------------------- */\n/* 4\. Talent")
  );
  assert.doesNotMatch(whyChoose, /Get your free VA match|Discuss your VA needs|bookingUrl/);

  const industries = source.slice(
    source.indexOf("export function IndustriesSection"),
    source.indexOf("/* -------------------------------------------------------------------------- */\n/* 7\. Savings")
  );
  assert.doesNotMatch(industries, /Not listed\? Tell us the work/);

  assert.match(source, /Browse all talent/);
  assert.match(source, /export function FinalCtaSection\(\{ bookingUrl \}/);
  assert.match(source, /Get your free VA match/);
  assert.match(source, /Discuss your VA needs/);
});
