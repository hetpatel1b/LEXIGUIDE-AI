"use client";

import * as React from "react";
import { UploadCloud, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface WorkspaceEmptyProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onUploadClick?: () => void;
  className?: string;
}

export function WorkspaceEmpty({
  title = "No document selected",
  description = "Upload a legal document to analyze its clauses, obligations, dates, and potential concerns.",
  actionText = "Upload Document",
  actionHref = "/#upload-section",
  onUploadClick,
  className,
}: WorkspaceEmptyProps) {
  return (
    <div className={`flex-1 flex items-center justify-center p-6 sm:p-12 ${className || ""}`}>
      <EmptyState
        title={title}
        description={description}
        icon={<FileText className="h-7 w-7 text-[var(--primary)]" aria-hidden="true" />}
        action={
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            {onUploadClick ? (
              <Button
                type="button"
                onClick={onUploadClick}
                variant="primary"
                size="md"
                leftIcon={<UploadCloud className="h-4 w-4" />}
                className="w-full sm:w-auto justify-center"
              >
                {actionText}
              </Button>
            ) : (
              <Button
                href={actionHref}
                variant="primary"
                size="md"
                leftIcon={<UploadCloud className="h-4 w-4" />}
                className="w-full sm:w-auto justify-center"
              >
                {actionText}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}
