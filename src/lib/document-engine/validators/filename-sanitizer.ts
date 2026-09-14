import crypto from "node:crypto";
import path from "node:path";

export interface SanitizedFilenameInfo {
  internalId: string;
  displayName: string;
  extension: string;
}

/**
 * Sanitizes untrusted user filenames to prevent path traversal,
 * control character injection, and denial of service.
 * Never uses the user filename as a server filesystem path.
 */
export function sanitizeFilename(rawFilename: string): SanitizedFilenameInfo {
  // 1. Generate an unforgeable internal identifier
  const internalId = `doc_${crypto.randomUUID().replace(/-/g, "")}`;

  if (!rawFilename || typeof rawFilename !== "string") {
    return {
      internalId,
      displayName: "document",
      extension: "",
    };
  }

  // 2. Strip null bytes and control characters
  let cleanName = rawFilename
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .trim();

  // 3. Extract basename to defeat path traversal attacks (../, ..\, /etc/passwd, C:\windows)
  cleanName = path.basename(cleanName);

  // 4. Remove leading/trailing dots and slashes
  cleanName = cleanName.replace(/^[./\\]+/, "").replace(/[./\\]+$/, "");

  // 5. Extract extension safely
  const extMatch = cleanName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extMatch ? `.${extMatch[1].toLowerCase()}` : "";

  // 6. Enforce safe length limit (max 255 chars, keeping extension intact)
  const maxBaseLen = 255 - extension.length;
  const baseName = cleanName.slice(0, cleanName.length - extension.length);
  const safeBase = baseName.slice(0, Math.max(1, maxBaseLen)) || "document";

  const displayName = `${safeBase}${extension}`;

  return {
    internalId,
    displayName,
    extension,
  };
}
