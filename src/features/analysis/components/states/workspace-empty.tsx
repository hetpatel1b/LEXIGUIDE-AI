"use client";

import * as React from "react";
import { UploadCloud, FileText, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface WorkspaceEmptyProps {
  onReset?: () => void;
}

export function WorkspaceEmpty({ onReset }: WorkspaceEmptyProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <EmptyState
        title="Ready to Analyze"
        description="Upload a legal document to begin understanding its key clauses, obligations, potential concerns, and important dates."
        action={
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <Button
              href="/#upload-section"
              variant="primary"
              size="md"
              leftIcon={<UploadCloud className="h-4 w-4" />}
              className="w-full sm:w-auto justify-center"
            >
              Analyze a Document
            </Button>

            {onReset && (
              <Button
                variant="outline"
                size="md"
                onClick={onReset}
                className="w-full sm:w-auto justify-center"
              >
                Load Sample Document
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}
