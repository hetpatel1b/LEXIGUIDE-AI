"use client";

import * as React from "react";
import { FileText, CheckSquare, AlertTriangle, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { QATopicGroup } from "@/types";

export interface QATopicGroupsProps {
  groups?: QATopicGroup[];
  onSelectQuestion: (question: string) => void;
  className?: string;
}

const ICON_MAP = {
  FileText,
  CheckSquare,
  AlertTriangle,
  Scale,
};

const DEFAULT_QA_TOPIC_GROUPS: QATopicGroup[] = [
  {
    id: "understand",
    title: "Understand Document",
    description: "High-level overview, parties, and agreement structure",
    iconName: "FileText",
    questions: [
      "What is this agreement about?",
      "Summarize the key terms.",
      "Who are the parties and their roles?",
    ],
  },
  {
    id: "obligations",
    title: "Obligations & Deadlines",
    description: "Required duties, notice periods, and milestones",
    iconName: "CheckSquare",
    questions: [
      "What are my primary obligations?",
      "What does the counterparty have to do?",
      "What deadlines and notice requirements apply?",
    ],
  },
  {
    id: "concerns",
    title: "Potential Concerns",
    description: "Provisions that may warrant closer review or discussion",
    iconName: "AlertTriangle",
    questions: [
      "Which clauses should I review carefully?",
      "Are there restrictive covenants or non-compete terms?",
      "What provisions may deserve legal clarification?",
    ],
  },
  {
    id: "clauses",
    title: "Specific Provisions",
    description: "In-depth breakdown of standard legal sections",
    iconName: "Scale",
    questions: [
      "Explain the termination clause.",
      "Explain the confidentiality clause.",
      "What is the governing law and dispute jurisdiction?",
    ],
  },
];

export function QATopicGroups({
  groups = DEFAULT_QA_TOPIC_GROUPS,
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
        {groups.map((group) => {
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
