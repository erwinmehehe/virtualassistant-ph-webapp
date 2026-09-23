import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const seedPath = "supabase/migrations/20260923124000_write_short_term_rental_va_training.sql";

test("Short-Term Rental VA course is fully written but remains draft", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Airbnb \/ Short-Term Rental Virtual Assistant/);
  assert.match(seed, /estimated_minutes = 300/);
  assert.match(seed, /status = 'draft'/);
  assert.match(seed, /published_at = null/);
  assert.match(seed, /is_published = false/g);
  const lessonIds = new Set(seed.match(/22000015-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 12);
});

test("STR course protects reservation, guest, and commercial boundaries", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Never open dates because a calendar looks empty in one channel/i);
  assert.match(seed, /Never promise a refund or discount before approval/i);
  assert.match(seed, /Do not send a contractor into an occupied property without the approved access process/i);
  assert.match(seed, /Keep only the guest information the client’s system and process require/i);
});

test("STR course includes current platform-change and trademark care", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /not affiliated with or endorsed by Airbnb/i);
  assert.match(seed, /Platform features, permissions, and policies can change/i);
  assert.match(seed, /current platform guidance/i);
});

test("STR final assessment tests real operational work rather than platform trivia", async () => {
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /Coastline Stays/);
  assert.match(seed, /operational judgment and work output rather than platform trivia/i);
  assert.match(seed, /protect guest data/i);
  assert.match(seed, /owner and shift handoff/i);
});


test("Short-Term Rental course has a reviewed release migration", async () => {
  const release = await readFile("supabase/migrations/20260923143000_release_short_term_rental_va_training.sql", "utf8");
  assert.match(release, /is_published = true/);
  assert.match(release, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(release, /pass_score = 80/);
  assert.match(release, /status = 'published'/);
  assert.match(release, /slug = 'airbnb-short-term-rental-virtual-assistant'/);
});
