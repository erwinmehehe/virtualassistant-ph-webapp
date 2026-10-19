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

test("proof only counts public directory rows and reuses approved public photos", () => {
  assert.match(data, /getHomepageFeaturedVas/);
  assert.match(data, /createPublicClient/);
  assert.match(data, /from\("public_va_directory"\)/);
  assert.match(data, /select\("user_id", \{ count: "exact", head: true \}\)/);
  assert.match(data, /directoryCount: null/);
  assert.match(data, /revalidate: 300/);
  assert.match(data, /tags: \["public-va-directory"\]/);
  assert.doesNotMatch(data + component, /52[,\s]?328|registered Filipino VAs|createAdminClient|from\("profiles"\)/i);
});

test("proof displays a verified dynamic number or an honest no-number fallback", () => {
  assert.match(component, /Number\.isSafeInteger\(count\) && count > 0/);
  assert.match(component, /count\.toLocaleString\("en-US"\)/);
  assert.match(component, /approved Filipino VA profiles/);
  assert.match(component, /Meet approved Filipino VAs/);
  assert.match(component, /proof\.avatars\.slice\(0, 5\)/);
  assert.match(component, /<PublicAvatar/);
  assert.match(component, /<UsersRound/);
  assert.match(component, /href="\/find-talent"/);
  assert.doesNotMatch(component, /"52,328"|"50,000"|fake-avatar/);
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
