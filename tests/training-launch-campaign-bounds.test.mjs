import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("training launch email is bounded to the original launch audience",async()=>{
  const source=await read("src/lib/va-training-announcement.ts");
  assert.match(source,/VA_TRAINING_LAUNCH_AUDIENCE_CUTOFF = "2026-09-25T14:02:13\.851Z"/);
  assert.match(source,/\.lte\("created_at", VA_TRAINING_LAUNCH_AUDIENCE_CUTOFF\)/);
});

test("one-time training launch cron is unscheduled",async()=>{
  const migration=await read("supabase/migrations/20260927093000_stop_training_launch_cron.sql");
  assert.match(migration,/cron\.unschedule\('va-training-announcement-hourly'\)/);
});
