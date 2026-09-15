# LexiGuide AI

### Understand. Compare. Act with confidence.

LexiGuide AI is an India-first legal document intelligence platform that transforms complex legal documents into understandable summaries, key provisions, potential review points, obligations, important dates, grounded document Q&A, document comparisons, inconsistency detection, and actionable next steps. 

It is a GenAI-powered, document-grounded, evidence-oriented assistant designed to help users navigate legal information. It is strictly an informational tool and not a replacement for a qualified legal professional.

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76B900?logo=nvidia&logoColor=white)

---

## The Problem

Legal documents are often long, dense, and difficult to understand for non-professionals. 
- Important clauses may be buried inside dense contractual language.
- Users often struggle to identify key obligations and critical deadlines.
- Comparing two versions of a document manually is a time-consuming and error-prone process where subtle differences can be easily missed.
- Users may not even know what questions they need to ask a legal professional when they seek one out.
- While generic AI chatbots exist, they often produce unsupported or hallucinated answers when not strictly grounded in the supplied document.

---

## Our Solution

LexiGuide AI solves this through a focused, purpose-built workflow rather than a collection of unrelated AI features. 

**UPLOAD**  
Users provide PDF, DOCX, or TXT legal documents.

**UNDERSTAND**  
The system extracts, normalizes, and structures the document, performing semantic chunking before analysis.

**IDENTIFY**  
The system surfaces key provisions, potential concerns, obligations, and important dates directly from the text.

**ASK**  
Users can ask specific questions about the uploaded document and receive grounded answers backed by direct evidence citations from the text.

**COMPARE**  
Users can compare two document versions to inspect substantive changes, categorize differences, and detect potential inconsistencies.

**ACT**  
The Action Center converts findings into actionable review priorities, questions for professionals, and next steps.

---

## Problem Statement → LexiGuide AI

| Challenge Requirement | LexiGuide AI Response | Evidence in Product |
| :--- | :--- | :--- |
| **Simplifying complex legal documents** | Plain-language executive summary and document overview | The Analysis Workspace breaks down the document into an accessible executive summary and categorizes information into readable sections. |
| **Understanding legal documents** | Structured document analysis, sections, key provisions, metadata | The system identifies the document type, parties involved, financial terms, and extracts key provisions across categories like liability, confidentiality, and termination. |
| **Comparing contracts/agreements/policies** | A/B document comparison with categorized substantive differences | The Dual-Document Comparison Engine evaluates Document A vs. Document B, highlighting major, moderate, and minor differences. |
| **Highlighting important clauses** | Key provisions across termination, payment, liability, confidentiality, IP, dispute resolution, data protection, etc. | The Analysis Copilot extracts and categorizes these clauses directly from the text, presenting them in a structured view. |
| **Identifying risks** | Potential concern scanner using cautious review-oriented language | The system identifies potential issues using non-definitive, safety-aware language like "potential concern" or "review point." |
| **Identifying obligations** | Party-specific obligations and timing | The Obligations tab lists specific duties assigned to each party, clarifying who is responsible for what. |
| **Identifying important dates** | Important dates and relative date expressions grounded in document text | The Dates section extracts explicit deadlines, commencement dates, and relative timing constraints from the document. |
| **Answering questions based on provided legal documents** | Grounded Ask Your Document Q&A | Users can query the document; answers are strictly grounded using semantic retrieval and verified quote citations. |
| **Highlighting inconsistencies** | Deterministic comparison and inconsistency detection | The Comparison engine goes beyond simple text diffing to identify substantive changes in obligations, triggers, and carve-outs. |
| **Helping users understand options** | Suggested review questions and Action Center | The system generates specific questions that the user should ask a legal professional based on the document's contents. |
| **Providing actionable outputs** | Next steps, review priorities, obligations, and questions for professionals | The Action Center synthesizes all analysis into a clear, prioritized checklist of next steps. |
| **Making legal information more accessible** | Plain-language explanations, evidence citations, accessible interface, responsive design | The entire UI is built for accessibility, ensuring that complex legal jargon is translated into plain, understandable terms with citations. |

---

## Why LexiGuide AI?

### Document-first
The document is the primary source of truth for all document analysis. The system is constrained to the context of the uploaded file.

### Evidence-first
Findings are connected to source sections, pages, or passages where possible, allowing users to verify AI claims.

### Comparison-first architecture
The system performs deterministic structural and substantive comparison before using the LLM for explanation and enrichment, ensuring high fidelity in change detection.

### Safety-aware
The product uses "potential concern" and "review point" language instead of presenting AI findings as definitive legal conclusions. It is designed to reduce unsupported claims.

### Action-oriented
The system does not stop at a summary. It actively helps users understand what they may want to review, prioritize, or discuss next with a professional.

### Focused scope
No unnecessary chatbot gimmicks, legal marketplace, payments, lawyer booking, voice/video, or unrelated AI features. Depth is prioritized over feature count.

---

## Core Capabilities

### 📄 Document Understanding
- Supports PDF, DOCX, and TXT formats
- Section detection and clause-aware structure
- Page and source mapping
- Deterministic semantic chunking

### 🧠 AI Legal Information Analysis
- Executive summary generation
- Document type and parties identification
- Dates and financial terms extraction
- Key provisions analysis
- Potential concerns and obligations surfacing
- Powered by `nvidia/nemotron-3-super-120b-a12b`

### 🔎 Evidence & Grounded Q&A
- Ask questions directly about the uploaded document
- Semantic retrieval for top-k relevant context
- Evidence references and source validation
- Verbatim quote verification
- Explicit "Not found in the uploaded document." behavior when evidence is unavailable

### ⚖️ Document Comparison
- Compare Document A (Original) and Document B (Revision)
- Categorizes major, moderate, and minor differences
- Identifies unchanged sections
- Semantic equivalence handling
- Qualifier and carve-out awareness
- Substantive change detection

### 🚨 Inconsistency Detection
Comparison is not merely text diffing. It considers:
- Obligation changes
- Actors and actions
- Objects and triggers
- Qualifiers and carve-outs
- Substantive clause changes

### ✅ Action Center
- Review priorities
- Party obligations
- Specific questions for professional review
- Actionable next steps
- Direct evidence references

### 🔐 Privacy & Security
- Anonymous sessions via server-minted session identity
- Server-side document ownership (no persistent client-side tracking)
- Strict daily quotas and sliding-window rate limits
- Concurrency guards and file validation
- Prompt injection protection
- Server-only NVIDIA API key

---

## The 60-Second Demo

```text
Upload Contract
      ↓
AI Analysis
      ↓
Summary ── Key Provisions ── Potential Concerns ── Obligations
      ↓
Ask Your Document
      ↓
Answer + Evidence
      ↓
Compare Version A vs B
      ↓
Substantive Differences
      ↓
Potential Inconsistencies
      ↓
Action Center
      ↓
Next Steps + Questions for Professional Review
```

---

## Technical Details

- **Model**: `nvidia/nemotron-3-super-120b-a12b`
- **Stack**: Next.js 16 (App Router), TypeScript 5, Tailwind CSS v4, Zod
- **Testing**: Tested against defined scenarios using Node Test Runner
- **Environment**: Requires `NVIDIA_API_KEY` configured in `.env.local`

**To run locally:**
```bash
npm install
npm run dev
```
