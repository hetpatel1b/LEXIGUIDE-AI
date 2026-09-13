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
      icon: <FileSearch className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)] dark:text-sky-400" />,
      title: "Document Understanding",
      description: "Turn complex legal language into clearer, plain-language explanations.",
    },
    {
      id: "clauses",
      icon: <ListChecks className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)] dark:text-sky-400" />,
      title: "Key Clauses",
      description: "Find important clauses, dates, terms, and provisions that deserve attention.",
    },
    {
      id: "concerns",
      icon: <AlertTriangle className="h-6 w-6 stroke-[1.5] text-amber-600 dark:text-amber-400" />,
      title: "Potential Concerns",
      description: "Surface clauses or terms that may warrant a closer review.",
    },
    {
      id: "obligations",
      icon: <Scale className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)] dark:text-sky-400" />,
      title: "Obligations",
      description: "See what you may need to do—and what the other party may be responsible for.",
    },
    {
      id: "qa",
      icon: <MessageSquareQuote className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)] dark:text-sky-400" />,
      title: "Ask Your Document",
      description: "Ask questions and get answers grounded in the document you provided.",
    },
    {
      id: "compare",
      icon: <GitCompare className="h-6 w-6 stroke-[1.5] text-[var(--color-brand-blue)] dark:text-sky-400" />,
      title: "Compare Documents",
      description: "Spot important differences between two versions or related documents.",
    },
  ];

  return (
    <section id="capabilities" className="w-full py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
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

        {/* Exactly Six Capability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {capabilities.map((cap) => (
            <Card
              key={cap.id}
              variant="default"
              className="transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
            >
              <CardHeader className="space-y-3 pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                  {cap.icon}
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {cap.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  {cap.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
