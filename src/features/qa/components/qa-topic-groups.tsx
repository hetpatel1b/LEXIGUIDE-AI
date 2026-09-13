"use client";

import * as React from "react";
import { FileText, CheckSquare, AlertTriangle, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { QA_TOPIC_GROUPS } from "../fixtures/qa-fixture";
import type { QATopicGroup } from "@/types";

export interface QATopicGroupsProps {
  onSelectQuestion: (question: string) => void;
  className?: string;
}

const ICON_MAP = {
  FileText,
  CheckSquare,
  AlertTriangle,
  Scale,
};

export function QATopicGroups({
  onSelectQuestion,
  className,
}: QATopicGroupsProps) {
  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-muted)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Suggested Inquiries by Topic
        </h3>
        <span className="text-[10px] text-[var(--foreground-muted)]">Click to ask</span>
      </div>

      <div className="space-y-3">
        {QA_TOPIC_GROUPS.map((group) => {
          const Icon = ICON_MAP[group.iconName as keyof typeof ICON_MAP] || FileText;

          return (
            <Card
              key={group.id}
              density="compact"
              className="p-3 bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] transition-all space-y-2 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {group.title}
                  </h4>
                  <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                    {group.description}
                  </p>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                {group.questions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onSelectQuestion(q)}
                    className="w-full text-left p-1.5 rounded-[var(--radius-sm)] text-[11px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer block leading-relaxed break-words"
                    title={q}
                  >
                    &bull; &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
