import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { uploadContentsMatch } from "../src/lib/upload-file-signatures.ts";

const file = (name, content, type = "") => new File([content], name, { type });
const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n", "ascii");
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x10, 0x00, 0x00, 0xff, 0xd9]);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("IHDRdummyIEND", "ascii"),
]);
const webp = Buffer.concat([Buffer.from("RIFF", "ascii"), Buffer.alloc(4), Buffer.from("WEBP", "ascii")]);

test("genuine magic-byte samples and text can pass lightweight upload validation", async () => {
  assert.equal(await uploadContentsMatch(file("resume.pdf", pdf, "application/pdf"), "resume"), true);
  assert.equal(await uploadContentsMatch(file("resume.pdf", pdf, "application/octet-stream"), "resume"), true);
  assert.equal(await uploadContentsMatch(file("photo.JPG", jpeg, "image/jpeg"), "avatar"), true);
  assert.equal(await uploadContentsMatch(file("photo.png", png, "image/png"), "company-logo"), true);
  assert.equal(await uploadContentsMatch(file("pic.webp", webp, "image/webp"), "avatar"), true);
  assert.equal(await uploadContentsMatch(file("brief.txt", "Hello, we need virtual assistant support.", "text/plain"), "lead-attachment"), true);
});

test("mismatched extensions, spoofed MIME and malformed/truncated content are rejected", async () => {
  assert.equal(await uploadContentsMatch(file("invoice.pdf", "<script>malicious</script>", "application/pdf"), "lead-attachment"), false);
  assert.equal(await uploadContentsMatch(file("invoice.exe", pdf, "application/pdf"), "lead-attachment"), false);
  assert.equal(await uploadContentsMatch(file("invoice.pdf", pdf, "text/plain"), "lead-attachment"), false);
  assert.equal(await uploadContentsMatch(file("image.jpg", png, "image/jpeg"), "avatar"), false);
  assert.equal(await uploadContentsMatch(file("image.png", png, "image/jpeg"), "avatar"), false);
  assert.equal(await uploadContentsMatch(file("image.png", png.subarray(0, 8), "image/png"), "avatar"), false);
  assert.equal(await uploadContentsMatch(file("word.docx", Buffer.from("PK\\x03\\x04NotOfficeDocument", "binary"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "resume"), false);
  assert.equal(await uploadContentsMatch(file("binary.txt", Buffer.from([0x41, 0x00, 0x42]), "text/plain"), "lead-attachment"), false);
  assert.equal(await uploadContentsMatch(file("binary.txt", Buffer.from([0xc0, 0xaf]), "text/plain"), "lead-attachment"), false);
  assert.equal(await uploadContentsMatch(file("photo.png", png, "image/png"), "resume"), false);
  assert.equal(await uploadContentsMatch(file("resume.pdf", pdf, "application/pdf"), "avatar"), false);
  assert.equal(await uploadContentsMatch(file("empty.pdf", ""), "resume"), false);
});

test("every existing upload and auto-fill action checks actual bytes before upload or parsing", async () => {
  const root = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
  const [profile, account, leads, autofill] = await Promise.all([
    root("src/app/actions/profile.ts"),
    root("src/app/actions/account-security.ts"),
    root("src/app/actions/leads.ts"),
    root("src/app/actions/resume-autofill.ts"),
  ]);
  assert.match(profile, /uploadContentsMatch\(resumeUpload\.file, "resume"\)/);
  assert.match(profile, /uploadContentsMatch\(avatarUpload\.file, "avatar"\)/);
  assert.match(profile, /uploadContentsMatch\(logoUpload\.file, "company-logo"\)/);
  assert.match(account, /uploadContentsMatch\(avatar, "avatar"\)/);
  assert.match(leads, /uploadContentsMatch\(attachment, "lead-attachment"\)/);
  assert.doesNotMatch(leads, /allowedAttachmentTypes\.has\(attachment\.type\).*\|\|/);
  assert.match(autofill, /uploadContentsMatch\(file, "resume-autofill"\)/);
  assert.ok(profile.indexOf('uploadContentsMatch(resumeUpload.file') < profile.indexOf('admin.from("va_profiles").select("*")'));
  assert.ok(account.indexOf('uploadContentsMatch(avatar, "avatar")') < account.indexOf('.upload(uploadedPath, avatar'));
  assert.ok(leads.indexOf('uploadContentsMatch(attachment, "lead-attachment")') < leads.indexOf('.from("lead-attachments").upload('));
  assert.ok(autofill.indexOf('uploadContentsMatch(file, "resume-autofill")') < autofill.indexOf('extractResumeText(buffer, resumeType)'));
});
