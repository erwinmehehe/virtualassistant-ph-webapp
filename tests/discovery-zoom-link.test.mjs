import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("public discovery booking persists automatic Zoom links or records setup failure",async()=>{
  const [action,ops,email]=await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/booking-operations.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(ops,/Zoom integration is not configured\. Missing/);
  assert.match(action,/zoomError/);
  assert.match(action,/discovery_meeting_url: zoom\?\.joinUrl \|\| null/);
  assert.match(action,/discovery_zoom_meeting_id: zoom\?\.meetingId \|\| null/);
  assert.match(action,/Automatic Zoom setup failed:/);
  assert.match(action,/sendDiscoveryMeetingSetupFailureEmail/);
  assert.match(action,/cancelZoomDiscoveryMeeting\(zoom\.meetingId\)/);
  assert.match(email,/Automatic Zoom setup failed/);
  assert.match(email,/Your meeting link is being prepared and will be sent before the call/);
});

test("recruiter booking auto-creates Zoom when no manual meeting URL is supplied",async()=>{
  const action=await read("src/app/actions/recruiter.ts");
  assert.match(action,/if \(!generatedMeetingUrl\)/);
  assert.match(action,/createZoomDiscoveryMeeting\(\{/);
  assert.match(action,/discovery_meeting_url: generatedMeetingUrl/);
  assert.match(action,/discovery_zoom_meeting_id: generatedMeetingId \|\| null/);
  assert.match(action,/meetingUrl: generatedMeetingUrl/);
});

test("existing linkless bookings expose a retry action that emails the client",async()=>{
  const [action,page]=await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/leads/page.tsx"),
  ]);
  assert.match(action,/export async function createDiscoveryZoomLinkAction/);
  assert.match(action,/subject: "Your discovery call Zoom link"/);
  assert.match(action,/hrefLabel: "Join Zoom call"/);
  assert.match(page,/Create Zoom link/);
  assert.match(page,/createDiscoveryZoomLinkAction/);
  assert.match(page,/Zoom meeting created and sent to the client/);
});
