import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const data = read("src/lib/public-talent-proof.ts");
const component = read("src/components/public-talent-proof.tsx");
const css = read("src/app/public-talent-proof.css");
const layout = read("src/app/layout.tsx");
const home = read("src/app/page.tsx");
const service = read("src/app/service/[slug]/page.tsx");
const industry = read("src/app/industries/[slug]/page.tsx");
const serviceHub = read("src/app/services/page.tsx");
const industryHub = read("src/app/industries/page.tsx");
const hiringHero = read("src/components/hiring-hero.tsx");

test("hero uses the user-confirmed 700 VA profile total, not the public-directory subset", () => {
  assert.match(component, /const VA_PROFILE_TOTAL = 700;/);
  assert.match(component, /VA_PROFILE_TOTAL\.toLocaleString\("en-US"\)/);
  assert.match(component, /<span> VA profiles<\/span>/);
  assert.match(component, /Browse publicly listed Filipino virtual assistants/);
  assert.doesNotMatch(component, /vetted Filipino VA profiles|approved Filipino VA profiles|registered Filipino VAs/);
  assert.doesNotMatch(data + component, /52[,\s]?328|createAdminClient|from\("profiles"\)/i);
  assert.doesNotMatch(data, /from\("public_va_directory"\)|directoryCount|select\("user_id", \{ count:/);
});

test("public profile avatars remain consent-gated, with an honest icon fallback", () => {
  assert.match(data, /getHomepageFeaturedVas/);
  assert.match(data, /return \{ avatars \}/);
  assert.match(data, /revalidate: 300/);
  assert.match(data, /tags: \["public-va-directory"\]/);
  assert.match(component, /proof\.avatars\.slice\(0, 5\)/);
  assert.match(component, /<PublicAvatar/);
  assert.match(component, /<UsersRound/);
  assert.match(component, /href="\/find-talent"/);
  assert.doesNotMatch(component, /fake-avatar|sample faces|stock photo/i);
});

test("homepage, service/industry detail heroes, and both hubs reuse the same component", () => {
  assert.match(layout, /import "\.\/public-talent-proof\.css"/);
  assert.match(home, /getPublicTalentProof\(\)/);
  assert.match(home, /<PublicTalentProof proof=\{talentProof\} \/>/);
  assert.match(hiringHero, /talentProof\?: PublicTalentProofData/);
  assert.match(hiringHero, /talentProof \? <PublicTalentProof proof=\{talentProof\} \/>/);
  assert.match(service, /talentProof=\{talentProof\}/);
  assert.match(industry, /talentProof=\{talentProof\}/);
  assert.match(serviceHub, /meta=\{<PublicTalentProof proof=\{talentProof\} \/>\}/);
  assert.match(industryHub, /meta=\{<PublicTalentProof proof=\{talentProof\} \/>\}/);
  assert.match(css, /\.va-public-proof-faces \.avatar/);
  assert.match(css, /@media \(max-width: 480px\)/);
});
