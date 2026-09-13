import * as React from "react";
import { UploadCloud, FileSearch, MessageSquare, GitCompare, CheckSquare, ArrowDown, ArrowRight } from "lucide-react";
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
    <section id="how-it-works" className="w-full py-10 sm:py-14 lg:py-18 border-y border-[var(--border-muted)] bg-[var(--surface-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
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

        {/* 5-Step Workflow: Vertical Timeline on Mobile (< 640px), Grid on Tablet, Horizontal Row on Desktop (>= 1024px) */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 max-w-lg sm:max-w-none mx-auto">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <Card
                variant="default"
                className="relative p-4 sm:p-5 text-left bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg sm:text-xl font-mono font-bold text-[var(--primary)]">
                      {step.num}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold tracking-wider text-[var(--foreground)] mb-1">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Horizontal flow arrow on desktop */}
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 h-5 w-5 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] shadow-sm"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </Card>

              {/* Downward flow connector on mobile (< 640px) */}
              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="sm:hidden flex items-center justify-center py-0.5 text-[var(--primary)]/70"
                >
                  <ArrowDown className="h-4 w-4 stroke-[2.5]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

