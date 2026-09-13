"use client";

import * as React from "react";
import {
  Sparkles,
  ArrowRight,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Textarea,
  Select,
  Alert,
  Tabs,
  Dialog,
  DialogFooter,
  Tooltip,
  Progress,
  Spinner,
  Skeleton,
  SkeletonText,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { DocumentCard, RiskIndicator, EvidenceCard } from "@/components/shared";
import { BRAND } from "@/lib/constants";

export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = React.useState("controls");
  const [cardDensity, setCardDensity] = React.useState<"spacious" | "compact">("spacious");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [progressValue, setProgressValue] = React.useState(68);

  const tabs = [
    { id: "controls", label: "Buttons & Inputs" },
    { id: "feedback", label: "Feedback & Status" },
    { id: "surfaces", label: "Cards & Surfaces" },
    { id: "legal", label: "Document & Risk Primitives" },
    { id: "tokens", label: "Tokens & Typography" },
  ];

  return (
    <div className="w-full space-y-8 text-left">
      {/* Density & Interactive Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          density="spacious"
          className="border-b-0"
        />

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
          <span className="text-[var(--foreground-muted)] flex items-center gap-1 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Density:
          </span>
          <button
            type="button"
            onClick={() => setCardDensity("spacious")}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] border text-xs transition-colors cursor-pointer ${
              cardDensity === "spacious"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-medium"
                : "bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            Spacious
          </button>
          <button
            type="button"
            onClick={() => setCardDensity("compact")}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] border text-xs transition-colors cursor-pointer ${
              cardDensity === "compact"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-medium"
                : "bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            Compact
          </button>
        </div>
      </div>

      {/* TAB 1: BUTTONS & INPUTS */}
      {activeTab === "controls" && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Button Variants */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-[var(--border-muted)] pb-2">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Button Variants & States
              </h4>
              <span className="text-xs text-[var(--foreground-muted)]">
                Semantic action scale with visible focus rings
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>
                Primary Action
              </Button>
              <Button variant="secondary">Secondary Navy</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive" leftIcon={<Trash2 className="h-4 w-4" />}>
                Destructive
              </Button>
              <Button variant="link">Link Style</Button>
              <Button variant="primary" isLoading>
                Saving
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>

            {/* Button Sizes */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="sm" variant="outline">
                Small (32px)
              </Button>
              <Button size="md" variant="outline">
                Medium (40px)
              </Button>
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Large Touch-Ready (48px)
              </Button>

              <div className="flex items-center gap-2 pl-4 border-l border-[var(--border)]">
                <Tooltip content="Download document">
                  <IconButton aria-label="Download document" variant="outline" size="md">
                    <Download className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Delete file">
                  <IconButton aria-label="Delete file" variant="destructive" size="md">
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Form Input Primitives */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-muted)]">
            <div className="flex items-baseline justify-between border-b border-[var(--border-muted)] pb-2">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Form Inputs & Selection
              </h4>
              <span className="text-xs text-[var(--foreground-muted)]">
                Accessible states, field validation, and icon slots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Contract Identifier"
                placeholder="e.g. Master Services Agreement 2026"
                helperText="Enter a descriptive title for this document"
                leftIcon={<FileText className="h-4 w-4" />}
              />

              <Input
                label="Search Clauses"
                placeholder="Search by keywords..."
                leftIcon={<Search className="h-4 w-4" />}
                state="success"
                successMessage="3 matching clauses found"
                defaultValue="Indemnification"
              />

              <Input
                label="Jurisdiction Code"
                placeholder="e.g. IN-MH"
                state="error"
                errorMessage="Invalid jurisdiction identifier"
                defaultValue="XYZ-99"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Document Classification"
                helperText="Select legal agreement category"
                options={[
                  { value: "commercial", label: "Commercial Contract / MSA" },
                  { value: "employment", label: "Employment & Consulting Agreement" },
                  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
                  { value: "lease", label: "Commercial Lease Agreement" },
                ]}
              />

              <Textarea
                label="Analysis Scope / Query"
                placeholder="Ask specific questions about liabilities, termination clauses, or governing law..."
                helperText="Maximum 500 characters"
                showCount
                maxLength={500}
                defaultValue="Identify any unilateral indemnity obligations or uncapped liabilities in Section 8."
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEEDBACK & STATUS */}
      {activeTab === "feedback" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Alerts */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              Semantic Alert Banners
            </h4>
            <div className="space-y-3">
              <Alert
                variant="info"
                title="Legal Information Architecture"
                onDismiss={() => {}}
              >
                LexiGuide AI provides document intelligence and guidance. It is designed to assist comprehension and does not offer formal legal counsel.
              </Alert>

              <Alert
                variant="warning"
                title="Clause Attention Notice"
                onDismiss={() => {}}
              >
                Section 14.2 contains a 15-day cure window that may conflict with standard 30-day market norms. Review recommended.
              </Alert>

              <Alert
                variant="danger"
                title="Potential Liability Discrepancy"
                onDismiss={() => {}}
              >
                Uncapped indemnification obligation detected without reciprocal protections for the counterparty.
              </Alert>

              <Alert
                variant="success"
                title="Processing Complete"
                onDismiss={() => {}}
              >
                All 24 clauses successfully mapped with grounded citations and zero parsing anomalies.
              </Alert>
            </div>
          </div>

          {/* Badges & Status Indicators */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              Status Badges & Tags
            </h4>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="brand" dot>
                LexiGuide Intelligence
              </Badge>
              <Badge variant="neutral">Neutral Tag</Badge>
              <Badge variant="info" dot>
                Informational
              </Badge>
              <Badge variant="warning" dot>
                Requires Review
              </Badge>
              <Badge variant="danger" dot>
                High Attention
              </Badge>
              <Badge variant="success" dot>
                Compliant Structure
              </Badge>
              <Badge variant="neutral" size="sm">
                Small (11px)
              </Badge>
            </div>
          </div>

          {/* Progress & Spinners */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-muted)]">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              Progress & Calm Loading States
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Progress
                  value={progressValue}
                  label="Document Analysis In Progress"
                />
                <Progress
                  isIndeterminate
                  label="Calm Indeterminate Pipeline"
                  size="sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProgressValue((p) => (p >= 100 ? 10 : p + 20))}
                  >
                    Increment Progress ({progressValue}%)
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-around rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-center space-y-1">
                  <Spinner size="sm" label="Loading small" />
                  <p className="text-[11px] text-[var(--foreground-muted)]">Small</p>
                </div>
                <div className="text-center space-y-1">
                  <Spinner size="md" label="Loading medium" />
                  <p className="text-[11px] text-[var(--foreground-muted)]">Medium</p>
                </div>
                <div className="text-center space-y-1">
                  <Spinner size="lg" label="Loading large" />
                  <p className="text-[11px] text-[var(--foreground-muted)]">Large</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CARDS & SURFACES */}
      {activeTab === "surfaces" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card density={cardDensity} variant="default">
              <CardHeader>
                <CardTitle>Default Soft Card</CardTitle>
                <CardDescription>
                  Subtle border containment with restrained surface elevation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  Designed for clean information presentation without overwhelming visual weight.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs font-mono text-[var(--foreground-muted)]">
                  Default Variant
                </span>
              </CardFooter>
            </Card>

            <Card density={cardDensity} variant="interactive">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Interactive Card</CardTitle>
                  <Badge variant="brand" size="sm">
                    Hoverable
                  </Badge>
                </div>
                <CardDescription>
                  Responds to cursor hover with subtle elevation and border highlight.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  Ideal for selectable clauses, document items, and comparison cards.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-[var(--primary)] font-medium">
                  Click to inspect &rarr;
                </span>
              </CardFooter>
            </Card>

            <Card density={cardDensity} variant="selected">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Selected Card</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <CardDescription>
                  Active state with brand primary border and tinted surface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  Indicates current active clause or active comparison focus.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs font-medium text-[var(--primary)]">
                  Active Focus
                </span>
              </CardFooter>
            </Card>
          </div>

          {/* Modal / Dialog Preview Trigger */}
          <div className="pt-4 border-t border-[var(--border-muted)] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Accessible Modal Dialog
              </h4>
              <p className="text-xs text-[var(--foreground-muted)]">
                Keyboard trap, backdrop blur, and responsive containment
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              Open Test Dialog
            </Button>
          </div>

          {/* Empty & Error States */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <EmptyState
              title="No Documents Uploaded"
              description="Upload a legal document in PDF, DOCX, or TXT format to initiate structured intelligence extraction."
              action={
                <Button size="sm" variant="primary">
                  Upload Contract
                </Button>
              }
            />

            <ErrorState
              title="Document Processing Interrupted"
              description="The file parsing worker encountered an unexpected read timeout. No document data was compromised."
              onRetry={() => alert("Retry action triggered")}
            />
          </div>

          {/* Skeleton Pulse Preview */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <SkeletonText lines={3} />
          </div>

          {/* Dialog Instance */}
          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Sample Modal Dialog"
            description="Demonstrating accessible focus management, backdrop blur, and responsive containment."
          >
            <div className="space-y-3 py-2">
              <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed">
                This dialog satisfies keyboard navigation requirements (Escape key closes, focus stays trapped, and backdrop clicks dismiss).
              </p>
              <Input label="Sample Confirmation Input" placeholder="Type to verify focus..." />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(false)}>
                Confirm Action
              </Button>
            </DialogFooter>
          </Dialog>
        </div>
      )}

      {/* TAB 4: LEGAL & DOCUMENT PRIMITIVES */}
      {activeTab === "legal" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Document Representation */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-[var(--border-muted)] pb-2">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Document Cards (PDF, DOCX, TXT)
              </h4>
              <span className="text-xs text-[var(--foreground-muted)]">
                Visual representation of uploaded contract artifacts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocumentCard
                name="Master_Services_Agreement_v2.1.pdf"
                type="pdf"
                sizeBytes={4.2 * 1024 * 1024}
                pageCount={28}
                status="analyzed"
                isSelected
                density={cardDensity}
              />

              <DocumentCard
                name="Software_Vendor_Agreement_Draft.docx"
                type="docx"
                sizeBytes={1.8 * 1024 * 1024}
                pageCount={14}
                status="uploaded"
                density={cardDensity}
              />

              <DocumentCard
                name="Employment_Terms_Addendum.txt"
                type="txt"
                sizeBytes={48 * 1024}
                status="processing"
                density={cardDensity}
              />

              <DocumentCard
                name="Non_Disclosure_Standard_IN.pdf"
                type="pdf"
                sizeBytes={820 * 1024}
                pageCount={6}
                status="uploaded"
                density={cardDensity}
              />
            </div>
          </div>

          {/* Legal Risk Attention Levels (Non-Assertive Phrasing) */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
            <div className="flex items-baseline justify-between border-b border-[var(--border-muted)] pb-2">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Risk Attention Indicators (Non-Assertive Phrasing)
              </h4>
              <span className="text-xs text-[var(--foreground-muted)]">
                Supports safe legal phrasing without asserting illegalities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[var(--radius-lg)] border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <RiskIndicator severity="high" />
                  <span className="text-[11px] font-mono text-[var(--danger)]">Priority 1</span>
                </div>
                <h5 className="text-xs font-semibold text-[var(--foreground)]">
                  Unilateral Indemnity Clause
                </h5>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  The counterparty holds full indemnification while the service provider retains uncapped exposure.
                </p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--warning)]/30 bg-[var(--warning-subtle)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <RiskIndicator severity="medium" />
                  <span className="text-[11px] font-mono text-[var(--warning)]">Priority 2</span>
                </div>
                <h5 className="text-xs font-semibold text-[var(--foreground)]">
                  Short Cure Period (15 Days)
                </h5>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Standard enterprise contracts typically afford 30 calendar days to remedy technical breach notices.
                </p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--info)]/30 bg-[var(--info-subtle)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <RiskIndicator severity="low" />
                  <span className="text-[11px] font-mono text-[var(--info)]">Notice</span>
                </div>
                <h5 className="text-xs font-semibold text-[var(--foreground)]">
                  Governing Law (Maharashtra)
                </h5>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Agreements explicitly seat arbitration in Mumbai under the Arbitration and Conciliation Act.
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Grounding */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-muted)]">
            <div className="flex items-baseline justify-between border-b border-[var(--border-muted)] pb-2">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Evidence Grounding Cards
              </h4>
              <span className="text-xs text-[var(--foreground-muted)]">
                Visually distinguishes verbatim contract excerpts from AI guidance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EvidenceCard
                documentTitle="MSA_Tech_Final.pdf"
                pageNumber={14}
                sectionTitle="Section 11.2 (Limitation of Liability)"
                excerpt="In no event shall either party's aggregate liability arising out of or related to this Agreement exceed the total amounts actually paid by Customer hereunder in the twelve (12) months preceding the incident."
                onViewSource={() => alert("Navigate to source citation")}
              />

              <EvidenceCard
                documentTitle="MSA_Tech_Final.pdf"
                pageNumber={18}
                sectionTitle="Section 16.4 (Termination for Convenience)"
                excerpt="Either party may terminate this Agreement without cause upon giving ninety (90) days prior written notice to the other party."
                onViewSource={() => alert("Navigate to source citation")}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TOKENS & TYPOGRAPHY */}
      {activeTab === "tokens" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Official Brand Palette */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              Approved Brand Tokens
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#0B1F44] text-white p-4 space-y-1">
                <span className="text-xs font-semibold">Primary Navy</span>
                <p className="text-[11px] font-mono opacity-80">#0B1F44</p>
                <p className="text-[10px] opacity-70">Trust & Authority</p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#2563EB] text-white p-4 space-y-1">
                <span className="text-xs font-semibold">Primary Blue</span>
                <p className="text-[11px] font-mono opacity-80">#2563EB</p>
                <p className="text-[10px] opacity-70">Action & Interaction</p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#38BDF8] text-[#0B1F44] p-4 space-y-1">
                <span className="text-xs font-semibold">Accent Cyan</span>
                <p className="text-[11px] font-mono opacity-80">#38BDF8</p>
                <p className="text-[10px] opacity-70">Intelligence Signal</p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#F8FAFC] text-[#0B1F44] p-4 space-y-1">
                <span className="text-xs font-semibold">Near White</span>
                <p className="text-[11px] font-mono opacity-80">#F8FAFC</p>
                <p className="text-[10px] opacity-70">Clean Light Surface</p>
              </div>
            </div>
          </div>

          {/* Typography Scale */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-muted)]">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              Typography Scale (Inter)
            </h4>
            <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="space-y-0.5 border-b border-[var(--border-muted)] pb-3">
                <span className="text-[10px] uppercase font-mono text-[var(--foreground-muted)]">Display Heading</span>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
                  Understand. Compare. Act with confidence.
                </p>
              </div>

              <div className="space-y-0.5 border-b border-[var(--border-muted)] pb-3">
                <span className="text-[10px] uppercase font-mono text-[var(--foreground-muted)]">H1 Page Heading</span>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  Document Intelligence Summary
                </p>
              </div>

              <div className="space-y-0.5 border-b border-[var(--border-muted)] pb-3">
                <span className="text-[10px] uppercase font-mono text-[var(--foreground-muted)]">H2 Section Heading</span>
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  Key Clauses & Obligations Overview
                </p>
              </div>

              <div className="space-y-0.5 border-b border-[var(--border-muted)] pb-3">
                <span className="text-[10px] uppercase font-mono text-[var(--foreground-muted)]">Body Text (14px / 16px)</span>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  LexiGuide AI provides structured clause categorization, highlighting operational duties, indemnity thresholds, and termination parameters.
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-[var(--foreground-muted)]">Tabular Numerals for Legal References</span>
                <p className="text-sm font-mono tabular-nums text-[var(--foreground)]">
                  Section 14.2.1 &bull; Page 18 of 42 &bull; ₹1,25,00,000 Threshold &bull; 30-Day Window
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
