/**
 * Bounded, scanner-independent upload format validation.
 *
 * This rejects mislabeled and obviously malformed content before it reaches
 * private storage, public image storage, or a resume text parser. It is NOT an
 * antivirus, malware scanner, PDF sanitizer, or complete OOXML validator.
 */
export type UploadPurpose = "resume" | "lead-attachment" | "avatar" | "company-logo" | "resume-autofill";

type Extension = "pdf" | "doc" | "docx" | "txt" | "jpg" | "jpeg" | "png" | "webp";

const mimeByExtension: Record<Extension, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const documentTypes: Extension[] = ["pdf", "doc", "docx"];
const imageTypes: Extension[] = ["jpg", "jpeg", "png", "webp"];
const allowed: Record<UploadPurpose, readonly Extension[]> = {
  resume: documentTypes,
  "resume-autofill": ["pdf", "docx"],
  "lead-attachment": [...documentTypes, "txt"],
  avatar: imageTypes,
  "company-logo": imageTypes,
};

const maxBytes: Record<UploadPurpose, number> = {
  resume: 5 * 1024 * 1024,
  "resume-autofill": 5 * 1024 * 1024,
  "lead-attachment": 10 * 1024 * 1024,
  avatar: 3 * 1024 * 1024,
  "company-logo": 3 * 1024 * 1024,
};

const genericMimes = new Set(["", "application/octet-stream"]);
const prefix = (bytes: Buffer, signature: number[]) =>
  bytes.length >= signature.length && signature.every((byte, i) => bytes[i] === byte);

function contentsMatch(bytes: Buffer, ext: Extension): boolean {
  switch (ext) {
    case "pdf": {
      if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) return false;
      return bytes.subarray(Math.max(0, bytes.length - 4096)).includes(Buffer.from("%%EOF"));
    }
    case "doc":
      return prefix(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "docx": {
      // Required OOXML entry names must be present in the ZIP directory.
      // This is a format hint, not an unzip, zip-bomb defense, or malware scan.
      const zip = prefix(bytes, [0x50, 0x4b, 0x03, 0x04]);
      return zip && ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]
        .every((name) => bytes.includes(Buffer.from(name, "ascii")))
        && !bytes.includes(Buffer.from("vbaProject.bin", "ascii"));
    }
    case "txt": {
      if (bytes.includes(0)) return false;
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return true;
      } catch { return false; }
    }
    case "jpg":
    case "jpeg":
      return prefix(bytes, [0xff, 0xd8, 0xff]) &&
        bytes.subarray(Math.max(0, bytes.length - 4096)).includes(Buffer.from([0xff, 0xd9]));
    case "png":
      return prefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) &&
        bytes.subarray(Math.max(0, bytes.length - 64)).includes(Buffer.from("IEND"));
    case "webp":
      return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP";
  }
}

/** Use only for actual File uploads; an absent optional file needs no check. */
export async function uploadContentsMatch(file: File, purpose: UploadPurpose): Promise<boolean> {
  if (file.size === 0 || file.size > maxBytes[purpose]) return false;
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] as Extension | undefined;
  if (!ext || !(allowed[purpose] as readonly string[]).includes(ext)) return false;
  const declaredMime = file.type.toLowerCase().trim();
  if (!genericMimes.has(declaredMime) && declaredMime !== mimeByExtension[ext]) return false;
  const bytes = Buffer.from(await file.arrayBuffer());
  return bytes.length === file.size && contentsMatch(bytes, ext);
}
