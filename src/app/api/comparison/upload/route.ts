import { NextRequest, NextResponse } from "next/server";
import { processDocument, DocumentEngineError } from "@/lib/document-engine";
import { temporaryComparisonStore } from "@/lib/comparison/temporary-comparison-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Dedicated comparison document upload endpoint.
 * Accepts multipart/form-data with a single comparison document (Document B).
 * Processes through the existing canonical document engine and stores it
 * strictly in the ephemeral temporaryComparisonStore with a TTL.
 *
 * It is NEVER persisted to normal user session documents.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid content-type. Expected multipart/form-data.",
            suggestion: "Please upload your comparison document as a multipart form data file.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const comparisonIdHeader = request.headers.get("x-comparison-id");
    const comparisonIdBody = formData.get("comparisonId");
    const existingComparisonId =
      (typeof comparisonIdBody === "string" && comparisonIdBody.trim()) ||
      (typeof comparisonIdHeader === "string" && comparisonIdHeader.trim()) ||
      undefined;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No document file was provided in the request.",
            suggestion: "Please select a PDF, DOCX, or TXT document to compare.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const filename = file instanceof File ? file.name : "document";
    const mimeType = file.type || undefined;

    // Convert file to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process through the canonical document engine pipeline (reusing all validation, parsing & chunking)
    const normalizedDocument = await processDocument(buffer, filename, mimeType);

    // Register strictly in the temporary comparison store with TTL
    const compId = temporaryComparisonStore.registerTemporaryDocument(
      normalizedDocument,
      existingComparisonId
    );

    return NextResponse.json(
      {
        success: true,
        data: normalizedDocument,
        comparisonId: compId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof DocumentEngineError) {
      return NextResponse.json(error.toResponse(), { status: error.statusCode });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing the comparison document.",
          suggestion: "Please verify your document is valid and try again.",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
