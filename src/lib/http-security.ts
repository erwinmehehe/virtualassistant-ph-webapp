import "server-only";

import { timingSafeEqual } from "node:crypto";

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "RequestBodyTooLargeError";
  }
}

export function bearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice(7).trim();
}

export function timingSafeSecretMatches(candidate: string | null | undefined, expected: string | null | undefined) {
  const supplied = String(candidate || "");
  const secret = String(expected || "");
  if (!supplied || !secret) return false;

  const suppliedBytes = Buffer.from(supplied, "utf8");
  const expectedBytes = Buffer.from(secret, "utf8");
  if (suppliedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(suppliedBytes, expectedBytes);
}


export function isExplicitCrossSiteRequest(request: Request) {
  return request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site";
}

export async function readRequestText(request: Request, maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error("maxBytes must be a positive safe integer.");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return body;
  } finally {
    reader.releaseLock();
  }
}

export async function readRequestJson<T = unknown>(request: Request, maxBytes: number): Promise<T> {
  const body = await readRequestText(request, maxBytes);
  return JSON.parse(body) as T;
}
