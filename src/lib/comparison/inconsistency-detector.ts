import type { NormalizedDocument, DocumentChunk, DocumentSection } from "@/lib/document-engine/types";
import type { ComparisonInconsistency } from "@/types/comparison";
import { extractNumericTokens } from "./diff-engine";

interface InternalCandidate {
  section: DocumentSection;
  chunk: DocumentChunk;
  topic: "payment" | "notice" | "arbitration" | "governing_law";
  terms: string[];
}

/**
 * Scans a single document for potentially conflicting internal provisions.
 * For example: Section 4 specifies 30 days for payment, but Schedule B specifies 15 days.
 */
export function detectInternalInconsistencies(doc: NormalizedDocument): ComparisonInconsistency[] {
  const inconsistencies: ComparisonInconsistency[] = [];
  const chunks = doc.chunks || [];
  const sections = doc.sections || [];

  const candidates: InternalCandidate[] = [];

  for (const chunk of chunks) {
    const rawText = chunk.text.replace(/\(\s*(\d+)\s*\)/g, "$1");
    const text = rawText.toLowerCase();
    const section = sections.find((s) => s.sectionId === chunk.sectionId) || {
      sectionId: chunk.sectionId,
      sectionNumber: chunk.sectionNumber,
      title: chunk.sectionTitle || "Document Section",
      startOffset: 0,
      endOffset: 0,
      pageReferences: chunk.pageNumbers || [1],
      chunkIds: [chunk.chunkId],
      characterCount: chunk.text.length,
    };

    // 1. Payment deadlines / terms
    if (text.includes("payment") || text.includes("payable") || text.includes("invoice") || text.includes("paid")) {
      const days = rawText.match(/\b(\d+)\s*(?:calendar\s*)?(?:business\s*)?days?\b/gi);
      if (days && days.length > 0) {
        candidates.push({
          section,
          chunk,
          topic: "payment",
          terms: days.map((d) => d.toLowerCase().trim()),
        });
      }
    }

    // 2. Notice periods
    if (text.includes("notice period") || (text.includes("notice") && text.includes("written notice"))) {
      const noticeDays = rawText.match(/\b(\d+)\s*(?:calendar\s*)?(?:business\s*)?days?\b/gi);
      if (noticeDays && noticeDays.length > 0) {
        candidates.push({
          section,
          chunk,
          topic: "notice",
          terms: noticeDays.map((d) => d.toLowerCase().trim()),
        });
      }
    }

    // 3. Arbitration seats
    if (text.includes("arbitration") && (text.includes("seat") || text.includes("venue") || text.includes("place of arbitration"))) {
      const seats = ["mumbai", "delhi", "bengaluru", "bangalore", "london", "singapore", "new york"];
      const matched = seats.filter((s) => text.includes(s));
      if (matched.length > 0) {
        candidates.push({
          section,
          chunk,
          topic: "arbitration",
          terms: matched,
        });
      }
    }
  }

  // Compare candidate pairs across different sections within the document
  let incId = 1;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const candA = candidates[i];
      const candB = candidates[j];

      // Only compare distinct sections for the same topic
      if (candA.section.sectionId === candB.section.sectionId) continue;
      if (candA.topic !== candB.topic) continue;

      // Check if candidate terms strictly conflict (e.g. 30 days vs 15 days)
      const conflictFound = candA.terms.some((tA) => !candB.terms.includes(tA)) &&
                            candB.terms.some((tB) => !candA.terms.includes(tB));

      if (conflictFound) {
        // Guard against false positives: check if one clause explicitly qualifies
        // "unless otherwise specified in schedule" or "in the event of dispute"
        const textA = candA.chunk.text.toLowerCase();
        const textB = candB.chunk.text.toLowerCase();
        const hasCarveout =
          textA.includes("except as") ||
          textA.includes("subject to schedule") ||
          textB.includes("notwithstanding") ||
          textB.includes("override");

        if (!hasCarveout) {
          const titleTopic =
            candA.topic === "payment"
              ? "Payment Deadline"
              : candA.topic === "notice"
              ? "Notice Period"
              : "Arbitration Seat";

          inconsistencies.push({
            id: `inc_${incId++}`,
            title: `Potential Inconsistency in ${titleTopic}`,
            inconsistencyType: "internal",
            documentId: doc.id,
            documentName: doc.displayName,
            severity: "major",
            provisionA: {
              sectionTitle: candA.section.title,
              pageNumber: candA.chunk.pageNumbers?.[0] || 1,
              quote: candA.chunk.text.slice(0, 200),
              chunkId: candA.chunk.chunkId,
            },
            provisionB: {
              sectionTitle: candB.section.title,
              pageNumber: candB.chunk.pageNumbers?.[0] || 1,
              quote: candB.chunk.text.slice(0, 200),
              chunkId: candB.chunk.chunkId,
            },
            explanation: `These provisions appear to specify different terms (${candA.terms.join(", ")} vs ${candB.terms.join(", ")}) for the same category of obligation within this document.`,
            whyItMatters:
              "Potential conflict requiring review. Discrepancies between main clauses and schedules or cross-sections can cause ambiguity during contract performance or enforcement.",
            suggestedReviewQuestion: `Which provision governs the ${candA.topic}: ${candA.section.title} or ${candB.section.title}?`,
          });
        }
      }
    }
  }

  return inconsistencies;
}

/**
 * Detects potential inconsistencies across documents or within Document B and Document A.
 */
export function detectAllInconsistencies(
  docA: NormalizedDocument,
  docB: NormalizedDocument
): ComparisonInconsistency[] {
  const incA = detectInternalInconsistencies(docA);
  const incB = detectInternalInconsistencies(docB);

  // Return unique inconsistencies (prioritizing Document B, then Document A)
  const combined = [...incB, ...incA];
  const seen = new Set<string>();
  const unique: ComparisonInconsistency[] = [];

  for (const inc of combined) {
    const key = `${inc.provisionA.quote.slice(0, 50)}|||${inc.provisionB.quote.slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(inc);
    }
  }

  return unique;
}
