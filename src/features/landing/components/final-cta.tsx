import * as React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function FinalCta() {
  return (
    <section className="w-full py-12 sm:py-16 lg:py-20 border-t border-[var(--border-muted)] bg-gradient-to-b from-[var(--surface-subtle)] to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-5">
        <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-blue-50 text-[var(--primary)] mb-1">
          <Sparkles className="h-5 w-5" />
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--foreground)]">
          Ready to understand your document?
        </h2>

        <p className="max-w-xl mx-auto text-xs sm:text-sm lg:text-base text-[var(--foreground-muted)] leading-relaxed">
          Upload a contract or legal text in PDF, DOCX, or TXT format and start exploring clauses, obligations, and key terms with clarity.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            href="#upload-section"
            size="lg"
            variant="primary"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full sm:w-auto min-h-[48px] justify-center shadow-[var(--shadow-md)]"
          >
            Analyze a Document
          </Button>
        </div>

        <p className="text-[11px] sm:text-xs text-[var(--foreground-subtle)] pt-1">
          No sign-up or account required &bull; Confidential client validation active
        </p>
      </div>
    </section>
  );
}
