"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  FileText,
  RotateCcw,
  Info,
  BookOpen,
  Copy,
} from "lucide-react";
import { WorkspaceNav } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QATopicGroups } from "./qa-topic-groups";
import { QAConversation } from "./qa-conversation";
import { QAInput } from "./qa-input";
import {
  QA_FIXTURE_DATABASE,
  QA_NOT_FOUND_RECORD,
} from "../fixtures/qa-fixture";
import type { QuestionMessage, EvidenceCitation } from "@/types";

const INITIAL_QA_MESSAGES: QuestionMessage[] = [
  {
    id: "init-qa-1",
    documentId: "doc-ea-2026",
    question: "What is this agreement about?",
    answer:
      "This is a full-time Employment Agreement defining terms of service between Acme Technologies Pvt. Ltd. (Employer) and Rahul Mehta (Employee). It establishes key provisions including compensation, operational duties, intellectual property rights, non-disclosure commitments, termination notice requirements, and arbitration dispute procedures.",
    evidence: [
      {
        id: "ev-init-1",
        sectionTitle: "Section 1 & 2",
        pageNumber: 1,
        excerpt:
          "This Employment Agreement is entered into by and between Acme Technologies Pvt. Ltd. and Rahul Mehta, setting forth the mutual covenants, responsibilities, and terms of service.",
        documentTitle: "Employment_Agreement_2026.pdf",
      },
    ],
    askedAt: "10:00 AM",
    answeredAt: "10:00 AM",
    suggestedNextStep:
      "Review the Summary view for a full breakdown of key contractual milestones.",
  },
];

