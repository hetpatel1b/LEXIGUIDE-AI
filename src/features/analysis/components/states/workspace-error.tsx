"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export interface WorkspaceErrorProps {
  onRetry?: () => void;
}

export function WorkspaceError({ onRetry }: WorkspaceErrorProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <ErrorState
        title="We Couldn't Prepare the Analysis"
        description="Something went wrong while preparing the document analysis workspace. Please retry or return to upload."
        onRetry={onRetry}
      />
    </div>
  );
}
