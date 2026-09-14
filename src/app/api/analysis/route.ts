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
  const headerReqId = request.headers.get("x-analysis-request-id");
  let requestId = headerReqId || `ana_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  let reqTag = `[${requestId}]`;

  console.log(`[AI-DIAG]${reqTag} POST /api/analysis request received at T+0ms`);

  try {
    const body = await request.json();

    if (body?.requestId && !headerReqId) {
      requestId = String(body.requestId);
      reqTag = `[${requestId}]`;
    }

    if (!body || !body.document) {
      console.warn(`[AI-DIAG]${reqTag} POST /api/analysis rejected: missing 'document' payload`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required 'document' in request payload.",
          },
        },
        {
          status: 400,
          headers: { "x-analysis-request-id": requestId },
        }
      );
    }

    const document = body.document as NormalizedDocument;

    if (!document.id || !document.chunks || !Array.isArray(document.chunks)) {
      console.warn(`[AI-DIAG]${reqTag} POST /api/analysis rejected: invalid document structure`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid document structure. Document must contain chunks.",
          },
        },
        {
          status: 400,
          headers: { "x-analysis-request-id": requestId },
        }
      );
    }

    if (document.chunks.length === 0) {
      console.warn(`[AI-DIAG]${reqTag} POST /api/analysis rejected: empty document chunks`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_DOCUMENT",
            message: "The document contains no readable text chunks to analyze.",
          },
        },
        {
          status: 422,
          headers: { "x-analysis-request-id": requestId },
        }
      );
    }

    console.log(
      `[AI-DIAG]${reqTag} Analyzing document id=${document.id}, title=${document.displayName}, chunks=${document.chunks.length}`
    );
    const result = await analyzeDocument(document, undefined, requestId);

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[AI-DIAG]${reqTag} POST /api/analysis completed successfully in ${totalDuration}ms`
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
        timestamp: Date.now(),
        durationMs: totalDuration,
        requestId,
      },
      {
        status: 200,
        headers: { "x-analysis-request-id": requestId },
      }
    );
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof AiEngineError) {
      console.error(
        `[AI-DIAG]${reqTag} POST /api/analysis failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: toSafeUserMessage(error),
          },
          requestId,
        },
        {
          status: error.statusCode,
          headers: { "x-analysis-request-id": requestId },
        }
      );
    }

    const safeMessage = toSafeUserMessage(error);
    console.error(
      `[AI-DIAG]${reqTag} POST /api/analysis unexpected error after ${totalDuration}ms: ${safeMessage}`
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_UNKNOWN_ERROR",
          message: safeMessage,
        },
        requestId,
      },
      {
        status: 500,
        headers: { "x-analysis-request-id": requestId },
      }
    );
  }
}
