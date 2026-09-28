import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("contact page routes hiring discovery and VA applications before the support form", async () => {
  const page=await read("src/app/contact/page.tsx");
  assert.match(page,/How can we help\?/);
  assert.match(page,/Hire a Virtual Assistant/);
  assert.match(page,/Book a discovery call/);
  assert.match(page,/Apply as a Virtual Assistant/);
  assert.match(page,/href: "\/hire"/);
  assert.match(page,/href: "\/book-client-call"/);
  assert.match(page,/href: "\/auth\/join\/va"/);
  assert.match(page,/Need something else\?/);
});

test("contact support form keeps all operational fields and anti-spam protection", async () => {
  const page=await read("src/app/contact/page.tsx");
  assert.match(page,/submitContactAction/);
  assert.match(page,/TurnstileWidget/);
  for (const field of ["name","email","company","phone","topic","message"]) {
    assert.match(page,new RegExp(`name="${field}"`));
  }
  assert.match(page,/minLength=\{20\}/);
  assert.match(page,/Minimum 20 characters/);
  assert.match(page,/We only use your details to respond to this enquiry/);
});

test("contact page uses dedicated responsive design styles", async () => {
  const [page,css]=await Promise.all([
    read("src/app/contact/page.tsx"),
    read("src/app/contact/contact.css"),
  ]);
  assert.match(page,/import "\.\/contact\.css"/);
  assert.match(css,/\.contact-routes-grid/);
  assert.match(css,/grid-template-columns: repeat\(3/);
  assert.match(css,/\.contact-support-grid/);
  assert.match(css,/\.contact-form-card/);
  assert.match(css,/@media \(max-width: 620px\)/);
  assert.match(css,/\.contact-form-grid/);
});
