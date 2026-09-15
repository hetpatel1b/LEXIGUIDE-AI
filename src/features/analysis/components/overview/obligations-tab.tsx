"use client";

import * as React from "react";
import { User, Building2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/ai/types";

export interface ObligationsTabProps {
  analysisResult?: AnalysisResult | null;
}

export function ObligationsTab({ analysisResult }: ObligationsTabProps) {
  const { firstPartyName, secondPartyName, firstPartyList, secondPartyList } = React.useMemo(() => {
    if (!analysisResult) {
      return {
        firstPartyName: "Primary Party",
        secondPartyName: "Counterparty",
        firstPartyList: [],
        secondPartyList: [],
      };
    }

    const parties = analysisResult.metadata.parties || [];
    const party1 = parties[0] ? `${parties[0].name} (${parties[0].role})` : "Primary Party";
    const party2 = parties[1] ? `${parties[1].name} (${parties[1].role})` : "Counterparty";

    const allObs = analysisResult.obligations.map((o) => ({
      id: o.id,
      party: o.party,
      responsibleParty: o.responsibleParty,
      duty: o.description,
      deadline: o.deadline,
      consequences: o.consequence,
      clauseReference: o.source.sectionTitle || o.source.sectionId || "Section",
      verified: o.verified,
    }));

    // Partition obligations between parties
    const firstList: typeof allObs = [];
    const secondList: typeof allObs = [];

    allObs.forEach((ob, idx) => {
      const pLower = (ob.party + " " + ob.responsibleParty).toLowerCase();
      if (
        pLower.includes("employee") ||
        pLower.includes("consultant") ||
        pLower.includes("user") ||
        pLower.includes("contractor") ||
        pLower.includes("recipient") ||
        pLower.includes("service provider")
      ) {
        firstList.push(ob);
      } else if (
        pLower.includes("employer") ||
        pLower.includes("company") ||
        pLower.includes("client") ||
        pLower.includes("discloser")
      ) {
        secondList.push(ob);
      } else {
        // Evenly balance unspecified parties
        if (idx % 2 === 0) {
          firstList.push(ob);
        } else {
          secondList.push(ob);
        }
      }
    });

    return {
      firstPartyName: party1,
      secondPartyName: party2,
      firstPartyList: firstList.length > 0 ? firstList : allObs.slice(0, Math.ceil(allObs.length / 2)),
      secondPartyList: secondList.length > 0 ? secondList : allObs.slice(Math.ceil(allObs.length / 2)),
    };
  }, [analysisResult]);

  const totalCount = firstPartyList.length + secondPartyList.length;

  return (
    <div className="space-y-6 text-left w-full">
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

        <Badge variant={analysisResult ? "brand" : "neutral"} size="sm">
          {totalCount} Identified Duties
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: First Party Obligations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-muted)]">
            <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Primary Party Obligations
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">{firstPartyName}</p>
            </div>
          </div>

          <div className="space-y-3">
            {firstPartyList.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--foreground-muted)] border border-dashed rounded-[var(--radius-md)]">
                No specific individual duties identified.
              </div>
            ) : (
              firstPartyList.map((ob, index) => (
                <Card
                  key={`${ob.id || "ob1"}_${index}`}
                  density="compact"
                  className="p-4 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)]">
                      {ob.clauseReference}
                    </span>
                    <Badge variant={ob.verified ? "success" : "neutral"} size="sm">
                      {ob.verified ? "Verified Duty" : "Identified Duty"}
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
              ))
            )}
          </div>
        </div>

        {/* Counterparty Obligations Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-muted)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {secondPartyName}
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Assigned Counterparty Duties
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {secondPartyList.length} Duties
            </Badge>
          </div>

          <div className="space-y-3">
            {secondPartyList.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--foreground-muted)] border border-dashed rounded-[var(--radius-md)]">
                No specific counterparty duties identified.
              </div>
            ) : (
              secondPartyList.map((ob, index) => (
                <Card
                  key={`${ob.id || "ob2"}_${index}`}
                  density="compact"
                  className="p-4 bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--foreground)]">
                      {ob.clauseReference}
                    </span>
                    <Badge variant={ob.verified ? "brand" : "neutral"} size="sm">
                      {ob.verified ? "Verified Duty" : "Identified Duty"}
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
