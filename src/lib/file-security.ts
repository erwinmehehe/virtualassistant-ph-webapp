import "server-only";

import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadPurpose = "resume" | "lead-attachment" | "avatar" | "company-logo";

export type ValidatedUpload = {
  buffer: Buffer;
  extension: "pdf" | "doc" | "docx" | "txt" | "jpg" | "jpeg" | "png" | "webp";
  contentType: string;
  originalName: string;
  size: number;
};

type UploadPolicy = {
  maxBytes: number;
  allowedExtensions: ReadonlySet<ValidatedUpload["extension"]>;
  invalidTypeMessage: string;
  tooLargeMessage: string;
};

const MIME_BY_EXTENSION: Record<ValidatedUpload["extension"], string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const GENERIC_MIME = new Set(["", "application/octet-stream"]);
const IMAGE_EXTENSIONS = new Set<ValidatedUpload["extension"]>(["jpg", "jpeg", "png", "webp"]);
const MAX_DOCX_ENTRIES = 500;
const MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024;
const MAX_DOCX_SINGLE_ENTRY_BYTES = 15 * 1024 * 1024;
const QUARANTINE_BUCKET = "upload-quarantine";

const POLICIES: Record<UploadPurpose, UploadPolicy> = {
  resume: {
    maxBytes: 5 * 1024 * 1024,
    allowedExtensions: new Set(["pdf", "doc", "docx"]),
    tooLargeMessage: "Resume must be 5 MB or smaller.",
    invalidTypeMessage: "Upload a PDF, DOC, or DOCX resume only.",
  },
  "lead-attachment": {
    maxBytes: 10 * 1024 * 1024,
    allowedExtensions: new Set(["pdf", "doc", "docx", "txt"]),
    tooLargeMessage: "Attachment must be 10 MB or smaller.",
    invalidTypeMessage: "Attach a PDF, DOC, DOCX, or TXT file only.",
  },
  avatar: {
    maxBytes: 3 * 1024 * 1024,
    allowedExtensions: new Set(["jpg", "jpeg", "png", "webp"]),
    tooLargeMessage: "Photo must be 3 MB or smaller.",
    invalidTypeMessage: "Upload a JPG, PNG, or WEBP photo only.",
  },
  "company-logo": {
    maxBytes: 3 * 1024 * 1024,
    allowedExtensions: new Set(["jpg", "jpeg", "png", "webp"]),
    tooLargeMessage: "Company logo must be 3 MB or smaller.",
    invalidTypeMessage: "Upload a JPG, PNG, or WEBP company logo.",
  },
};

function extensionFromName(name: string): ValidatedUpload["extension"] | null {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  const extension = match?.[1] as ValidatedUpload["extension"] | undefined;
  return extension && extension in MIME_BY_EXTENSION ? extension : null;
}

function startsWithBytes(buffer: Buffer, signature: number[]) {
  return signature.every((value, index) => buffer[index] === value);
}

