"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui";
import { FILE_CONSTRAINTS } from "@/lib/constants";
import { UploadDropzone } from "./upload-dropzone";
import { SelectedFileCard } from "./selected-file-card";
import { useDocumentUpload } from "../hooks/use-document-upload";

export function UploadContainer() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = React.useState<string | null>(null);

  const {
    status,
    stageMessage,
    processedDocument,
    errorMessage: serverError,
    errorSuggestion,
    uploadAndProcess,
    reset: resetUpload,
  } = useDocumentUpload();

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // 1. File Type Validation
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidExtension = FILE_CONSTRAINTS.acceptedExtensions.includes(
      extension as (typeof FILE_CONSTRAINTS.acceptedExtensions)[number]
    );

    if (!isValidExtension) {
      return {
        isValid: false,
        error: "This file type isn't supported. Please upload a PDF, DOCX, or TXT document.",
      };
    }

    // 2. File Size Validation
    if (file.size > FILE_CONSTRAINTS.maxFileSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds the ${FILE_CONSTRAINTS.maxFileSizeMB}MB limit. Please upload a smaller file.`,
      };
    }

    // 3. Empty File Validation
    if (file.size === 0) {
      return {
        isValid: false,
        error: "The selected file is empty (0 bytes). Please choose a valid document.",
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (file: File) => {
    setValidationError(null);
    resetUpload();

    const validation = validateFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid file selected.");
      return;
    }

    setSelectedFile(file);
  };

  const handleMultipleFilesRejected = (count: number) => {
    setNoticeMessage(
      `You selected ${count} documents. LexiGuide AI currently focuses on analyzing one primary document at a time. The first document was selected.`
    );
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    setNoticeMessage(null);
    resetUpload();
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;
    await uploadAndProcess(selectedFile);
  };

  const handleNavigateToAnalysis = () => {
    router.push("/analyze");
  };

  const isProcessing = status === "uploading" || status === "processing";
  const isSuccess = status === "success" && !!processedDocument;

  return (
    <div id="upload-section" className="w-full max-w-4xl mx-auto space-y-4">
      {/* Informational Multi-File Notice */}
      {noticeMessage && (
        <Alert
          variant="info"
          title="Single Document Focus"
          onDismiss={() => setNoticeMessage(null)}
        >
          {noticeMessage}
        </Alert>
      )}

      {/* Client-Side Validation Error Alert */}
      {validationError && (
        <Alert
          variant="danger"
          title="Upload Validation Notice"
          onDismiss={() => setValidationError(null)}
        >
          {validationError}
        </Alert>
      )}

      {/* Server-Side Processing Error Alert */}
      {serverError && (
        <Alert
          variant="danger"
          title="Document Processing Notice"
          onDismiss={resetUpload}
        >
          <div className="space-y-1">
            <p>{serverError}</p>
            {errorSuggestion && (
              <p className="text-xs text-[var(--foreground-muted)]">{errorSuggestion}</p>
            )}
          </div>
        </Alert>
      )}

      {/* Conditional: Dropzone vs Selected File Preview */}
      {selectedFile ? (
        <SelectedFileCard
          file={selectedFile}
          onRemove={handleRemoveFile}
          isProcessing={isProcessing}
          processingStageMessage={stageMessage}
          isSuccess={isSuccess}
          processedStats={
            processedDocument
              ? {
                  sections: processedDocument.sections.length,
                  chunks: processedDocument.chunks.length,
                  pages: processedDocument.pageCount,
                }
              : undefined
          }
          onStartProcessing={handleStartProcessing}
          onNavigateToAnalysis={handleNavigateToAnalysis}
        />
      ) : (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          onMultipleFilesRejected={handleMultipleFilesRejected}
        />
      )}
    </div>
  );
}

