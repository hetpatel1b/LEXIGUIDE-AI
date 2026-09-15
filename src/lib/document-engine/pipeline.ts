import type { DocumentPage, NormalizedDocument, ChunkerOptions } from "./types";
import { validateDocumentFile } from "./validators";
import { getParserForFormat } from "./parsers";
import { normalizeText, calculateTextStats } from "./normalizer/normalizer";
import { detectSections } from "./section-detector";
import { chunkDocument } from "./chunker";
import { createDocumentError } from "./errors";
import { FILE_CONSTRAINTS } from "@/lib/constants";
import { createHash } from "crypto";
import { ServerResultCache } from "@/lib/cache/server-result-cache";

const globalProcessCache = new ServerResultCache();

export interface PipelineOptions {
  chunkerOptions?: ChunkerOptions;
}

/**
 * End-to-end legal document processing pipeline.
 *
 * Sequence:
 * 1. Authoritative Validation (size, mime, magic bytes, non-empty)
 * 2. Safe Filename Sanitization & Secure ID Generation
 * 3. Format-Specific In-Memory Parser (PDF, DOCX, TXT)
 * 4. Text Normalization (preserving legal terminology and punctuation)
 * 5. Page Mapping & Offset Registration
 * 6. Deterministic Section Detection
 * 7. Boundary-Aware Legal Chunking
 * 8. Canonical Document Assembly
 */
export async function processDocument(
  fileBuffer: Buffer,
  rawFilename: string,
  declaredMimeType?: string,
  options?: PipelineOptions
): Promise<NormalizedDocument> {
  // 1. Authoritative Server-Side Validation
  const validated = validateDocumentFile(fileBuffer, rawFilename, declaredMimeType);
  const documentId = validated.filenameInfo.internalId;

  // Hash the valid buffer for deduplication cache
  const fileHash = createHash("sha256").update(validated.buffer).digest("hex");

  const cachedResult = await globalProcessCache.getOrCompute(
    fileHash,
    "global_process",
    async () => {
      // 2. Format-Specific Parsing
      const parser = getParserForFormat(validated.format);
      const rawParsed = await parser.parse(validated.buffer);

      if (rawParsed.pages.length > FILE_CONSTRAINTS.maxPages) {
        throw createDocumentError(
          "PAGE_LIMIT_EXCEEDED",
          `Document contains ${rawParsed.pages.length} pages, exceeding the maximum allowed limit of ${FILE_CONSTRAINTS.maxPages} pages.`
        );
      }

      // 3. Text Normalization & Page Mapping
      const pages: DocumentPage[] = [];
      let currentOffset = 0;
      const fullTextParts: string[] = [];

      for (let idx = 0; idx < rawParsed.pages.length; idx++) {
        const rawPage = rawParsed.pages[idx];
        const normalizedPageText = normalizeText(rawPage.rawText);

        const startOffset = currentOffset;
        const characterCount = normalizedPageText.length;
        const endOffset = startOffset + characterCount;

        const pageWords = normalizedPageText.trim()
          ? normalizedPageText.trim().split(/\s+/).filter(Boolean).length
          : 0;

        const pageId =
          rawPage.pageNumber !== null
            ? `page_${documentId}_${rawPage.pageNumber}`
            : `page_${documentId}_${idx + 1}`;

        pages.push({
          pageId,
          pageNumber: rawPage.pageNumber,
          text: normalizedPageText,
          startOffset,
          endOffset,
          characterCount,
          wordCount: pageWords,
        });

        fullTextParts.push(normalizedPageText);
        currentOffset = endOffset + 2;
      }

      const fullText = fullTextParts.join("\n\n");
      const stats = calculateTextStats(fullText);

      // 4. Deterministic Legal Section Detection
      const initialSections = detectSections(fullText, pages, documentId);

      // 5. Deterministic Boundary-Aware Chunking
      const { chunks, updatedSections } = chunkDocument(
        fullText,
        initialSections,
        pages,
        documentId,
        options?.chunkerOptions
      );

      // 6. Build Canonical Normalized Document
      const normalizedDoc: NormalizedDocument = {
        id: documentId,
        originalFilename: rawFilename,
        displayName: validated.filenameInfo.displayName,
        format: validated.format,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        pageCount: validated.format === "pdf" ? pages.length : null,
        characterCount: stats.characterCount,
        wordCount: stats.wordCount,
        lineCount: stats.lineCount,
        paragraphCount: stats.paragraphCount,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
        source: "user-upload",
        extractedMetadata: rawParsed.extractedMetadata,
        pages,
        sections: updatedSections,
        chunks,
      };

      return normalizedDoc;
    }
  );

  // 7. Clone and overwrite request-specific metadata
  const clonedDoc = JSON.parse(JSON.stringify(cachedResult)) as NormalizedDocument;
  
  clonedDoc.id = documentId;
  clonedDoc.originalFilename = rawFilename;
  clonedDoc.displayName = validated.filenameInfo.displayName;
  clonedDoc.uploadedAt = new Date().toISOString();

  // Rewrite internal IDs if served from cache
  const oldDocId = cachedResult.id;
  if (oldDocId !== documentId) {
    for (const p of clonedDoc.pages) p.pageId = p.pageId.replace(oldDocId, documentId);
    for (const s of clonedDoc.sections) {
      s.sectionId = s.sectionId.replace(oldDocId, documentId);
      s.chunkIds = s.chunkIds.map((cid) => cid.replace(oldDocId, documentId));
    }
    for (const c of clonedDoc.chunks) c.chunkId = c.chunkId.replace(oldDocId, documentId);
  }

  return clonedDoc;
}
