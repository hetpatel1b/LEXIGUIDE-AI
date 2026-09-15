import { extractText, getMeta } from "unpdf";
import type { RawParsedDocument, RawParsedPage } from "../types";
import type { DocumentParser } from "./types";
import { createDocumentError } from "../errors";
import { FILE_CONSTRAINTS } from "@/lib/constants";

export class PdfParser implements DocumentParser {
  public async parse(buffer: Buffer): Promise<RawParsedDocument> {
    try {
      const uint8Array = new Uint8Array(buffer);

      // 1. Extract text page-by-page preserving boundaries
      const { totalPages, text: pageTexts } = await extractText(uint8Array, {
        mergePages: false,
      });

      if (totalPages === 0 || !pageTexts || pageTexts.length === 0) {
        throw createDocumentError(
          "EMPTY_DOCUMENT",
          "This PDF document contains 0 pages."
        );
      }

      if (totalPages > FILE_CONSTRAINTS.maxPages) {
        throw createDocumentError(
          "PAGE_LIMIT_EXCEEDED",
          `This PDF contains ${totalPages} pages, exceeding the maximum allowed limit of ${FILE_CONSTRAINTS.maxPages} pages.`
        );
      }

      // 2. Check for image-only / scanned PDFs with no readable text
      const combinedLength = pageTexts.reduce((acc, p) => acc + p.trim().length, 0);
      if (combinedLength === 0) {
        throw createDocumentError(
          "NO_READABLE_TEXT",
          "No readable text was found in this PDF. The document appears to be a scanned image or photograph."
        );
      }

      // 3. Construct structured pages with true 1-based page numbers
      const pages: RawParsedPage[] = pageTexts.map((text, idx) => ({
        pageNumber: idx + 1,
        rawText: text || "",
      }));

      // 4. Safely extract PDF container metadata
      let extractedMetadata = {};
      try {
        const meta = await getMeta(uint8Array);
        if (meta && meta.info) {
          const info = meta.info as Record<string, unknown>;
          extractedMetadata = {
            title: typeof info.Title === "string" ? info.Title.trim() : undefined,
            author: typeof info.Author === "string" ? info.Author.trim() : undefined,
            creator: typeof info.Creator === "string" ? info.Creator.trim() : undefined,
            producer: typeof info.Producer === "string" ? info.Producer.trim() : undefined,
            creationDate: typeof info.CreationDate === "string" ? info.CreationDate : undefined,
            modificationDate: typeof info.ModDate === "string" ? info.ModDate : undefined,
          };
        }
      } catch {
        // Metadata extraction is non-critical; fallback silently
        extractedMetadata = {};
      }

      return {
        format: "pdf",
        pages,
        extractedMetadata,
      };
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        err.name === "DocumentEngineError"
      ) {
        throw err;
      }

      // Handle password protected, corrupt, or truncated PDFs
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("encrypted")) {
        throw createDocumentError(
          "PARSING_ERROR",
          "This PDF is password-protected or encrypted. Please remove password protection before uploading."
        );
      }

      throw createDocumentError(
        "CORRUPTED_DOCUMENT",
        "The PDF document could not be read. It may be corrupted or invalid."
      );
    }
  }
}
