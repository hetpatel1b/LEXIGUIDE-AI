import { NextRequest, NextResponse } from "next/server";
import { processDocument, DocumentEngineError } from "@/lib/document-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Authoritative document processing endpoint.
 * Accepts multipart/form-data with a single legal document file.
 * Returns the canonical NormalizedDocument or a structured, safe error.
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
            suggestion: "Please upload your document as a multipart form data file.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No document file was provided in the request.",
            suggestion: "Please select a PDF, DOCX, or TXT document to process.",
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

    // Process through the document engine pipeline
    const normalizedDocument = await processDocument(buffer, filename, mimeType);

    return NextResponse.json(
      {
        success: true,
        data: normalizedDocument,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof DocumentEngineError) {
      return NextResponse.json(error.toResponse(), { status: error.statusCode });
    }

    // Generic fallback for unhandled exceptions (never exposes stack traces or file paths)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during document processing.",
          suggestion: "Please verify your document is valid and try again.",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
