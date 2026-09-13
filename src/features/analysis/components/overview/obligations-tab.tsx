"use client";

import * as React from "react";
import { CheckSquare, User, Building2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMPORTANT_OBLIGATIONS } from "../../fixtures/analysis-fixture";

export function ObligationsTab() {
  const employeeObligations = IMPORTANT_OBLIGATIONS.filter((o) =>
    o.party.includes("Employee")
  );
  const employerObligations = IMPORTANT_OBLIGATIONS.filter((o) =>
    o.party.includes("Employer")
  );

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Contractual Obligations Matrix
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Two-party breakdown of required actions, compliance duties, and milestone commitments
          </p>
        </div>

        <Badge variant="neutral" size="sm">
          8 Identified Duties
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Your Obligations (Employee) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-muted)]">
            <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Your Obligations (Employee)
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">Rahul Mehta</p>
            </div>
          </div>

          <div className="space-y-3">
            {employeeObligations.map((ob) => (
              <Card
                key={ob.id}
                density="compact"
                className="p-4 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)]">
                    {ob.clauseReference}
                  </span>
                  <Badge variant="success" size="sm">
                    {ob.status || "Identified"}
                  </Badge>
                </div>

                <p className="text-xs font-medium text-[var(--foreground)] leading-relaxed">
                  {ob.duty}
                </p>

                {ob.deadline && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)]">
                    <Clock className="h-3 w-3 shrink-0 text-[var(--primary)]" />
                    <span>Timeline: {ob.deadline}</span>
                  </div>
                )}

                {ob.consequences && (
                  <div className="text-[11px] text-[var(--foreground-muted)] pt-1 border-t border-[var(--border-muted)]">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)] block mb-0.5">
                      Consequence of Non-Compliance:
                    </span>
                    <span>{ob.consequences}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Other Party's Obligations (Employer) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-muted)]">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Other Party&apos;s Obligations (Employer)
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">Acme Technologies Pvt. Ltd.</p>
            </div>
          </div>

          <div className="space-y-3">
            {employerObligations.map((ob) => (
              <Card
                key={ob.id}
                density="compact"
                className="p-4 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)]">
                    {ob.clauseReference}
                  </span>
                  <Badge variant="brand" size="sm">
                    {ob.status || "Identified"}
                  </Badge>
                </div>

                <p className="text-xs font-medium text-[var(--foreground)] leading-relaxed">
                  {ob.duty}
                </p>

                {ob.deadline && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)]">
                    <Clock className="h-3 w-3 shrink-0 text-[var(--primary)]" />
                    <span>Timeline: {ob.deadline}</span>
                  </div>
                )}

                {ob.consequences && (
                  <div className="text-[11px] text-[var(--foreground-muted)] pt-1 border-t border-[var(--border-muted)]">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)] block mb-0.5">
                      Legal Recourse / Remedy:
                    </span>
                    <span>{ob.consequences}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
