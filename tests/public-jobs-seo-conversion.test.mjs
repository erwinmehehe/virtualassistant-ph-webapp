import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/jobs/page.tsx", "utf8");
const css = readFileSync("src/app/jobs/jobs-marketplace.css", "utf8");
const postJobPage = readFileSync("src/app/workspace/client/jobs/new/page.tsx", "utf8");
const jobSearchGuides = readFileSync("src/lib/blog-job-search-guides.ts", "utf8");
const postJobPublicPage = readFileSync("src/app/post-a-job/page.tsx", "utf8");
const publicJobDetail = readFileSync("src/app/jobs/[id]/page.tsx", "utf8");
const clientDashboard = readFileSync("src/app/workspace/client/page.tsx", "utf8");
const clientJobs = readFileSync("src/app/workspace/client/jobs/page.tsx", "utf8");
const appNav = readFileSync("src/components/app-nav-links.tsx", "utf8");
const jobWizard = readFileSync("src/components/job-wizard.tsx", "utf8");
const joinForm = readFileSync("src/components/join-account-form.tsx", "utf8");
const jobDraftSuggestions = readFileSync("src/lib/job-draft-suggestions.ts", "utf8");
const jobDetail = readFileSync("src/app/jobs/[id]/page.tsx", "utf8");
const siteNav = readFileSync("src/components/site-nav.tsx", "utf8");

