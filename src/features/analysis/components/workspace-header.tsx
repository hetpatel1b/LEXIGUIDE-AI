"use client";

import * as React from "react";
import { WorkspaceNav, type WorkspaceNavProps } from "@/components/shared";
import type { WorkspacePreviewState } from "./analysis-workspace";

export type { WorkspacePreviewState };

export interface WorkspaceHeaderProps extends Partial<WorkspaceNavProps> {
  previewState?: WorkspacePreviewState;
  onSelectPreviewState?: (state: WorkspacePreviewState) => void;
}

/**
 * WorkspaceHeader adapter ensuring /analyze consumes the exact same shared WorkspaceNav
 * as /qa, /compare, and /action-center.
 */
export function WorkspaceHeader(props: WorkspaceHeaderProps) {
  return (
    <WorkspaceNav
      documentName={props.documentName || "Employment_Agreement_2026.pdf"}
      documentType={props.documentType || "Employment Agreement"}
      className={props.className}
      extraRightControls={props.extraRightControls}
    />
  );
}

