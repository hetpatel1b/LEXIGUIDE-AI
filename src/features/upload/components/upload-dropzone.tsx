"use client";

import * as React from "react";
import { UploadCloud, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import { FILE_CONSTRAINTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onMultipleFilesRejected?: (count: number) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadDropzone({
  onFileSelect,
  onMultipleFilesRejected,
  disabled = false,
  className,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (files.length > 1) {
      onMultipleFilesRejected?.(files.length);
    }

    // Select the primary file
    onFileSelect(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      onMultipleFilesRejected?.(files.length);
    }

    onFileSelect(files[0]);

    // Reset input value to allow selecting the same file again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerBrowse = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      role="region"
      aria-label="Legal document upload dropzone"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          triggerBrowse();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-[var(--radius-xl)] border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 select-none",
        isDragging
          ? "border-[var(--primary)] bg-blue-50/70 scale-[1.005]"
          : "border-[var(--border-strong)] bg-[var(--surface)] hover:border-[var(--primary)]/60 hover:bg-[var(--surface-subtle)]",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {/* Hidden native accessible file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="document-upload-input"
        aria-label="Choose a PDF, DOCX, or TXT legal document"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={handleFileInputChange}
        disabled={disabled}
        className="sr-only"
      />

      {/* Upload Visual Icon */}
      <div
        className={cn(
          "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl transition-transform duration-200 mb-4",
          isDragging
            ? "bg-[var(--primary)] text-white scale-110 shadow-[var(--shadow-md)]"
            : "bg-blue-50 text-[var(--primary)] group-hover:scale-105"
        )}
      >
        <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8 stroke-[1.75]" aria-hidden="true" />
      </div>

      {/* Primary Instruction */}
      <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] tracking-tight mb-1.5">
        {isDragging ? "Drop your legal document here" : "Drag and drop your legal document"}
      </h3>

      <p className="max-w-md text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed mb-6">
        Upload your contract, agreement, or terms to examine key clauses, obligations, and areas warranting attention.
      </p>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={triggerBrowse}
          leftIcon={<FileText className="h-4 w-4" />}
          className="w-full sm:w-auto shadow-[var(--shadow-subtle)]"
        >
          Browse Document
        </Button>
      </div>

      {/* Constraints & Supported Formats */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-[var(--border-muted)] w-full max-w-md text-[11px] text-[var(--foreground-muted)]">
        <span className="font-medium text-[var(--foreground-secondary)]">Supported formats:</span>
        <span className="font-mono bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border-muted)]">
          PDF
        </span>
        <span className="font-mono bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border-muted)]">
          DOCX
        </span>
        <span className="font-mono bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border-muted)]">
          TXT
        </span>
        <span aria-hidden="true">&bull;</span>
        <span>Up to {FILE_CONSTRAINTS.maxFileSizeMB}MB</span>
      </div>

      {/* Privacy & Confidentiality Micro-signal */}
      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--foreground-subtle)]">
        <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span>Confidential document handling &bull; Client-side validation active</span>
      </div>
    </div>
  );
}
