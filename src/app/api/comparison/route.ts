import { NextRequest, NextResponse } from "next/server";
import { compareDocuments } from "@/lib/comparison/comparison-service";
import { ComparisonEngineError } from "@/lib/comparison/errors";
import { serverDocumentStore } from "@/lib/server-document-store";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/comparison
 * Production comparison endpoint for real user documents.
 * Compares two NormalizedDocuments, detects section/clause diffs,
 * identifies potential inconsistencies, and enriches changes with Nemotron AI.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const headerReqId = request.headers.get("x-comparison-request-id");
  let requestId = headerReqId || `cmp_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  let reqTag = `[${requestId}]`;

  console.log(`[COMP-DIAG]${reqTag} POST /api/comparison request received`);

  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing JSON request body.",
          },
        },
        { status: 400, headers: { "x-comparison-request-id": requestId } }
      );
    }

    if (body.requestId && !headerReqId) {
      requestId = String(body.requestId);
      reqTag = `[${requestId}]`;
    }

    const documentAId = typeof body.documentAId === "string" ? body.documentAId.trim() : "";
    const documentBId = typeof body.documentBId === "string" ? body.documentBId.trim() : "";

    // 1. Validation of IDs
    if (!documentAId || !documentBId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Both documentAId and documentBId are required.",
          },
        },
        { status: 400, headers: { "x-comparison-request-id": requestId } }
      );
    }

    // 2. Same-Document Protection
    if (documentAId === documentBId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "COMPARISON_CONFLICT",
            message: "Cannot compare a document to itself. Select two different documents.",
          },
        },
        { status: 409, headers: { "x-comparison-request-id": requestId } }
      );
    }

    // 3. Legacy Demo Document Protection
    if (documentAId === "doc-ea-2026" || documentBId === "doc-ea-2026") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_INVALID",
            message: "Legacy demo documents are not supported for comparison.",
          },
        },
        { status: 400, headers: { "x-comparison-request-id": requestId } }
      );
    }

    const comparisonId = typeof body.comparisonId === "string" ? body.comparisonId.trim() : undefined;

    // 4. Resolve Authoritative Document A & Document B
    // Document A is resolved from active server document storage
    const docA = serverDocumentStore.getDocument(documentAId);

    // Document B is resolved from ephemeral temporary comparison storage (or server store fallback)
    const docB =
      temporaryComparisonStore.getTemporaryDocument(documentBId, comparisonId) ||
      serverDocumentStore.getDocument(documentBId);

    // Verify both documents exist
    if (!docA) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: `Document A (${documentAId}) is not available. Please ensure an active legal document is selected.`,
          },
        },
        { status: 404, headers: { "x-comparison-request-id": requestId } }
      );
    }

    if (!docB) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: `Document B (${documentBId}) is not available or has expired. Please upload a fresh second document to compare.`,
          },
        },
        { status: 404, headers: { "x-comparison-request-id": requestId } }
      );
    }

    // 5. Execute Comparison Service
    const comparisonResult = await compareDocuments(docA, docB, {
      requestId,
      skipAi: body.skipAi === true,
    });

    const totalDuration = Date.now() - reqStart;
    console.log(
      `[COMP-DIAG]${reqTag} POST /api/comparison completed in ${totalDuration}ms (changes: ${comparisonResult.changes.length}, inconsistencies: ${comparisonResult.inconsistencies.length})`
    );

    return NextResponse.json(
      {
        success: true,
        data: comparisonResult,
      },
      {
        status: 200,
        headers: {
          "x-comparison-request-id": requestId,
        },
      }
    );
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof ComparisonEngineError) {
      console.error(
        `[COMP-DIAG]${reqTag} POST /api/comparison failed with ComparisonEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        {
          status: error.statusCode || 400,
          headers: { "x-comparison-request-id": requestId },
        }
      );
    }

    if (error instanceof AiEngineError) {
      console.error(
        `[COMP-DIAG]${reqTag} POST /api/comparison failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        {
          status: error.statusCode || 500,
          headers: { "x-comparison-request-id": requestId },
        }
      );
    }

    const safeMessage = toSafeUserMessage(error);
    console.error(
      `[COMP-DIAG]${reqTag} POST /api/comparison unexpected error after ${totalDuration}ms: ${safeMessage}`
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while comparing the documents.",
        },
      },
      {
        status: 500,
        headers: { "x-comparison-request-id": requestId },
      }
    );
  }
}
