import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage talent photos are clipped to clean 72px circles", async () => {
  const css = await read("src/app/homepage-sections.css");
  assert.match(css, /\.hs-talent-top \.avatar \{[\s\S]*width: 72px;[\s\S]*height: 72px;[\s\S]*overflow: hidden;[\s\S]*border-radius: 50%;[\s\S]*background: transparent;/);
  assert.match(css, /\.hs-talent-top \.avatar img \{[\s\S]*width: 100%;[\s\S]*height: 100%;[\s\S]*border-radius: 50%;[\s\S]*object-fit: cover;/);
});

test("every public discovery booking sends Jervis and Bryan the full internal brief without copying Erwin", async () => {
  const [email, action] = await Promise.all([
    read("src/lib/email.ts"),
    read("src/app/actions/leads.ts"),
  ]);

  assert.match(email, /const BOOKING_TEAM_EMAILS = normalizeEmailList/);
  assert.match(email, /jrvsaccad@gmail\.com/);
  assert.match(email, /bryanbatarina@gmail\.com/);
  const bookingTeamStart = email.indexOf("const BOOKING_TEAM_EMAILS");
  const bookingTeamEnd = email.indexOf("const staffClientFollowupBccRecipients", bookingTeamStart);
  assert.doesNotMatch(email.slice(bookingTeamStart, bookingTeamEnd), /erwinvalles20@gmail\.com/);
  assert.match(email, /export async function sendInternalDiscoveryBookingNotificationEmail/);
  assert.match(email, /Role<\/td>/);
  assert.match(email, /Hours<\/td>/);
  assert.match(email, /VA budget<\/td>/);
  assert.match(email, /Preferred start<\/td>/);
  assert.match(email, /What the VA should own/);
  assert.match(email, /"discovery_booking_internal_team", \{[\s\S]*archive: false,[\s\S]*priority: "critical",[\s\S]*idempotencyKey: `booking-internal-\$\{args\.leadId\}`/);
  assert.match(action, /await sendInternalDiscoveryBookingNotificationEmail\(\{/);
  assert.match(action, /leadId,/);
  assert.match(action, /service: parsed\.data\.service/);
  assert.match(action, /hours: parsed\.data\.hours/);
  assert.match(action, /budget: parsed\.data\.budget/);
  assert.match(action, /startTime: parsed\.data\.start_time/);
  assert.match(action, /message: parsed\.data\.message/);
  assert.match(action, /meetingUrl: meeting\?\.joinUrl \|\| null/);
  assert.match(action, /manageUrl: bookingManageUrl\(manageToken\)/);
});
