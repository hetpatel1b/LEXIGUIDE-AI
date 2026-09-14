import type { DocumentType } from "@/types/document";
import type { DocumentParser } from "./types";
import { PdfParser } from "./pdf-parser";
import { DocxParser } from "./docx-parser";
import { TxtParser } from "./txt-parser";
import { createDocumentError } from "../errors";

export * from "./types";
export * from "./pdf-parser";
export * from "./docx-parser";
export * from "./txt-parser";

export function getParserForFormat(format: DocumentType): DocumentParser {
  switch (format) {
    case "pdf":
      return new PdfParser();
    case "docx":
      return new DocxParser();
    case "txt":
      return new TxtParser();
    default:
      throw createDocumentError(
        "UNSUPPORTED_FILE_TYPE",
        `Unsupported document format: ${format}`
      );
  }
}
