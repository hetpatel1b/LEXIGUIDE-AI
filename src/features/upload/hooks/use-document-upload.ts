"use client";

import * as React from "react";
import type { NormalizedDocument } from "@/types/document";
import { setActiveDocument, saveSessionDocument } from "@/lib/document-storage";

export type UploadProcessingStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

export type ProcessingStage =
  | "uploading"
  | "extracting_text"
  | "detecting_sections"
  | "chunking"
  | "complete"
  | null;

export interface UseDocumentUploadReturn {
  status: UploadProcessingStatus;
  stage: ProcessingStage;
  stageMessage: string;
  processedDocument: NormalizedDocument | null;
  errorMessage: string | null;
  errorSuggestion: string | null;
  errorCode: string | null;
  uploadAndProcess: (file: File) => Promise<NormalizedDocument | null>;
  reset: () => void;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [status, setStatus] = React.useState<UploadProcessingStatus>("idle");
  const [stage, setStage] = React.useState<ProcessingStage>(null);
  const [stageMessage, setStageMessage] = React.useState<string>("");
  const [processedDocument, setProcessedDocument] =
    React.useState<NormalizedDocument | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = React.useState<string | null>(null);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);

  const reset = React.useCallback(() => {
    setStatus("idle");
    setStage(null);
    setStageMessage("");
    setProcessedDocument(null);
    setErrorMessage(null);
    setErrorSuggestion(null);
    setErrorCode(null);
  }, []);

  const uploadAndProcess = React.useCallback(
    async (file: File): Promise<NormalizedDocument | null> => {
      setStatus("uploading");
      setStage("uploading");
      setStageMessage("Uploading document to secure processing engine...");
      setErrorMessage(null);
      setErrorSuggestion(null);
      setErrorCode(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Update stage to processing
        const stageTimer = setTimeout(() => {
          setStatus("processing");
          setStage("extracting_text");
          setStageMessage("Extracting text and verifying structure...");
        }, 600);

        const response = await fetch("/api/documents/process", {
          method: "POST",
          body: formData,
        });

        clearTimeout(stageTimer);

        const data = await response.json();

        if (!response.ok || !data.success) {
          const err = data.error || {};
          setStatus("error");
          setStage(null);
          setErrorCode(err.code || "UNKNOWN_ERROR");
          setErrorMessage(
            err.message || "An unexpected error occurred while processing the document."
          );
          setErrorSuggestion(
            err.suggestion || "Please check your file and try uploading again."
          );
          return null;
        }

        // Successfully parsed and normalized
        const normalized = data.data as NormalizedDocument;
        setStatus("success");
        setStage("complete");
        setStageMessage("Document processed and structured successfully.");
        setProcessedDocument(normalized);

        // Persist to client session storage so /analyze and /compare can read it immediately
        setActiveDocument(normalized);
        saveSessionDocument(normalized);

        return normalized;
      } catch (err) {
        setStatus("error");
        setStage(null);
        setErrorCode("NETWORK_ERROR");
        setErrorMessage("Network error occurred while communicating with the document engine.");
        setErrorSuggestion("Please verify your internet connection and try again.");
        return null;
      }
    },
    []
  );

  return {
    status,
    stage,
    stageMessage,
    processedDocument,
    errorMessage,
    errorSuggestion,
    errorCode,
    uploadAndProcess,
    reset,
  };
}
