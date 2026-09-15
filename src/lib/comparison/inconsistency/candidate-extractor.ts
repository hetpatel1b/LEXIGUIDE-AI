import type { DocumentChunk, DocumentSection } from "@/lib/document-engine/types";
import { NormalizedObligation } from "./types";
import { isNonOperativeSection, parseClauseUnits, extractQualifiers, checkNegation } from "./text-patterns";
import { ALL_RULES } from "./rules";

/**
 * Analyzes a document chunk and extracts normalized contractual obligations.
 * Returns empty array if the chunk does not describe an operative obligation subject to conflict detection.
 */
export function extractCandidateObligations(
  chunk: DocumentChunk,
  section: DocumentSection
): NormalizedObligation[] {
  const sectionTitle = section.title || chunk.sectionTitle || "Document Section";

  // If inside a non-operative section (e.g. Recitals), do not extract operative obligations
  if (isNonOperativeSection(sectionTitle)) {
    return [];
  }

  const clauseUnits = parseClauseUnits(chunk.text, sectionTitle);
  const obligations: NormalizedObligation[] = [];

  for (const unit of clauseUnits) {
    // Skip clause unit if its local heading is non-operative
    if (isNonOperativeSection(unit.heading)) {
      continue;
    }

    const unitText = unit.text;
    const qualifiers = extractQualifiers(unitText);
    const cleanedText = unitText.replace(/\(\s*(\d+)\s*\)/g, " $1 ");

    // Extract using all registered rules
    for (const rule of ALL_RULES) {
      const extracted = rule.extract(unit, qualifiers, cleanedText);
      if (extracted) {
        // Negation check
        if (checkNegation(unitText)) {
          extracted.isNegation = true;
        }
        obligations.push(extracted);
      }
    }
  }

  return obligations;
}