function looksLikePdf(buffer: Buffer) {
  if (buffer.length < 8 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") return false;
  const tail = buffer.subarray(Math.max(0, buffer.length - 4096));
  return tail.includes(Buffer.from("%%EOF", "ascii"));
}

function looksLikeLegacyDoc(buffer: Buffer) {
  return buffer.length >= 8 && startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function looksLikePng(buffer: Buffer) {
  return buffer.length >= 8 && startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function looksLikeJpeg(buffer: Buffer) {
  return buffer.length >= 4 && startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
}

function looksLikeWebp(buffer: Buffer) {
  return buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

function looksLikeUtf8Text(buffer: Buffer) {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

async function validateDocxPackage(buffer: Buffer) {
  const zipMagic =
    startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08]);
  if (!zipMagic) return false;

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer, { createFolders: false });
  } catch {
    return false;
  }

  const entries = Object.values(zip.files);
  if (!entries.length || entries.length > MAX_DOCX_ENTRIES) return false;

  let totalUncompressed = 0;
  for (const entry of entries) {
    const internal = entry as typeof entry & {
      unsafeOriginalName?: string;
      _data?: { uncompressedSize?: number };
    };
    const originalName = internal.unsafeOriginalName || entry.name;

    if (
      originalName !== entry.name ||
      originalName.startsWith("/") ||
      originalName.includes("\\") ||
      originalName.split("/").includes("..")
    ) return false;

    if (/vbaProject\.bin$/i.test(entry.name) || /(^|\/)activeX\//i.test(entry.name)) return false;

    const size = Number(internal._data?.uncompressedSize ?? 0);
    if (!Number.isFinite(size) || size < 0 || size > MAX_DOCX_SINGLE_ENTRY_BYTES) return false;
    totalUncompressed += size;
    if (totalUncompressed > MAX_DOCX_UNCOMPRESSED_BYTES) return false;
  }

  const contentTypes = zip.file("[Content_Types].xml");
  const relationships = zip.file("_rels/.rels");
  const documentXml = zip.file("word/document.xml");
  if (!contentTypes || !relationships || !documentXml) return false;

  const contentTypesSize = Number(
    ((contentTypes as typeof contentTypes & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize) ?? 0
  );
  if (contentTypesSize > 1024 * 1024) return false;

  try {
    const xml = await contentTypes.async("string");
    return /wordprocessingml\.document\.main\+xml/i.test(xml) && !/macroEnabled/i.test(xml);
  } catch {
    return false;
  }
}

async function contentsMatchExtension(buffer: Buffer, extension: ValidatedUpload["extension"]) {
  switch (extension) {
    case "pdf":
      return looksLikePdf(buffer);
    case "doc":
      return looksLikeLegacyDoc(buffer);
    case "docx":
      return validateDocxPackage(buffer);
    case "txt":
      return looksLikeUtf8Text(buffer);
    case "jpg":
    case "jpeg":
      return looksLikeJpeg(buffer);
    case "png":
      return looksLikePng(buffer);
    case "webp":
      return looksLikeWebp(buffer);
  }
}

function localMalwareSignatureDetected(buffer: Buffer) {
  // The standard EICAR antivirus test signature is assembled at runtime so
  // repository scanners do not mistake this source file itself for malware.
  const marker = ["X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR", "-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"].join("");
  return buffer.includes(Buffer.from(marker, "ascii"));
}

async function scanForMalware(upload: ValidatedUpload) {
  if (localMalwareSignatureDetected(upload.buffer)) {
    throw new Error("The uploaded file was rejected by the security scanner.");
  }

  const endpoint = process.env.MALWARE_SCAN_ENDPOINT?.trim() || "";
  const token = process.env.MALWARE_SCAN_TOKEN?.trim() || "";
  const required = process.env.NODE_ENV === "production" || process.env.MALWARE_SCAN_REQUIRED === "1";

  if (!endpoint) {
    if (required) throw new Error("File scanning is temporarily unavailable. Please try again later.");
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("File scanning is temporarily unavailable. Please try again later.");
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new Error("File scanning is temporarily unavailable. Please try again later.");
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(upload.buffer)], { type: upload.contentType }),
    `upload.${upload.extension}`
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  timeout.unref?.();

  try {
    const response = await fetch(parsed, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("scanner unavailable");

    const result = await response.json().catch(() => null) as { clean?: boolean } | null;
    if (result?.clean !== true) {
      throw new Error("The uploaded file was rejected by the security scanner.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("rejected by the security scanner")) throw error;
    throw new Error("File scanning is temporarily unavailable. Please try again later.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateUpload(
  value: FormDataEntryValue | null,
  purpose: UploadPurpose,
): Promise<ValidatedUpload | null> {
  if (!(value instanceof File) || value.size === 0) return null;

  const policy = POLICIES[purpose];
  if (value.size > policy.maxBytes) throw new Error(policy.tooLargeMessage);

  const extension = extensionFromName(value.name);
  if (!extension || !policy.allowedExtensions.has(extension)) throw new Error(policy.invalidTypeMessage);

  const expectedMime = MIME_BY_EXTENSION[extension];
  const declaredMime = value.type.toLowerCase().trim();
  if (!GENERIC_MIME.has(declaredMime) && declaredMime !== expectedMime) {
    throw new Error("The uploaded file type does not match its file name.");
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  if (buffer.length !== value.size || !(await contentsMatchExtension(buffer, extension))) {
    throw new Error(
      IMAGE_EXTENSIONS.has(extension)
        ? "The uploaded image contents do not match its file name."
        : "The uploaded file contents do not match its file name."
    );
  }

  return {
    buffer,
    extension,
    contentType: expectedMime,
    originalName: value.name.slice(0, 255),
    size: value.size,
  };
}

function cleanPrefix(prefix: string) {
  const normalized = prefix.replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.split("/").some((part) => !/^[a-zA-Z0-9_-]+$/.test(part))) {
    throw new Error("Invalid secure upload destination.");
  }
  return normalized;
}

export async function quarantineScanAndStoreUpload(args: {
  upload: ValidatedUpload;
  targetBucket: string;
  targetPrefix: string;
}) {
  const admin = createAdminClient();
  const prefix = cleanPrefix(args.targetPrefix);
  const quarantinePath = `_quarantine/${randomUUID()}.${args.upload.extension}`;
  const finalPath = `${prefix}/${randomUUID()}.${args.upload.extension}`;

  const { error: quarantineError } = await admin.storage.from(QUARANTINE_BUCKET).upload(
    quarantinePath,
    args.upload.buffer,
    {
      upsert: false,
      contentType: args.upload.contentType,
      cacheControl: "0",
    }
  );
  if (quarantineError) throw new Error("We could not quarantine this upload safely.");

  try {
    await scanForMalware(args.upload);

    const { error: releaseError } = await admin.storage.from(args.targetBucket).upload(
      finalPath,
      args.upload.buffer,
      {
        upsert: false,
        contentType: args.upload.contentType,
        cacheControl: "3600",
      }
    );
    if (releaseError) throw releaseError;

    return finalPath;
  } finally {
    const { error: cleanupError } = await admin.storage.from(QUARANTINE_BUCKET).remove([quarantinePath]);
    if (cleanupError) console.error("[file-security] failed to delete quarantine object", { quarantinePath, message: cleanupError.message });
  }
}
