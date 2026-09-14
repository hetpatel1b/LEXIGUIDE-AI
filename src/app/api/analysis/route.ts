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
  try {
    const body = await request.json();

    if (!body || !body.document) {
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

    const result = await analyzeDocument(document);

    return NextResponse.json(
      {
        success: true,
        data: result,
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AiEngineError) {
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
