import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analysis/analysis-service";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";
import type { NormalizedDocument } from "@/lib/document-engine/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/analysis
 * Accepts a NormalizedDocument, processes it through NVIDIA Nemotron,
 * validates the output and source evidence, and returns structured AnalysisResult.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  console.log(`[AI-DIAG] POST /api/analysis request received at T+0ms`);

  try {
    const body = await request.json();

    if (!body || !body.document) {
      console.warn(`[AI-DIAG] POST /api/analysis rejected: missing 'document' payload`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required 'document' in request payload.",
          },
        },
        { status: 400 }
      );
    }

    const document = body.document as NormalizedDocument;

    if (!document.id || !document.chunks || !Array.isArray(document.chunks)) {
      console.warn(`[AI-DIAG] POST /api/analysis rejected: invalid document structure`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid document structure. Document must contain chunks.",
          },
        },
        { status: 400 }
      );
    }

    if (document.chunks.length === 0) {
      console.warn(`[AI-DIAG] POST /api/analysis rejected: empty document chunks`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_DOCUMENT",
            message: "The document contains no readable text chunks to analyze.",
          },
        },
        { status: 422 }
      );
    }

    console.log(`[AI-DIAG] Analyzing document id=${document.id}, title=${document.displayName}, chunks=${document.chunks.length}`);
    const result = await analyzeDocument(document);

    const totalDuration = Date.now() - reqStart;
    console.log(`[AI-DIAG] POST /api/analysis completed successfully in ${totalDuration}ms`);

    return NextResponse.json(
      {
        success: true,
        data: result,
        timestamp: Date.now(),
        durationMs: totalDuration,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof AiEngineError) {
      console.error(
        `[AI-DIAG] POST /api/analysis failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: toSafeUserMessage(error),
          },
        },
        { status: error.statusCode }
      );
    }

    const safeMessage = toSafeUserMessage(error);
    console.error(
      `[AI-DIAG] POST /api/analysis unexpected error after ${totalDuration}ms: ${safeMessage}`
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_UNKNOWN_ERROR",
          message: safeMessage,
        },
      },
      { status: 500 }
    );
  }
}
