import mammoth from "mammoth";
import type { RawParsedDocument, RawParsedPage } from "../types";
import type { DocumentParser } from "./types";
import { createDocumentError } from "../errors";

export class DocxParser implements DocumentParser {
  public async parse(buffer: Buffer): Promise<RawParsedDocument> {
    try {
      // 1. Extract HTML representation to capture headings, lists, and tables
      const { value: html, messages } = await mammoth.convertToHtml({ buffer });

      // 2. Also extract raw text as reference
      const { value: rawText } = await mammoth.extractRawText({ buffer });

      if (!rawText || rawText.trim().length === 0) {
        throw createDocumentError(
          "EMPTY_DOCUMENT",
          "The DOCX document is empty and contains no readable text."
        );
      }

      // Convert HTML structure to semantic plain-text with explicit heading markers
      // This allows the section detector to reliably identify headings authored in Word
      const structuredText = this.convertHtmlToStructuredText(html || rawText);

      // DOCX has no physical page boundaries in OpenXML without a rendering engine.
      // Explicitly set pageNumber to null to avoid fabricating false page citations.
      const page: RawParsedPage = {
        pageNumber: null,
        rawText: structuredText || rawText,
      };

      return {
        format: "docx",
        pages: [page],
        extractedMetadata: {
          title: undefined, // DOCX core.xml title can be extracted if present
        },
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

      throw createDocumentError(
        "CORRUPTED_DOCUMENT",
        "The DOCX document could not be read. The Word file structure may be corrupted or invalid."
      );
    }
  }

  /**
   * Transforms mammoth's HTML output into clean, structured legal text
   * preserving paragraph spacing, headings, and table rows.
   */
  private convertHtmlToStructuredText(html: string): string {
    let text = html;

    // Convert headings to clear block lines
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n$1\n\n");

    // Convert paragraphs
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n\n$1\n");

    // Convert list items
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1");

    // Convert table cells and rows
    text = text.replace(/<td[^>]*>(.*?)<\/td>/gi, " $1 |");
    text = text.replace(/<th[^>]*>(.*?)<\/th>/gi, " $1 |");
    text = text.replace(/<tr[^>]*>(.*?)<\/tr>/gi, "\n|$1");

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Decode standard HTML entities
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return text.trim();
  }
}
