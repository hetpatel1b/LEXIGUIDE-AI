import * as React from "react";
import {
  FileSearch,
  ListChecks,
  AlertTriangle,
  Scale,
  MessageSquareQuote,
  GitCompare,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function CapabilityGrid() {
  const capabilities = [
    {
      id: "understanding",
      icon: <FileSearch className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)]" />,
      title: "Document Understanding",
      description: "Turn complex legal language into clearer, plain-language explanations.",
    },
    {
      id: "clauses",
      icon: <ListChecks className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)]" />,
      title: "Key Clauses",
      description: "Find important clauses, dates, terms, and provisions that deserve attention.",
    },
    {
      id: "concerns",
      icon: <AlertTriangle className="h-6 w-6 stroke-[1.5] text-amber-600" />,
      title: "Potential Concerns",
      description: "Surface clauses or terms that may warrant a closer review.",
    },
    {
      id: "obligations",
      icon: <Scale className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)]" />,
      title: "Obligations",
      description: "See what you may need to do—and what the other party may be responsible for.",
    },
    {
      id: "qa",
      icon: <MessageSquareQuote className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)]" />,
      title: "Ask Your Document",
      description: "Ask questions and get answers grounded in the document you provided.",
    },
    {
      id: "compare",
      icon: <GitCompare className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)]" />,
      title: "Compare Documents",
      description: "Spot important differences between two versions or related documents.",
    },
  ];

  return (
    <section id="capabilities" className="w-full py-10 sm:py-14 lg:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--primary)]">
            Core Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Built for total document comprehension
          </h2>
          <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
            Six focused capabilities designed to bring visibility, context, and confidence to contracts and legal text.
          </p>
        </div>

        {/* Exactly Six Capability Cards: Desktop 3x2, Tablet 2x3, Mobile 1x6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 text-left">
          {capabilities.map((cap) => (
            <Card
              key={cap.id}
              variant="default"
              className="h-full flex flex-col justify-start p-5 sm:p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] bg-[var(--surface)]"
            >
              <div className="space-y-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50/80 border border-blue-100 shrink-0">
                  {cap.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
                  {cap.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed flex-1">
                {cap.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
