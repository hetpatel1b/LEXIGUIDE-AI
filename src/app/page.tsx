import * as React from "react";
import {
  Hero,
  ProductPreview,
  CapabilityGrid,
  WorkflowSteps,
  TrustSafety,
  FinalCta,
} from "@/features/landing";
import { UploadContainer } from "@/features/upload";

export default function LandingPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center">
      {/* 1. Hero Section: Headline, Supporting Copy, Split Visual Preview */}
      <Hero />

      {/* 2. Primary Upload Experience: Large Drag & Drop Dropzone + File Validation */}
      <section className="w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[var(--surface-subtle)] to-transparent">
        <UploadContainer />
      </section>

      {/* 3. Product Workspace Preview: Illustrative Contract Intelligence Interface */}
      <ProductPreview />

      {/* 4. Core Capabilities: Exactly Six Core Capabilities */}
      <CapabilityGrid />

      {/* 5. How It Works: 5-Step Linear Legal Workflow */}
      <WorkflowSteps />

      {/* 6. Trust & Legal Safety: What LexiGuide Does vs Does Not Do */}
      <TrustSafety />

      {/* 7. Final Action Banner: Ready to Understand Your Document */}
      <FinalCta />
    </div>
  );
}
