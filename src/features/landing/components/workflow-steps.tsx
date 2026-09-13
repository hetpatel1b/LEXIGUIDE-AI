import * as React from "react";
import { UploadCloud, FileSearch, MessageSquare, GitCompare, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui";

export function WorkflowSteps() {
  const steps = [
    {
      num: "01",
      title: "UPLOAD",
      description: "Add your legal document.",
      icon: <UploadCloud className="h-5 w-5 stroke-[1.5]" />,
    },
    {
      num: "02",
      title: "UNDERSTAND",
      description: "Get a clearer view of what's inside.",
      icon: <FileSearch className="h-5 w-5 stroke-[1.5]" />,
    },
    {
      num: "03",
      title: "ASK",
      description: "Ask questions grounded in your document.",
      icon: <MessageSquare className="h-5 w-5 stroke-[1.5]" />,
    },
    {
      num: "04",
      title: "COMPARE",
      description: "Identify important differences.",
      icon: <GitCompare className="h-5 w-5 stroke-[1.5]" />,
    },
    {
      num: "05",
      title: "ACT",
      description: "Turn findings into practical next steps.",
      icon: <CheckSquare className="h-5 w-5 stroke-[1.5]" />,
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-12 sm:py-16 lg:py-20 border-y border-[var(--border-muted)] bg-[var(--surface-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--primary)]">
            How LexiGuide Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            A simple, predictable legal workflow
          </h2>
          <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
            From initial document upload to actionable next steps in five clear stages.
          </p>
        </div>

        {/* 5-Step Linear Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step, idx) => (
            <Card
              key={step.num}
              variant="default"
              className="relative p-5 text-left bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-mono font-bold text-[var(--primary)]">
                  {step.num}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                  {step.icon}
                </div>
              </div>

              <h4 className="text-sm font-bold tracking-wider text-[var(--foreground)] mb-1">
                {step.title}
              </h4>

              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {step.description}
              </p>

              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[var(--border-strong)]"
                >
                  &rarr;
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
