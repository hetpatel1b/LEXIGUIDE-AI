import type { RawParsedDocument, RawParsedPage } from "../types";
import type { DocumentParser } from "./types";
import { createDocumentError } from "../errors";

export class TxtParser implements DocumentParser {
  public async parse(buffer: Buffer): Promise<RawParsedDocument> {
    if (!buffer || buffer.length === 0) {
      throw createDocumentError(
        "EMPTY_DOCUMENT",
        "The text document is empty (0 bytes)."
      );
    }

    let text: string;
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      text = decoder.decode(buffer);
    } catch {
      // Fallback with replacement characters if not strict UTF-8
      text = buffer.toString("utf-8");
    }

    // Strip BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    // Check if trimmed text is empty
    if (!text.trim()) {
      throw createDocumentError(
        "EMPTY_DOCUMENT",
        "The text document contains only whitespace characters."
      );
    }

    // Plain text has no physical pages; set pageNumber to null
    const page: RawParsedPage = {
      pageNumber: null,
      rawText: text,
    };

    return {
      format: "txt",
      pages: [page],
      extractedMetadata: {},
    };
  }
}
