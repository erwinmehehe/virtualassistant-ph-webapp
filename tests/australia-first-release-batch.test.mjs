import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const releaseMigrations = [
  ["supabase/migrations/20260923214000_release_australian_va_fundamentals.sql", "australian-va-fundamentals"],
  ["supabase/migrations/20260923214500_release_australian_trades_administration.sql", "australian-trades-administration"],
  ["supabase/migrations/20260923215000_release_servicem8_va_training.sql", "servicem8-for-virtual-assistants"],
];

for (const [path, slug] of releaseMigrations) {
  test(`${slug} is released only after editorial review and an 80% assessment gate`, async () => {
    const sql = await readFile(path, "utf8");
    assert.match(sql, new RegExp(slug));
    assert.match(sql, /is_published = true/);
    assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
    assert.match(sql, /last_reviewed_at = now\(\)/);
    assert.match(sql, /pass_score = 80/);
    assert.match(sql, /status = 'published'/);
    assert.match(sql, /content_version = greatest\(content_version, 2\)/);
  });
}

test("the first Australia release batch has substantive authored content and practical simulations", async () => {
  const seed = await readFile(
    "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
    "utf8",
  );

  const courseStarts = [...seed.matchAll(/insert into public\.training_courses/g)].map((match) => match.index);
  assert.equal(courseStarts.length, 3);

  const expected = [
    ["australian-va-fundamentals", 8],
    ["australian-trades-administration", 8],
    ["servicem8-for-virtual-assistants", 8],
  ];

  for (let index = 0; index < courseStarts.length; index += 1) {
    const segment = seed.slice(courseStarts[index], courseStarts[index + 1] ?? seed.length);
    const slug = segment.match(/values\s*\(\s*'([^']+)'/i)?.[1];
    const expectedCourse = expected.find(([expectedSlug]) => expectedSlug === slug);

    assert.ok(expectedCourse, `Unexpected Australia course block: ${slug}`);
    assert.equal(
      (segment.match(/insert into public\.training_lessons/g) || []).length,
      expectedCourse[1],
      `${slug} should have the expected lesson count`,
    );
    assert.equal(
      (segment.match(/"type":"scenario"/g) || []).length,
      expectedCourse[1],
      `${slug} should include a practical scenario in every lesson`,
    );
    assert.equal(
      (segment.match(/insert into public\.training_assessments/g) || []).length,
      1,
      `${slug} should include one final assessment`,
    );
    assert.match(segment, /escalat/i, `${slug} should teach escalation boundaries`);
  }
});

test("Australian VA Fundamentals keeps privacy, time-zone, finance, and AI boundaries", async () => {
  const seed = await readFile(
    "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
    "utf8",
  );

  assert.match(seed, /Australian Privacy, Personal Information, and Offshore VA Access/);
  assert.match(seed, /Australian Time Zones, Daylight Saving, and Scheduling/);
  assert.match(seed, /ABN, GST, BAS, Invoices, and Finance Terminology for VAs/);
  assert.match(seed, /unapproved AI tools/i);
  assert.match(seed, /not legal advice/i);
});

test("Australian Trades Administration release includes the strengthened enquiry-to-review capstone", async () => {
  const strengthened = await readFile(
    "supabase/migrations/20260923211800_strengthen_australian_tradie_simulation.sql",
    "utf8",
  );

  for (const stage of [
    "Enquiry:",
    "Qualification and triage:",
    "Booking and dispatch:",
    "Quote:",
    "Quote follow-up:",
    "Job delivery:",
    "Invoice and payment:",
    "Review request:",
    "Handoff:",
  ]) {
    assert.ok(strengthened.includes(stage), `Missing tradie workflow stage: ${stage}`);
  }

  assert.match(strengthened, /Never invent reviews/i);
  assert.match(strengthened, /Do not request a review while a complaint, safety concern, return visit, or unresolved service issue/i);
  assert.match(strengthened, /pass_score = 80/);
});

test("ServiceM8 course preserves current-product and trademark safeguards", async () => {
  const seed = await readFile(
    "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
    "utf8",
  );

  assert.match(seed, /not affiliated with, certified by, or endorsed by ServiceM8/i);
  assert.match(seed, /verify current official ServiceM8 help documentation/i);
  assert.match(seed, /client's first call through scheduling, quoting, completion, invoicing, and payment/i);
  assert.match(seed, /online acceptance/i);
  assert.match(seed, /accounting integrations/i);
  assert.match(seed, /automation/i);
});

test("first Australia release batch does not create public course URLs or make training a hiring requirement", async () => {
  const dashboard = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");

  assert.match(dashboard, /Choose your Australian VA specialization/);
  assert.match(dashboard, /Draft specialist courses stay unavailable until they pass the normal review process/);
  assert.doesNotMatch(publicTraining, /href=\{?\`?\/training\/courses/);
  assert.match(publicTraining, /Training is a learning product, not a recruitment gate/);
});