test("jobs page targets live Philippines VA job intent without keyword stuffing", () => {
  assert.match(page, /Virtual Assistant Jobs Philippines \| Free VA Job Website/);
  assert.match(page, /<h1>Virtual Assistant Jobs Philippines<\/h1>/);
  assert.match(page, /remote VA roles with pay, weekly hours, and timezone expectations shown upfront/i);
  assert.match(page, /\/blog\/free-virtual-assistant-job-websites-philippines/);
  assert.doesNotMatch(page, /keywords:\s*\[/);
});

test("jobs page makes job posting a prominent employer conversion path", () => {
  assert.match(page, /Hiring a Filipino Virtual Assistant\?/);
  assert.match(page, /Post a Virtual Assistant job in the Philippines/);
  assert.match(page, /Post a VA job/);
  assert.match(page, /EMPLOYER_POST_HREF/);
  assert.match(page, /const EMPLOYER_POST_HREF = "\/post-a-job"/);
  assert.match(postJobPage, /Post a Virtual Assistant job/);
  assert.doesNotMatch(postJobPage, /Start a hiring request/);
  assert.match(css, /\.jobs-employer-card/);
  assert.match(css, /\.jobs-bottom-cta/);
});

test("jobs collection exposes crawlable structured data", () => {
  assert.match(page, /"@type": "CollectionPage"/);
  assert.match(page, /"@type": "ItemList"/);
  assert.match(page, /jobPublicHref\(job\)/);
});

test("jobs page states applicant fees precisely", () => {
  assert.match(page, /without a VA-side platform fee/);
  assert.match(page, /Employer recruiting, candidate-access, placement, or managed-service fees are separate/);
});


test("jobs hub and comparison guide reinforce separate search intents", () => {
  assert.match(page, /\/blog\/free-virtual-assistant-job-websites-philippines/);
  assert.match(jobSearchGuides, /"slug": "free-virtual-assistant-job-websites-philippines"/);
  assert.match(jobSearchGuides, /Free Virtual Assistant Job Websites Philippines \| 2026 Guide/);
  assert.match(jobSearchGuides, /"href": "\/jobs"/);
  assert.match(jobSearchGuides, /"href": "\/post-a-job"/);
});


test("employers can draft and preview a job before account creation", () => {
  assert.match(postJobPublicPage, /Create the job first/);
  assert.match(postJobPublicPage, /<JobWizard publicMode/);
  assert.match(jobWizard, /const steps = \["Describe the work", "Schedule & pay", "Preview & post"\]/);
  assert.match(jobWizard, /publicMode \? "Create free account to post"/);
  assert.match(jobWizard, /What should your VA handle\?/);
  assert.match(jobWizard, /job-post-preview/);
  assert.match(jobWizard, /const candidate = step === 0 \? \{ \.\.\.data, \.\.\.starterBriefValues\(data\) \} : data/);
  assert.match(jobWizard, /suggestJobDraft/);
  assert.match(jobWizard, /Write the work in your own words/);
  assert.match(jobWizard, /starterBriefValues/);
  assert.match(jobWizard, /window\.location\.assign\("\/auth\/join\/client\?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew%3Ffrom_post%3D1"\)/);
  assert.doesNotMatch(jobWizard, /Choose your hiring support/);
});

test("client signup and workspace resume the saved public job draft", () => {
  assert.match(joinForm, /Your job draft is saved on this device/);
  assert.match(joinForm, /return to your saved job preview/);
  assert.match(postJobPage, /fromPublicDraft/);
  assert.match(postJobPage, /Review and post your job/);
  assert.match(postJobPage, /initialStep=\{fromPublicDraft\?2/);
});


test("job draft suggestions only emit matcher-supported VAPH categories", () => {
  assert.doesNotMatch(jobDraftSuggestions, /category: "General Virtual Assistance"/);
  assert.doesNotMatch(jobDraftSuggestions, /category: "Customer Support"/);
  for (const category of [
    "Administrative Support",
    "Bookkeeping & Finance",
    "Customer Service",
    "Dental & Healthcare",
    "Ecommerce",
    "Executive Assistance",
    "Lead Generation & Sales",
    "Marketing & Social Media",
    "Phone & Reception",
    "Real Estate",
    "SEO",
    "Video Editing & Creative",
    "Web & WordPress",
  ]) {
    assert.match(jobDraftSuggestions, new RegExp(`category: "${category.replace(/[&]/g, "\\&")}"`));
  }
});


test("public jobs and navigation respect signed-in VA and client roles", () => {
  assert.match(page, /getSessionProfile/);
  assert.match(page, /const isVa = profile\?\.role === "va"/);
  assert.match(page, /const isClient = profile\?\.role === "client"/);
  assert.match(page, /isClient \? "\/workspace\/client\/jobs\/new" : EMPLOYER_POST_HREF/);
  assert.match(siteNav, /export async function SiteNav/);
  assert.match(siteNav, /user \? \([\s\S]*My workspace/);
  assert.match(siteNav, /profile\?\.role === "client"[\s\S]*\/workspace\/client\/jobs\/new/);
  assert.match(siteNav, /profile\?\.role === "va"[\s\S]*Browse VA jobs/);
});

test("post-a-job skips the login handoff for an already signed-in client", () => {
  assert.match(postJobPublicPage, /getSessionProfile/);
  assert.match(postJobPublicPage, /profile\?\.role === "client"\) redirect\("\/workspace\/client\/jobs\/new"\)/);
  assert.match(postJobPublicPage, /const isVa = profile\?\.role === "va"/);
  assert.match(postJobPublicPage, /You’re signed in as a Virtual Assistant/);
});


test("job posting and application CTAs respect the signed-in account", () => {
  assert.match(page, /const isVa = profile\?\.role === "va"/);
  assert.match(page, /const isClient = profile\?\.role === "client"/);
  assert.match(page, /isClient \? "\/workspace\/client\/jobs\/new" : EMPLOYER_POST_HREF/);
  assert.match(page, /isVa \? <Link className="btn btn-lg" href="\/workspace\/va\/applications">My applications/);
  assert.match(postJobPage, /profile\?\.role === "client"\) redirect\("\/workspace\/client\/jobs\/new"\)/);
  assert.match(postJobPage, /if \(user\) redirect\(profile\?\.role === "va" \? "\/workspace\/va" : "\/workspace"\)/);
  assert.match(publicJobDetail, /profile\?\.role === "va"/);
  assert.match(publicJobDetail, /profile\?\.role === "client"/);
  assert.match(publicJobDetail, /You’re signed in as a client/);
  assert.match(publicJobDetail, /Apply for this job/);
  assert.match(publicJobDetail, /Complete vetting to apply/);
  assert.match(publicJobDetail, /!user|: user \?/);
});


test("job marketplace CTAs are role-aware for logged-out VAs and signed-in clients", () => {
  assert.match(page, /const employerPostHref = isClient \? "\/workspace\/client\/jobs\/new" : EMPLOYER_POST_HREF/);
  assert.match(page, /isVa \? <Link className="btn btn-lg" href="\/workspace\/va\/applications">My applications<\/Link> : !user \? <Link className="btn btn-lg" href="\/auth\/join\/va">Create free VA profile<\/Link> : null/);
  assert.match(publicJobDetail, /profile\?\.role === "client"/);
  assert.match(publicJobDetail, /You’re signed in as a client/);
  assert.match(publicJobDetail, /Create VA profile/);
  assert.match(publicJobDetail, /auth\/join\/va\?next=\$\{encodeURIComponent\(canonicalHref\)\}/);
  assert.match(publicJobDetail, /Apply for this job/);
  assert.match(postJobPage, /if \(profile\?\.role === "client"\) redirect\("\/workspace\/client\/jobs\/new"\)/);
  assert.match(postJobPage, /if \(user\) redirect\(profile\?\.role === "va" \? "\/workspace\/va" : "\/workspace"\)/);
});


test("client workspace always exposes direct job creation without another login", () => {
  assert.match(clientDashboard, /href="\/workspace\/client\/jobs\/new"/);
  assert.match(clientDashboard, /> Post a job<\/Link>/);
  assert.match(clientJobs, /href="\/workspace\/client\/jobs\/new">Post a job<\/Link>/);
  assert.match(clientJobs, /Post your first job/);
  assert.match(appNav, /\["Jobs", "\/workspace\/client\/jobs", BriefcaseBusiness\]/);
});

test("logged-out and signed-in job journeys do not cross auth roles", () => {
  assert.match(publicJobDetail, /auth\/join\/va\?next=\$\{encodeURIComponent\(canonicalHref\)\}/);
  assert.match(publicJobDetail, /auth\/login\?next=\$\{encodeURIComponent\(canonicalHref\)\}/);
  assert.match(publicJobDetail, /profile\?\.role === "client"/);
  assert.match(publicJobDetail, /Go to client workspace/);
  assert.match(postJobPublicPage, /if \(isClient\) redirect\("\/workspace\/client\/jobs\/new"\)/);
  assert.match(postJobPublicPage, /isVa \? <div className="post-job-role-guard">/);
});


test("public jobs and post-job routes respect logged-out, VA, and client sessions", () => {
  assert.match(jobsPage, /const employerPostHref = isClient \? "\/workspace\/client\/jobs\/new" : EMPLOYER_POST_HREF/);
  assert.match(jobsPage, /!user \? "\/auth\/join\/va\?next=%2Fjobs" : "\/workspace"/);
  assert.match(postJobPage, /if \(profile\?\.role === "client"\) redirect\("\/workspace\/client\/jobs\/new"\)/);
  assert.match(postJobPage, /if \(user\) redirect\(profile\?\.role === "va" \? "\/workspace\/va" : "\/workspace"\)/);
  assert.match(postJobPage, /<JobWizard publicMode/);
});


test("logged-out and signed-in job CTAs follow the account role without fake login walls", () => {
  assert.match(jobsPage, /const isVa = profile\?\.role === "va"/);
  assert.match(jobsPage, /const isClient = profile\?\.role === "client"/);
  assert.match(jobsPage, /isClient \? "\/workspace\/client\/jobs\/new" : EMPLOYER_POST_HREF/);
  assert.match(jobsPage, /Create free VA profile/);

  assert.match(postAJobPage, /const isClient = profile\?\.role === "client"/);
  assert.match(postAJobPage, /Post a job from my dashboard/);
  assert.match(postAJobPage, /Job posting requires a client account/);
  assert.match(postAJobPage, /<JobWizard publicMode \/>/);

  assert.match(publicJobDetail, /Create VA profile/);
  assert.match(publicJobDetail, /Apply for this job/);
  assert.match(publicJobDetail, /You’re signed in as a client/);
  assert.match(publicJobDetail, /Go to client workspace/);
  assert.match(publicJobDetail, /profile\?\.role === "va"/);
});

test("signed-in clients can start a new job directly from their dashboard and navigation", () => {
  assert.match(clientDashboard, /href="\/workspace\/client\/jobs\/new"/);
  assert.match(clientDashboard, /Post a job/);
  assert.match(clientJobs, /href="\/workspace\/client\/jobs\/new"/);
  assert.match(clientJobs, /Post a job/);
  assert.match(appNav, /\["Post a job", "\/workspace\/client\/jobs\/new", FileText\]/);
});


test("logged-out, VA, and client job CTAs stay role-aware", () => {
  const publicJob = readFileSync("src/app/jobs/[id]/page.tsx", "utf8");
  const jobsIndex = readFileSync("src/app/jobs/page.tsx", "utf8");
  const postJob = readFileSync("src/app/post-a-job/page.tsx", "utf8");
  const clientHome = readFileSync("src/app/workspace/client/page.tsx", "utf8");
  const clientJobs = readFileSync("src/app/workspace/client/jobs/page.tsx", "utf8");

  assert.match(publicJob, /Create VA profile/);
  assert.match(publicJob, /Log in/);
  assert.match(publicJob, /profile\?\.role === "va"/);
  assert.match(publicJob, /Apply for this job/);
  assert.match(publicJob, /profile\?\.role === "client"/);
  assert.match(publicJob, /You’re signed in as a client/);
  assert.match(publicJob, /Go to client workspace/);
  assert.match(publicJob, /Post another job/);

  assert.match(jobsIndex, /const employerPostHref = isClient \? "\/workspace\/client\/jobs\/new" : EMPLOYER_POST_HREF/);
  assert.match(jobsIndex, /const vaPrimaryHref = isVa \? "\/workspace\/va\/jobs"/);

  assert.match(postJob, /const isClient = profile\?\.role === "client"/);
  assert.match(postJob, /Post from client dashboard/);
  assert.match(postJob, /<JobWizard publicMode \/>/);
  assert.match(postJob, /!user \?/);

  assert.match(clientHome, /href="\/workspace\/client\/jobs\/new"/);
  assert.match(clientHome, /> Post a job</);
  assert.match(clientJobs, /href="\/workspace\/client\/jobs\/new">Post a job</);
});


test("public job and posting journeys are auth-aware and return users to the right workspace", () => {
  assert.match(jobDetail, /profile\?\.role === "client"/);
  assert.match(jobDetail, /Go to client workspace/);
  assert.match(jobDetail, /Create VA profile to apply/);
  assert.match(jobDetail, /auth\/join\/va\?next=/);
  assert.match(jobDetail, /Already have an account\? Log in/);
  assert.match(postAJob, /isClient/);
  assert.match(postAJob, /Post a job from my dashboard/);
  assert.match(postAJob, /workspace\/client\/jobs\/new/);
  assert.match(postAJob, /JobWizard publicMode/);
});
