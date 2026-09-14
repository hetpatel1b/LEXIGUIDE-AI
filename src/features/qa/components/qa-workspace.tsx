"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  FileText,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { WorkspaceNav } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkspaceDrawer } from "@/features/analysis/components/workspace-drawers";
import { WorkspaceEmpty } from "@/features/analysis/components/states/workspace-empty";
import { QATopicGroups } from "./qa-topic-groups";
import { QAConversation } from "./qa-conversation";
import { QAInput } from "./qa-input";
import { getActiveDocument } from "@/lib/document-storage";
import type { NormalizedDocument } from "@/types/document";
import type { QuestionMessage, EvidenceCitation } from "@/types";

const emptySubscribe = () => () => {};

export function QAWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");

  const hasMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [qaHistory, setQaHistory] = React.useState<QuestionMessage[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [activeCitation, setActiveCitation] = React.useState<EvidenceCitation | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);
  const [isTopicsDrawerOpen, setIsTopicsDrawerOpen] = React.useState(false);
  const [copiedCitation, setCopiedCitation] = React.useState(false);

  const counterRef = React.useRef(200);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const activeDoc = React.useMemo(() => {
    if (!hasMounted) return null;
    return getActiveDocument();
  }, [hasMounted]);

  const messages = React.useMemo(() => {
    if (!activeDoc) return [];
    const initMsg: QuestionMessage = {
      id: "init-qa-1",
      documentId: activeDoc.id,
      question: "Document ready",
      answer: `Document "${activeDoc.displayName}" is active. Ask any questions regarding its provisions, duties, key dates, or potential concerns.`,
      askedAt: "Just now",
      answeredAt: "Just now",
    };
    return [initMsg, ...qaHistory];
  }, [activeDoc, qaHistory]);

  // Auto-scroll on message updates
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = React.useCallback((text: string) => {
    if (!activeDoc) return;

    counterRef.current += 1;
    const userMsg: QuestionMessage = {
      id: `usr-qa-${counterRef.current}`,
      documentId: activeDoc.id,
      question: text,
      askedAt: "Just now",
    };

    setQaHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      counterRef.current += 1;
      let assistantMsg: QuestionMessage;

      if (!activeDoc.chunks || activeDoc.chunks.length === 0) {
        assistantMsg = {
          id: `asst-qa-${counterRef.current}`,
          documentId: activeDoc.id,
          question: text,
          answer: `No readable content blocks found in ${activeDoc.displayName}.`,
          isNotFound: true,
          askedAt: "Just now",
          answeredAt: "Just now",
        };
      } else {
        const queryTerms = text
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 2 && !["what", "when", "where", "how", "the", "are", "and", "for", "does"].includes(t));

        let bestChunk = null;
        let highestScore = 0;

        for (const chunk of activeDoc.chunks) {
          const contentLower = chunk.text.toLowerCase();
          let score = 0;
          for (const term of queryTerms) {
            if (contentLower.includes(term)) {
              score += 1;
            }
          }
          if (score > highestScore) {
            highestScore = score;
            bestChunk = chunk;
          }
        }

        if (bestChunk && highestScore > 0) {
          const sectionTitle = bestChunk.sectionTitle || "Document Excerpt";
          const pageNumber = bestChunk.pageNumbers?.[0] ?? 1;

          assistantMsg = {
            id: `asst-qa-${counterRef.current}`,
            documentId: activeDoc.id,
            question: text,
            answer: `According to ${sectionTitle} in ${activeDoc.displayName}: "${bestChunk.text.slice(0, 350)}..."`,
            evidence: [
              {
                id: `ev-${counterRef.current}`,
                sectionTitle,
                pageNumber,
                excerpt: bestChunk.text.slice(0, 350),
                documentTitle: activeDoc.displayName,
              },
            ],
            askedAt: "Just now",
            answeredAt: "Just now",
            suggestedNextStep: "Review the full section in the document viewer for additional contractual context.",
          };
        } else {
          assistantMsg = {
            id: `asst-qa-${counterRef.current}`,
            documentId: activeDoc.id,
            question: text,
            answer: `Not found in the uploaded document (${activeDoc.displayName}). LexiGuide AI only answers based on terms actually identified in your active contract.`,
            isNotFound: true,
            askedAt: "Just now",
            answeredAt: "Just now",
            suggestedNextStep: "Try asking with specific terms from the document text.",
          };
        }
      }

      setQaHistory((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 450);
  }, [activeDoc]);

  // Handle incoming query param if provided
  const queryHandledRef = React.useRef(false);
  React.useEffect(() => {
    if (initialQuery && !queryHandledRef.current && activeDoc) {
      queryHandledRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, activeDoc, handleSendMessage]);

  const handleReset = () => {
    setQaHistory([]);
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

  // Prevent flash of empty state during hydration
  if (!hasMounted) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <div className="flex-1 flex items-center justify-center p-6 text-xs text-[var(--foreground-muted)]">
          Loading workspace…
        </div>
      </div>
    );
  }

  // If no real document is in active session, show intentional empty state
  if (!activeDoc) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <WorkspaceNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <WorkspaceEmpty
            title="No document available for Q&A"
            description="Upload a legal document in the Analysis workspace first to ask grounded questions about its clauses, duties, and terms."
            onUploadClick={() => router.push("/analyze")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. Shared Workspace Navigation */}
      <WorkspaceNav
        documentName={activeDoc.displayName}
        documentType={activeDoc.format.toUpperCase()}
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
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate">
                  Ask Your Document
                </h1>
                <p className="text-[11px] text-[var(--foreground-muted)] hidden sm:block truncate">
                  Grounded in {activeDoc.displayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTopicsDrawerOpen(true)}
                leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                className="md:hidden text-xs"
                title="View suggested inquiries and document grounding"
              >
                Topics
              </Button>
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
            className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-6 focus:outline-none"
          >
            <QAConversation
              messages={messages}
              isThinking={isThinking}
              onViewEvidence={handleOpenEvidence}
            />
          </div>

          {/* Sticky Input Field */}
          <QAInput
            documentName={activeDoc.displayName}
            onSendMessage={handleSendMessage}
            disabled={isThinking}
          />
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
              Every answer is synthesized strictly from {activeDoc.pageCount ? `${activeDoc.pageCount} pages of` : `${activeDoc.sections.length} sections in`}{" "}
              <span className="font-semibold text-[var(--foreground)]">{activeDoc.displayName}</span>.
            </p>
          </Card>

          {/* Categorized Topic Inquiries */}
          <QATopicGroups onSelectQuestion={handleSendMessage} />

          {/* Statutory Informational Banner */}
          <div className="p-3 rounded-[var(--radius-md)] bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-950 dark:text-blue-200 space-y-1">
            <p className="font-semibold">Informational Assistance</p>
            <p className="leading-relaxed text-[10px] text-blue-900/80 dark:text-blue-300/80">
              LexiGuide AI helps users understand and navigate legal text. It does not provide formal legal representation or legal advice.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile Topics & Grounding Drawer */}
      <WorkspaceDrawer
        isOpen={isTopicsDrawerOpen}
        onClose={() => setIsTopicsDrawerOpen(false)}
        title="Suggested Inquiries & Topics"
        side="right"
      >
        <div className="p-4 space-y-6 text-left">
          <Card density="compact" className="p-3.5 bg-[var(--surface)] border-[var(--border)] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--primary)]">
              <FileText className="h-4 w-4" />
              <span>Grounded Document Context</span>
            </div>
            <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
              Every answer is synthesized strictly from {activeDoc.pageCount ? `${activeDoc.pageCount} pages of` : `${activeDoc.sections.length} sections in`}{" "}
              <span className="font-semibold text-[var(--foreground)]">{activeDoc.displayName}</span>.
            </p>
          </Card>

          <QATopicGroups
            onSelectQuestion={(q) => {
              handleSendMessage(q);
              setIsTopicsDrawerOpen(false);
            }}
          />

          <div className="p-3 rounded-[var(--radius-md)] bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-950 dark:text-blue-200 space-y-1">
            <p className="font-semibold">Informational Assistance</p>
            <p className="leading-relaxed text-[10px] text-blue-900/80 dark:text-blue-300/80">
              LexiGuide AI helps users understand and navigate legal text. It does not provide formal legal representation or legal advice.
            </p>
          </div>
        </div>
      </WorkspaceDrawer>

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
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs font-mono flex-wrap">
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

            <div className="p-3.5 sm:p-4 rounded-[var(--radius-lg)] border-l-4 border-[var(--primary)] bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Extracted Clause Passage</span>
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed text-[var(--foreground)] font-serif">
                &ldquo;{activeCitation.excerpt}&rdquo;
              </p>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 pt-2 border-t border-[var(--border-muted)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCitation}
                className="text-xs w-full xs:w-auto"
              >
                {copiedCitation ? "Citation Copied!" : "Copy Citation"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEvidenceOpen(false)}
                className="text-xs w-full xs:w-auto"
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
