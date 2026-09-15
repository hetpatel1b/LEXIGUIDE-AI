import type { DocumentChunk, DocumentSection } from "@/lib/document-engine/types";

export type InconsistencyTopic =
  | "invoice_payment"
  | "final_settlement"
  | "retention_award"
  | "bonus_incentive"
  | "termination_notice"
  | "cure_period_notice"
  | "dispute_discussion_notice"
  | "remote_work"
  | "leave_accrual"
  | "arbitration_seat"
  | "governing_law"
  | "confidentiality_duration"
  | "non_compete_duration";

export interface NormalizedObligation {
  category: InconsistencyTopic;
  actor: "company" | "executive" | "employee" | "party" | "both" | "vendor";
  action:
    | "pay"
    | "terminate"
    | "cure"
    | "negotiate"
    | "work_remotely"
    | "accrue_leave"
    | "arbitrate"
    | "maintain_confidentiality"
    | "restrict_competition";
  object:
    | "invoice"
    | "final_salary"
    | "retention_bonus"
    | "annual_bonus"
    | "agreement"
    | "breach"
    | "dispute"
    | "remote_days"
    | "annual_leave"
    | "arbitration_proceedings"
    | "confidential_info"
    | "competing_business";
  trigger:
    | "invoice_receipt"
    | "termination"
    | "written_notice"
    | "breach_notice"
    | "pre_dispute"
    | "standard";
  obligationKey: string;
  terms: string[];
  qualifiers: string[];
  isNegation?: boolean;
  verbatimSentence: string;
  effectiveSectionTitle: string;
}

export interface InternalCandidate {
  section: DocumentSection;
  chunk: DocumentChunk;
  obligation: NormalizedObligation;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface ClauseUnit {
  text: string;
  heading: string;
}
