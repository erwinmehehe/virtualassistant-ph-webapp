import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("zero-completion VA reminders return the user to quick setup",async()=>{
  const email=await read("src/lib/email.ts");
  assert.match(email,/const profileUrl = args\.score === 0[\s\S]*\/workspace\/va\/onboarding[\s\S]*:\s*`\$\{args\.appUrl\}\/workspace\/va\/profile`/);
  assert.match(email,/ctaHref: profileUrl/);
  assert.match(email,/Complete my quick setup/);
});
