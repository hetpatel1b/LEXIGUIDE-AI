import { NextRequest, NextResponse } from "next/server";
import { defaultQaService } from "@/lib/ai/qa/qa-service";
import { serverDocumentStore } from "@/lib/server-document-store";
import { isLegacyDemoDocument } from "@/lib/document-storage";
import { AiEngineError, toSafeUserMessage } from "@/lib/ai/errors";
import type { NormalizedDocument } from "@/lib/document-engine/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/qa
 * Grounded legal Q&A endpoint.
 * Retrieves targeted evidence from the active document and invokes
 * NVIDIA Nemotron 3 Super 120B with source verification.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const reqStart = Date.now();
  const headerReqId = request.headers.get("x-qa-request-id");
  let requestId = headerReqId || `qa_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  let reqTag = `[${requestId}]`;

  console.log(`[QA-DIAG]${reqTag} POST /api/qa request received`);

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
        { status: 400, headers: { "x-qa-request-id": requestId } }
      );
    }

    if (body.requestId && !headerReqId) {
      requestId = String(body.requestId);
      reqTag = `[${requestId}]`;
    }

    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";

    // 1. Validate Question
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Question cannot be empty.",
          },
        },
        { status: 400, headers: { "x-qa-request-id": requestId } }
      );
    }

    if (question.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Question exceeds the maximum length of 1000 characters.",
          },
        },
        { status: 400, headers: { "x-qa-request-id": requestId } }
      );
    }

    // 2. Validate Document ID & Legacy Guard
    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required 'documentId' in request.",
          },
        },
        { status: 400, headers: { "x-qa-request-id": requestId } }
      );
    }

    if (
      documentId === "doc-ea-2026" ||
      (body.document && typeof body.document === "object" && isLegacyDemoDocument(body.document as NormalizedDocument))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_INVALID",
            message: "Legacy demo documents are not supported for Q&A.",
          },
        },
        { status: 400, headers: { "x-qa-request-id": requestId } }
      );
    }

    // 3. Resolve Authoritative Document
    let document = serverDocumentStore.getDocument(documentId);

    // Fallback: If server restarted and document is provided in request body
    if (!document && body.document && typeof body.document === "object") {
      const candidateDoc = body.document as NormalizedDocument;
      if (candidateDoc.id === documentId && !isLegacyDemoDocument(candidateDoc)) {
        serverDocumentStore.registerDocument(candidateDoc);
        document = candidateDoc;
      }
    }

    if (!document) {
      console.warn(`[QA-DIAG]${reqTag} Document not found for docId=${documentId}`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: "The requested document was not found in the active session. Please re-upload or select your document.",
          },
        },
        { status: 404, headers: { "x-qa-request-id": requestId } }
      );
    }

    // 4. Validate Document Integrity
    if (isLegacyDemoDocument(document)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_INVALID",
            message: "Legacy demo documents are not supported for Q&A.",
          },
        },
        { status: 400, headers: { "x-qa-request-id": requestId } }
      );
    }

    if (!document.chunks || document.chunks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_DOCUMENT",
            message: "The document contains no readable text chunks to query.",
          },
        },
        { status: 422, headers: { "x-qa-request-id": requestId } }
      );
    }

    // 5. Execute Grounded Q&A
    const result = await defaultQaService.answerQuestion(document, question, requestId);
    const totalDuration = Date.now() - reqStart;

    console.log(
      `[QA-DIAG]${reqTag} POST /api/qa completed in ${totalDuration}ms (status: ${result.answerStatus}, sources: ${result.sources.length})`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          documentId: result.documentId,
          documentName: result.documentName,
          question: result.question,
          answer: result.answer,
          answerStatus: result.answerStatus,
          keyPoints: result.keyPoints,
          sources: result.sources,
          nextStep: result.nextStep,
        },
        diagnostics: result.diagnostics,
        durationMs: totalDuration,
        requestId,
      },
      {
        status: 200,
        headers: { "x-qa-request-id": requestId },
      }
    );
  } catch (error: unknown) {
    const totalDuration = Date.now() - reqStart;

    if (error instanceof AiEngineError) {
      console.error(
        `[QA-DIAG]${reqTag} POST /api/qa failed with AiEngineError: code=${error.code}, status=${error.statusCode}, duration=${totalDuration}ms`
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
          headers: { "x-qa-request-id": requestId },
        }
      );
    }

    const safeMessage = toSafeUserMessage(error);
    console.error(
      `[QA-DIAG]${reqTag} POST /api/qa unexpected error after ${totalDuration}ms: ${safeMessage}`
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
        headers: { "x-qa-request-id": requestId },
      }
    );
  }
}
