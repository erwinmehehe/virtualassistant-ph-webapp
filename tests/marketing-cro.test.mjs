import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public marketing shell loads the shared CRO design system", () => {
  const layout = source("src/app/layout.tsx");
  const header = source("src/components/site-header.tsx");
  const nav = source("src/components/site-nav.tsx");
  const footer = source("src/components/site-footer.tsx");
  const footerCta = source("src/components/footer-cta.tsx");
  const floating = source("src/components/floating-cta.tsx");

  assert.match(layout, /import "\.\/va-design\.css"/);
  assert.match(layout, /import "\.\/nav-cro\.css"/);
  assert.match(layout, /import "\.\/service-visual-qa\.css"/);
  assert.match(layout, /import "\.\/service-visual-qa-final\.css"/);
  assert.match(layout, /import "\.\/service-match-form-final\.css"/);
  assert.match(header, /<SiteNav\s*\/>/);
  assert.doesNotMatch(nav, /href="\/book-client-call"/);
  assert.match(floating, /DISCOVERY_CALL_URL = "\/book-client-call"/);
  assert.doesNotMatch(floating, /Hiring a Virtual Assistant\?/);
  assert.match(floating, /INTERNAL_PATHS/);
  assert.match(floating, /floating-cta-compact/);
  assert.match(floating, /<span>Discuss your VA needs<\/span>/);
  assert.match(footer, /<FooterCta\s*\/>/);
  assert.doesNotMatch(footer, /HomepageShowcase/);
  assert.match(footerCta, /href="\/book-client-call"/);
  assert.match(footerCta, /pathname === "\/"/);
});

test("high-value public pages keep approved H1 copy and a valid conversion path", () => {
  const checks = [
    ["src/app/services/page.tsx", "Virtual Assistant services for the work your business needs done.", /href="\/hire"/],
    ["src/app/industries/page.tsx", "Find VA support by business workflow.", /href="\/hire"/],
    ["src/app/software/page.tsx", "Hire a virtual assistant who already knows your software.", /<DiscoveryCallCard|<HiringBriefForm/],
    ["src/app/blog/page.tsx", "Practical guides for hiring and managing Filipino VAs.", /href="\/hire"/],
    ["src/app/pricing/page.tsx", "Virtual Assistant pricing, without hidden fees.", /<DiscoveryCallCard|<HiringBriefForm/],
    ["src/app/faq/page.tsx", "Questions before you hire or apply.", /<DiscoveryCallCard|href="\/book-client-call"/],
    ["src/app/about/page.tsx", "A recruiting team for businesses hiring Filipino Virtual Assistants.", /<DiscoveryCallCard|href="\/book-client-call"/],
    ["src/app/how-vetting-works/page.tsx", "“Vetted” should mean more than a profile badge.", /<DiscoveryCallCard|href="\/book-client-call"/],
    ["src/app/managed-vs-direct-hire/page.tsx", "Managed Virtual Assistant vs. Direct Hire", /<DiscoveryCallCard|<HiringBriefForm|href="\/book-client-call"/],
    ["src/app/tools/page.tsx", "Plan the role before you post it.", /href="\/tools\/virtual-assistant-cost-calculator"/],
    ["src/app/contact/page.tsx", "What can we help with?", /submitContactAction/]
  ];

  for (const [path, h1Text, conversionSignal] of checks) {
    const file = source(path);
    assert.ok(file.includes(h1Text), `${path} must preserve its approved H1 text`);
    assert.match(file, conversionSignal, `${path} must keep a working conversion path`);
  }
});

test("commercial detail pages keep hiring forms while blog articles stay editorial", () => {
  const home = source("src/app/page.tsx");
  const service = source("src/app/service/[slug]/page.tsx");
  const industry = source("src/app/industries/[slug]/page.tsx");
  const software = source("src/app/software/[slug]/page.tsx");
  const article = source("src/components/blog-article.tsx");

  assert.match(home, /pva-hero-form-shell/);
  assert.match(home, /<HiringBriefForm/);
  assert.match(service, /<HiringBriefForm/);
  assert.match(industry, /<HiringBriefForm/);
  assert.match(software, /<HiringBriefForm/);
  assert.match(article, /blog-editorial-hero/);
  assert.doesNotMatch(article, /<RoleBriefForm|<ServiceMatchForm|<IndustryMatchForm|<HiringBriefForm/);
  assert.match(article, /href="\/book-client-call"/);
});

test("shared hiring form stays compact on service and industry pages", () => {
  const form = source("src/components/hiring-brief-form.tsx");
  const actions = source("src/app/actions/ai-leads.ts");
  const service = source("src/app/service/[slug]/page.tsx");
  const industry = source("src/app/industries/[slug]/page.tsx");
  const floating = source("src/components/floating-cta.tsx");
  const finalServiceCss = source("src/app/service-visual-qa-final.css");

  assert.match(service, /<HiringBriefForm[\s\S]*variant="service"/);
  assert.match(industry, /<HiringBriefForm variant="industry"/);
  assert.doesNotMatch(form, /name="phone"/);
  assert.match(form, /name="company" required/);
  assert.match(form, />First name</);
  assert.match(form, />Work email</);
  assert.match(form, /name="budget"/);
  assert.match(form, /submitServiceMatchWithAiAction/);
  assert.match(form, /submitIndustryMatchWithAiAction/);
  assert.match(actions, /submitServiceMatchAction/);
  assert.match(actions, /submitIndustryMatchAction/);
  assert.match(floating, /INLINE_MATCH_PATHS/);
  assert.match(finalServiceCss, /service-avoid-section/);
  assert.match(finalServiceCss, /interview-item/);
  assert.match(finalServiceCss, /faq-item/);
  assert.match(finalServiceCss, /@media \(max-width: 760px\)/);
});

test("brief success screen offers matches, an account, and a call", () => {
  const form = source("src/components/hiring-brief-form.tsx");
  const route = source("src/app/api/talent/top-matches/route.ts");
  const leads = source("src/app/actions/leads.ts");
  const claims = source("src/lib/lead-claims.ts");

  // Three options after the brief: see the fit, claim the request, or talk.
  assert.match(form, /<TopMatches category=\{category\} leadId=\{leadId\} \/>/);
  assert.match(form, /\/auth\/join\/client\?\$\{joinParams\.toString\(\)\}/);
  assert.match(form, /Create my account/);
  assert.match(form, /hb-secondary[\s\S]*Book a 20-minute call instead/);
  assert.match(form, /Get your free virtual assistant match/);
  assert.doesNotMatch(form, /Continue to booking/);
  assert.doesNotMatch(form, /No account needed/);

  // Three faces are framed as a sample of a pool, not as the shortlist itself.
  assert.match(form, /of \$\{total\} approved \$\{scope\}VAs/);
  assert.match(form, /Your recruiter builds your shortlist/);
  assert.match(form, /pool\?\.exact && category/);
  assert.match(route, /const total = exact \? inCategory\.length : eligible\.length;/);

  // The preview reads the consented public view, never the recruiter table.
  assert.match(route, /from\("public_va_directory"\)/);
  assert.doesNotMatch(route, /recruiter_va_directory/);
  assert.doesNotMatch(route, /createAdminClient/);

  // Signing up has to be able to claim the request it came from.
  assert.match(leads, /\?sent=1&lead=\$\{encodeURIComponent\(lead\.id\)\}&cat=/);
  assert.match(claims, /"industry_match_request"/);
});