export function QAWorkspace() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");

  const [messages, setMessages] = React.useState<QuestionMessage[]>(INITIAL_QA_MESSAGES);
  const [isThinking, setIsThinking] = React.useState(false);
  const [activeCitation, setActiveCitation] = React.useState<EvidenceCitation | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  const counterRef = React.useRef(200);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll on message updates
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = React.useCallback((text: string) => {
    counterRef.current += 1;
    const userMsg: QuestionMessage = {
      id: `usr-qa-${counterRef.current}`,
      documentId: "doc-ea-2026",
      question: text,
      askedAt: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const lower = text.toLowerCase().trim();
      let matchedRecord = QA_FIXTURE_DATABASE[lower];

      // Loose keyword matching if exact question not hit
      if (!matchedRecord) {
        if (lower.includes("terminat") || lower.includes("notice") || lower.includes("fire")) {
          matchedRecord = QA_FIXTURE_DATABASE["explain the termination clause."];
        } else if (lower.includes("obligation") || lower.includes("duty") || lower.includes("have to do")) {
          matchedRecord = QA_FIXTURE_DATABASE["what do i have to do?"];
        } else if (lower.includes("confident") || lower.includes("nda") || lower.includes("secret")) {
          matchedRecord = QA_FIXTURE_DATABASE["explain the confidentiality clause."];
        } else if (lower.includes("ip") || lower.includes("intellectual") || lower.includes("invention") || lower.includes("patent")) {
          matchedRecord = QA_FIXTURE_DATABASE["what does the ip assignment clause say?"];
        } else if (lower.includes("party") || lower.includes("parties") || lower.includes("who")) {
          matchedRecord = QA_FIXTURE_DATABASE["who are the parties and their roles?"];
        } else if (lower.includes("review") || lower.includes("concern") || lower.includes("risk") || lower.includes("careful")) {
          matchedRecord = QA_FIXTURE_DATABASE["which clauses should i review carefully?"];
        } else if (lower.includes("non-compete") || lower.includes("restrict") || lower.includes("solicit")) {
          matchedRecord = QA_FIXTURE_DATABASE["are there restrictive post-employment covenants?"];
        } else if (lower.includes("lawyer") || lower.includes("professional") || lower.includes("indemnity")) {
          matchedRecord = QA_FIXTURE_DATABASE["what provisions may deserve professional review?"];
        } else if (lower.includes("summar") || lower.includes("about") || lower.includes("overview")) {
          matchedRecord = QA_FIXTURE_DATABASE["what is this agreement about?"];
        }
      }

      counterRef.current += 1;
      let assistantMsg: QuestionMessage;

      if (matchedRecord) {
        assistantMsg = {
          id: `asst-qa-${counterRef.current}`,
          documentId: "doc-ea-2026",
          question: text,
          answer: `${matchedRecord.directAnswer} ${matchedRecord.explanation}`,
          evidence: [
            {
              id: `ev-${counterRef.current}`,
              sectionTitle: matchedRecord.sectionReference,
              pageNumber: matchedRecord.pageNumber,
              excerpt: matchedRecord.evidenceExcerpt,
              documentTitle: "Employment_Agreement_2026.pdf",
            },
          ],
          askedAt: "Just now",
          answeredAt: "Just now",
          suggestedNextStep: matchedRecord.suggestedNextStep,
        };
      } else {
        assistantMsg = {
          id: `asst-qa-${counterRef.current}`,
          documentId: "doc-ea-2026",
          question: text,
          answer: `${QA_NOT_FOUND_RECORD.directAnswer} ${QA_NOT_FOUND_RECORD.explanation}`,
          isNotFound: true,
          askedAt: "Just now",
          answeredAt: "Just now",
          suggestedNextStep: QA_NOT_FOUND_RECORD.suggestedNextStep,
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 450);
  }, []);

  // Handle incoming query param if provided
  const queryHandledRef = React.useRef(false);
  React.useEffect(() => {
    if (initialQuery && !queryHandledRef.current) {
      queryHandledRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, handleSendMessage]);

  const handleReset = () => {
    setMessages(INITIAL_QA_MESSAGES);
  };

  const handleOpenEvidence = (msg: QuestionMessage) => {
    const citation = msg.evidence?.[0];
    if (citation) {
      setActiveCitation(citation);
      setIsEvidenceOpen(true);
    }
  };

  const handleCopyCitation = async () => {
    if (!activeCitation) return;
    const text = `Citation: "${activeCitation.excerpt}" — ${activeCitation.documentTitle}, ${activeCitation.sectionTitle}, Page ${activeCitation.pageNumber}.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } catch {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. Shared Workspace Navigation */}
      <WorkspaceNav
        documentName="Employment_Agreement_2026.pdf"
        documentType="Employment Agreement"
        extraRightControls={
          <Badge variant="brand" size="sm" dot className="hidden sm:inline-flex">
            Grounded Q&amp;A
          </Badge>
        }
      />

      {/* 2. Main Q&A Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left / Center Column: Conversation Flow */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Sub-Header */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate">
                  Ask Your Document
                </h1>
                <p className="text-[11px] text-[var(--foreground-muted)] hidden sm:block">
                  Verified answers grounded in Employment_Agreement_2026.pdf
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                className="text-xs"
                title="Reset conversation"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 focus:outline-none"
          >
            <QAConversation
              messages={messages}
              isThinking={isThinking}
              onViewEvidence={handleOpenEvidence}
            />
          </div>

          {/* Sticky Input Field */}
          <QAInput onSendMessage={handleSendMessage} disabled={isThinking} />
        </div>

        {/* Right Column: Suggested Topics & Document Grounding Details (Desktop) */}
        <aside
          aria-label="Suggested Inquiries & Document Summary"
          className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--surface-subtle)] overflow-y-auto p-4 sm:p-6 space-y-6 text-left hidden md:block"
        >
          {/* Grounding Context Card */}
          <Card density="compact" className="p-3.5 bg-[var(--surface)] border-[var(--border)] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--primary)]">
              <FileText className="h-4 w-4" />
              <span>Grounded Document Context</span>
            </div>
            <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
              Every answer is synthesized strictly from the 18 substantive pages of <span className="font-semibold text-[var(--foreground)]">Employment_Agreement_2026.pdf</span>.
            </p>
          </Card>

          {/* Categorized Topic Inquiries */}
          <QATopicGroups onSelectQuestion={handleSendMessage} />

          {/* Statutory Informational Banner */}
          <div className="p-3 rounded-[var(--radius-md)] bg-blue-50/50 border border-blue-200/60 text-[11px] text-blue-950 space-y-1">
            <p className="font-semibold">Informational Assistance</p>
            <p className="leading-relaxed text-[10px]">
              LexiGuide AI helps users understand and navigate legal text. It does not provide formal legal representation or legal advice.
            </p>
          </div>
        </aside>
      </div>

      {/* Grounded Citation Modal */}
      <Dialog
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title="Grounded Contract Citation"
        description="Verbatim contract wording extracted directly from the uploaded agreement."
        className="max-w-xl"
      >
        {activeCitation && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs font-mono">
              <span className="font-semibold text-[var(--foreground)]">
                {activeCitation.documentTitle}
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant="brand" size="sm">
                  {activeCitation.sectionTitle}
                </Badge>
                <Badge variant="neutral" size="sm">
                  Page {activeCitation.pageNumber}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-lg)] border-l-4 border-[var(--primary)] bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Extracted Clause Passage</span>
              </div>
              <p className="text-sm italic leading-relaxed text-[var(--foreground)] font-serif">
                &ldquo;{activeCitation.excerpt}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-muted)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCitation}
                className="text-xs"
              >
                {copiedCitation ? "Citation Copied!" : "Copy Citation"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEvidenceOpen(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
