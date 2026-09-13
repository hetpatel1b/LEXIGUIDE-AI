"use client";

import * as React from "react";
import { Users, Calendar, ShieldCheck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_METADATA_DETAILS } from "../fixtures/analysis-fixture";

export function DocumentMetadata() {
  return (
    <div className="space-y-2.5 text-left text-xs">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-muted)]">
        <span className="font-semibold text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">
          Document Details
        </span>
        <Badge variant="success" size="sm" dot>
          {DOCUMENT_METADATA_DETAILS.reviewStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Document Type */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] block">Contract Type</span>
          <p className="font-medium text-xs text-[var(--foreground)] leading-tight">{DOCUMENT_METADATA_DETAILS.documentType}</p>
        </div>

        {/* Parties */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            Parties
          </span>
          <div className="space-y-0.5 pl-3 border-l-2 border-[var(--border-muted)]">
            {DOCUMENT_METADATA_DETAILS.parties.map((p) => (
              <p key={p.name} className="font-medium text-xs text-[var(--foreground)] truncate leading-tight">
                <span className="text-[10px] text-[var(--foreground-muted)] mr-1">({p.role})</span>
                {p.name}
              </p>
            ))}
          </div>
        </div>

        {/* Effective Date */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Effective Date
          </span>
          <p className="font-medium text-xs text-[var(--foreground)] leading-tight">{DOCUMENT_METADATA_DETAILS.effectiveDate}</p>
        </div>

        {/* Jurisdiction & Governing Law */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            Governing Law
          </span>
          <p className="font-medium text-xs text-[var(--foreground)] truncate leading-tight" title={DOCUMENT_METADATA_DETAILS.jurisdiction}>
            {DOCUMENT_METADATA_DETAILS.governingLaw}
          </p>
        </div>
      </div>
    </div>
  );
}
