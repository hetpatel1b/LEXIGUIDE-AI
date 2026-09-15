"use client";

import * as React from "react";
import { UploadCloud, FileText } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UploadDropzone } from "@/features/upload/components/upload-dropzone";
import { SelectedFileCard } from "@/features/upload/components/selected-file-card";
import { FILE_CONSTRAINTS } from "@/lib/constants";
import type { NormalizedDocument } from "@/types/document";

export interface ComparisonUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingDocName?: string;
  comparisonId?: string;
  onUploadSuccess: (doc: NormalizedDocument, comparisonId?: string) => void;
}

export function ComparisonUploadDialog({
  isOpen,
  onClose,
  existingDocName,
  comparisonId,
  onUploadSuccess,
}: ComparisonUploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [stageMessage, setStageMessage] = React.useState<string>("");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = React.useState<string | null>(null);

  const isProcessing = status === "uploading" || status === "processing";

  const handleClose = React.useCallback(() => {
    if (!isProcessing) {
      setSelectedFile(null);
      setValidationError(null);
      setStatus("idle");
      setStageMessage("");
      setServerError(null);
      setErrorSuggestion(null);
      onClose();
    }
  }, [isProcessing, onClose]);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidExtension = FILE_CONSTRAINTS.acceptedExtensions.includes(
      extension as (typeof FILE_CONSTRAINTS.acceptedExtensions)[number]
    );

    if (!isValidExtension) {
      return {
        isValid: false,
        error: "This file type is not supported. Please upload a PDF, DOCX, or TXT document.",
      };
    }

    if (file.size > FILE_CONSTRAINTS.maxFileSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds the ${FILE_CONSTRAINTS.maxFileSizeMB}MB limit. Please upload a smaller file.`,
      };
    }

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
    setStatus("idle");
    setServerError(null);

    const validation = validateFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid file selected.");
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    setStatus("idle");
    setServerError(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setStageMessage("Uploading comparison document...");
    setServerError(null);
    setErrorSuggestion(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (comparisonId) {
        formData.append("comparisonId", comparisonId);
      }

      const timer = setTimeout(() => {
        setStatus("processing");
        setStageMessage("Extracting text and verifying structure...");
      }, 500);

      const response = await fetch("/api/comparison/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setServerError(data.error?.message || "Failed to process comparison document.");
        setErrorSuggestion(data.error?.suggestion || "Please check your file and try uploading again.");
        return;
      }

      setStatus("success");
      setStageMessage("Comparison document ready.");

      const doc = data.data as NormalizedDocument;
      onUploadSuccess(doc, data.comparisonId);

      // Cleanly reset and close
      setSelectedFile(null);
      setValidationError(null);
      setStatus("idle");
      onClose();
    } catch {
      setStatus("error");
      setServerError("Network error occurred while uploading comparison document.");
      setErrorSuggestion("Please verify your connection and try again.");
    }
  };

  const dialogTitle = "Upload Document B (Comparison Target)";
  const dialogDescription = existingDocName
    ? `Upload a revised version, amendment, or counterpart contract to compare side-by-side with "${existingDocName}".`
    : "Select a legal agreement (PDF, DOCX, or TXT) to compare against your baseline document.";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={dialogTitle}
      description={dialogDescription}
      className="max-w-2xl w-full"
    >
      <div className="space-y-4 pt-2">
        {/* Context Badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="brand" size="sm">
            Document B (Target)
          </Badge>
          <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
            Supported: PDF, DOCX, TXT (up to {FILE_CONSTRAINTS.maxFileSizeMB}MB)
          </span>
        </div>

        {/* Client Validation Error */}
        {validationError && (
          <Alert variant="danger" title="Invalid Document" onDismiss={() => setValidationError(null)}>
            {validationError}
          </Alert>
        )}

        {/* Server Upload Error */}
        {serverError && (
          <Alert variant="danger" title="Upload Failed" onDismiss={() => setServerError(null)}>
            <div className="space-y-1">
              <p>{serverError}</p>
              {errorSuggestion && (
                <p className="text-xs text-[var(--foreground-muted)]">{errorSuggestion}</p>
              )}
            </div>
          </Alert>
        )}

        {/* File Dropzone or Selected File Preview */}
        {!selectedFile ? (
          <UploadDropzone
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
            className="py-8"
          />
        ) : (
          <div className="space-y-4">
            <SelectedFileCard
              file={selectedFile}
              onRemove={handleRemoveFile}
              isProcessing={isProcessing}
              processingStageMessage={stageMessage}
              isSuccess={status === "success"}
              onStartProcessing={handleProcess}
            />

            {!isProcessing && status !== "success" && (
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  leftIcon={<UploadCloud className="h-4 w-4" />}
                >
                  Process &amp; Compare Document B
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
