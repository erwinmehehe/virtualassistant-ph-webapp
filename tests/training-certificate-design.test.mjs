import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { qrcode } from "../vendor/qrcode-generator.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("credential verification URLs encode to a real local QR matrix", () => {
  const url = "https://virtualassistant.com.ph/training/certificates/VAT-SAMPLE-12345678";
  const code = qrcode(0, "M");
  code.addData(url);
  code.make();
  const size = code.getModuleCount();
  assert.ok(size >= 21 && size <= 177, "must create a QR code matrix");
  assert.equal(code.isDark(0, 0), true, "top-left finder pattern exists");
  assert.equal(code.isDark(6, 6), true, "finder pattern outer square exists");
  assert.equal(code.isDark(3, 3), true, "finder pattern center exists");
});

test("certificate uses the issuer brand without inventing accreditation", () => {
  const source = readFileSync(
    path.join(root, "src/app/training/certificates/[code]/page.tsx"),
    "utf8",
  );
  assert.match(source, /<strong>VirtualAssistant\.com\.ph<\/strong>/);
  assert.doesNotMatch(source, /VirtualAssistant\.com\.ph Training/);
  assert.match(source, /not a professional license/);
  assert.match(source, /government-ID-verified/);
});

test("print CSS targets A4 landscape and keeps the certificate header visible", () => {
  const stylesheet = readFileSync(
    path.join(root, "src/app/training/certificates/[code]/certificate.css"),
    "utf8",
  );
  assert.match(stylesheet, /@page\s*\{\s*size:\s*A4 landscape/);
  assert.match(stylesheet, /\.credential-side-panel\s*\{\s*display:\s*none\s*!important/);
  assert.doesNotMatch(stylesheet, /@media print\s*\{[^}]*\bheader,\s*footer\s*\{/);
});
