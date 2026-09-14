/**
 * Text normalization utilities preserving legal fidelity.
 * Normalizes only whitespace and line endings; NEVER modifies legal terms,
 * clause numbers, punctuation, casing, or grammar.
 */
export function normalizeText(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;

  // 1. Normalize line breaks: CRLF (\r\n) and CR (\r) -> LF (\n)
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove null bytes and non-printable control characters (preserve tabs and newlines)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Normalize horizontal whitespace (tabs, non-breaking spaces)
  text = text.replace(/[\t\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");

  // 4. Collapse runs of spaces (e.g. 4 spaces -> 1 space, but preserve newlines)
  text = text.replace(/[ ]{2,}/g, " ");

  // 5. Trim trailing whitespace from each line
  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  // 6. Collapse excessive blank lines: 3 or more consecutive newlines -> 2 newlines (standard paragraph break)
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Calculates standard text statistics without mutating text.
 */
export function calculateTextStats(text: string): {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  paragraphCount: number;
} {
  const characterCount = text.length;

  if (characterCount === 0) {
    return { characterCount: 0, wordCount: 0, lineCount: 0, paragraphCount: 0 };
  }

  // Word count: split on whitespace sequences
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Line count: split on newlines
  const lines = text.split("\n");
  const lineCount = lines.length;

  // Paragraph count: split on double newlines
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  return {
    characterCount,
    wordCount,
    lineCount,
    paragraphCount,
  };
}
