import type { ComparisonChange } from "@/types/comparison";
import type { ChatMessage } from "@/lib/ai/client/types";

export interface ComparisonPromptContext {
  messages: ChatMessage[];
  contextChars: number;
  estimatedInputTokens: number;
  clauseCount: number;
}

const COMPARISON_SYSTEM_PROMPT = `You are LexiGuide AI's Senior Legal Comparison Engine.
Your role is to analyze pairs of changed legal provisions between an original contract (Version A) and a revised contract (Version B).

TASK:
For each provided changed clause pair:
1. Explain concisely what substantively changed between Version A and Version B.
2. Explain "why this matters" using cautious, balanced legal information language.
   - Focus on practical, commercial, or operational implications (e.g., notice obligations, payment timelines, risk allocation).
   - NEVER make unsupported definitive legal conclusions (do NOT write "this clause is illegal", "unenforceable", or "invalid").
   - Use phrasing like "This revision extends the notice period...", "This changes the stated obligation...", "Review whether this aligns with...".
3. Provide a suggested follow-up review question that a legal or business reviewer should ask.
4. Assess materiality severity: "major" for core economic, termination, liability, or restrictive covenant shifts; "moderate" for scope or procedural updates; "minor" for clarification or limited wording edits.

OUTPUT FORMAT:
You must respond with ONLY a valid JSON object matching this schema:
{
  "changes": [
    {
      "changeId": "chg_1",
      "title": "Clause Title",
      "severity": "major",
      "explanation": "Concise summary of substantive changes.",
      "whyItMatters": "Balanced explanation of practical and review implications.",
      "suggestedReviewQuestion": "Targeted question for the reviewer."
    }
  ],
  "inconsistencies": []
}`;

/**
 * Builds a focused, bounded comparison context for Nemotron.
 * Target: ~3-10K characters, containing ONLY the changed clause pairs.
 */
export function buildComparisonAiContext(
  docAName: string,
  docBName: string,
  changedClauses: ComparisonChange[],
  maxClauses = 12
): ComparisonPromptContext {
  // Cap at maxClauses to stay strictly within prompt budget
  const selectedClauses = changedClauses.slice(0, maxClauses);

  let promptContent = `Compare the following substantive revisions between:\n`;
  promptContent += `Document A (Original): "${docAName}"\n`;
  promptContent += `Document B (Updated): "${docBName}"\n\n`;

  for (const chg of selectedClauses) {
    promptContent += `--- CLAUSE COMPARISON: ${chg.id} ---\n`;
    promptContent += `Title: ${chg.clauseTitle} (${chg.category})\n`;
    promptContent += `Status: ${(chg.status || "modified").toUpperCase()}\n`;
    promptContent += `[DOCUMENT A: ${chg.sectionA} (Page ${chg.pageA})]\n`;
    promptContent += `${chg.docAContent || "No corresponding provision found in Document A."}\n\n`;
    promptContent += `[DOCUMENT B: ${chg.sectionB} (Page ${chg.pageB})]\n`;
    promptContent += `${chg.docBContent || "No corresponding provision found in Document B."}\n\n`;
  }

  promptContent += `Provide the structured JSON response with "changes" for each clause ID.`;

  const messages: ChatMessage[] = [
    { role: "system", content: COMPARISON_SYSTEM_PROMPT },
    { role: "user", content: promptContent },
  ];

  const totalChars = COMPARISON_SYSTEM_PROMPT.length + promptContent.length;
  const estimatedInputTokens = Math.ceil(totalChars / 4);

  return {
    messages,
    contextChars: totalChars,
    estimatedInputTokens,
    clauseCount: selectedClauses.length,
  };
}
