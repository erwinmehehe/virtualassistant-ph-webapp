import "server-only";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function safeFilename(value: string, fallback: string) {
  const cleaned = value
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/]/g, "-")
    .trim()
    .slice(0, 180);
  return cleaned || fallback;
}

function asciiFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._ -]/g, "_");
}

export function extensionFromStoragePath(path: string) {
  const extension = path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "";
  return ["pdf", "doc", "docx", "txt"].includes(extension) ? extension : "";
}

export async function privateStorageDownloadResponse(args: {
  bucket: string;
  path: string;
  downloadName: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(args.bucket).download(args.path);
  if (error || !data) return null;

  const filename = safeFilename(args.downloadName, "download");
  const ascii = asciiFilename(filename) || "download";
  const bytes = await data.arrayBuffer();

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store, max-age=0",
      "Pragma": "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
