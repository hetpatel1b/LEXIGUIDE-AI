"use client";

import * as React from "react";
import { Alert } from "@/components/ui";
import { FILE_CONSTRAINTS } from "@/lib/constants";
import { UploadDropzone } from "./upload-dropzone";
import { SelectedFileCard } from "./selected-file-card";

export function UploadContainer() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = React.useState<string | null>(null);

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
        error: "The selected file is empty. Please choose a valid document.",
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const validation = validateFile(file);

    if (!validation.isValid) {
      setErrorMessage(validation.error || "Invalid file selected.");
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
    setErrorMessage(null);
    setNoticeMessage(null);
  };

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

      {/* Validation Error Alert */}
      {errorMessage && (
        <Alert
          variant="danger"
          title="Upload Validation Error"
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Conditional: Dropzone vs Selected File Preview */}
      {selectedFile ? (
        <SelectedFileCard file={selectedFile} onRemove={handleRemoveFile} />
      ) : (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          onMultipleFilesRejected={handleMultipleFilesRejected}
        />
      )}
    </div>
  );
}
