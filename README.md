# LexiGuide AI

### Understand. Compare. Act with confidence.

LexiGuide AI is an India-first legal document intelligence platform that transforms complex legal documents into understandable summaries, key provisions, potential review points, obligations, important dates, grounded document Q&A, document comparisons, inconsistency detection, and actionable next steps. It is a GenAI-powered, document-grounded, and evidence-oriented system designed for legal information and basic assistance, not as a replacement for a qualified legal professional.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76B900?logo=nvidia)
![Tests](https://img.shields.io/badge/Tests-201%20Passing-success)

---

## The Problem

Legal documents are often long, dense, and difficult to understand for non-experts. Important clauses and critical terms may be buried inside dense contractual language, causing users to struggle when trying to identify obligations, deadlines, and liabilities. 

When revisions occur, comparing two versions manually is incredibly time-consuming and differences can be easily missed. Furthermore, users may not know what questions to ask a legal professional, and relying on generic AI chatbots can produce unsupported, ungrounded answers that cause confusion or lead to risky decisions.

---

## Our Solution

LexiGuide AI focuses on a structured workflow rather than a collection of unrelated AI features. The conceptual flow is:

**Upload → Understand → Identify → Ask → Compare → Act**

- **UPLOAD**: Users securely provide PDF, DOCX, or TXT legal documents without required accounts.
- **UNDERSTAND**: The system parses, extracts, and structures the document deterministically before any AI analysis begins.
- **IDENTIFY**: The system surfaces key provisions, potential concerns, obligations, and important dates automatically.
- **ASK**: Users can ask questions about the uploaded document and receive answers grounded strictly in the retrieved evidence.
- **COMPARE**: Users can compare two documents and inspect substantive changes and potential inconsistencies.
- **ACT**: The Action Center converts findings into prioritized review items, next steps, and specific questions for legal professionals.

---

## Problem Statement → LexiGuide AI

| Challenge Requirement | LexiGuide AI Response | Evidence in Product |
| --- | --- | --- |
| **Simplifying complex legal documents** | Plain-language executive summary and document overview | Analysis Workspace breaks down dense terms into a readable summary. |
| **Understanding legal documents** | Structured document analysis, sections, key provisions, metadata | Document Engine extracts structure before Nemotron 3 Super evaluates it. |
| **Comparing contracts/agreements** | A/B document comparison with categorized substantive differences | Compare Workspace highlights major, moderate, and minor changes. |
| **Highlighting important clauses** | Key provisions across termination, payment, liability, confidentiality, IP, etc. | Analysis explicitly extracts Key Provisions with source mappings. |
| **Identifying risks** | Potential concern scanner using cautious review-oriented language | Identifies review points without declaring them definitively illegal. |
| **Identifying obligations** | Party-specific obligations and timing | Extracts clear action items assigned to specific parties. |
| **Identifying important dates** | Important dates and relative date expressions grounded in document text | Highlights deadlines and durations natively found in the text. |
| **Answering questions based on documents** | Grounded Ask Your Document Q&A | Retrieval layer validates quotes and citations against chunks. |
| **Highlighting inconsistencies** | Deterministic comparison and inconsistency detection | Goes beyond text diffing to identify changes in obligations and actors. |
| **Helping users understand options** | Suggested review questions and Action Center | Generates contextual questions to bring to a qualified professional. |
| **Providing actionable outputs** | Next steps, review priorities, and obligations | The Action Center consolidates AI findings into a single checklist. |
| **Making legal information more accessible** | Plain-language explanations, accessible interface, responsive design | Strict WCAG-oriented focus management, readable typography, clear UI. |

---

## Why LexiGuide AI?

### Document-first
The document is the primary source of truth for document analysis, not the LLM's pre-training data.

### Evidence-first
Findings are connected to source sections, pages, and passages where possible.

### Comparison-first architecture
The system performs deterministic structural and substantive comparison before using the LLM for explanation and enrichment.

### Safety-aware
The product uses "potential concern" and "review point" language instead of presenting AI findings as definitive legal conclusions.

### Action-oriented
The system does not stop at a summary. It helps users understand what they may want to review or discuss next.

### Focused scope
No unnecessary chatbot gimmicks, legal marketplace, payments, lawyer booking, voice/video, or unrelated AI features. Depth was prioritized over feature count.

---

## Core Capabilities

### 📄 Document Understanding
- Supports **PDF**, **DOCX**, and **TXT** files.
- Performs section detection, clause-aware structure extraction, and deterministic chunking.
- Maintains page mapping where available (without fabricating page numbers for DOCX/TXT).

### 🧠 AI Legal Information Analysis
- Generates an executive summary, detects document type, parties, dates, and financial terms.
- Identifies **key provisions**, **potential concerns**, **obligations**, and **important dates**.

### 🔎 Evidence & Grounded Q&A
- Ask questions strictly about the uploaded document via semantic retrieval.
- Surfaces top-k relevant context with evidence references and quote verification.
- Enforces an explicit *"Not found in the uploaded document"* behavior when evidence is unavailable.

### ⚖️ Document Comparison
- Compare Document A (Original) and Document B (Revision).
- Categorizes changes into major/moderate/minor differences while recognizing unchanged sections.
- Handles semantic equivalence and substantive change detection.

### 🚨 Inconsistency Detection
- Comparison considers obligation changes, actors, actions, objects, triggers, qualifiers, and carve-outs.
- Not merely a text diff—it detects substantive clause changes and conflicting statements.

### ✅ Action Center
- Transforms findings into review priorities, obligations, and questions.
- Includes evidence references and practical next steps.

### 🔐 Privacy & Security
- Anonymous sessions via server-minted identity (HttpOnly cookies).
- Server-side document ownership with strict file validation.
- Daily quotas, concurrency guards, sliding-window rate limits, and prompt injection defenses.
- Server-only NVIDIA API key that is never exposed to the client.

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
*This single focused workflow successfully demonstrates the majority of the PromptWars challenge requirements.*

---

## Architecture

```mermaid
graph TD
    U[User] -->|Interacts| W[Next.js Web Application]
    
    subgraph Client Workspaces
        W --> U1[Upload]
        W --> A1[Analysis Workspace]
        W --> Q1[Ask Your Document]
        W --> C1[Comparison Workspace]
        W --> AC[Action Center]
    end
    
    Client Workspaces -->|API Requests| S[Server API Layer]
    
    subgraph Server Infrastructure
        S --> SEC[Security / Session / Quota]
        SEC --> DE[Document Engine]
        
        DE --> V[Validation]
        DE --> FD[Format Detection]
        DE --> P[PDF/DOCX/TXT Parsing]
        DE --> SD[Section Detection]
        DE --> CH[Chunking]
        DE --> SM[Source Mapping]
        
        DE --> R[Retrieval / Evidence Layer]
        
        R --> RR[Relevant Chunk Retrieval]
        R --> SV[Source Validation]
        R --> QV[Quote Verification]
        
        R --> AI[NVIDIA Nemotron 3 Super 120B A12B]
        
        AI --> SO[Structured AI Output]
        SO --> ZV[Zod Validation + Evidence Validation]
    end
    
    ZV -->|JSON Payload| W
```

---

## Document Processing Pipeline

**File → Binary/MIME Validation → Parser → Normalized Document → Pages/Sections → Clause-aware structure → Chunks → Source Mapping → Retrieval → AI Analysis → Validated Result**

The AI model never receives an uncontrolled raw document without structure. By maintaining PDF page preservation, DOCX semantic structure, chunk IDs, and source references, LexiGuide ensures the model operates on deterministic data, substantially improving accuracy and grounding.

---

## Grounded AI, Not Free-Form Guessing

LexiGuide treats document text explicitly as untrusted data. The document is parsed into structured content, and only relevant chunks are selected for the given task. The NVIDIA Nemotron 3 Super model receives a bounded evidence context, and its output must follow strict Zod schemas. 

Most importantly, **citation IDs are checked against the actual document** and **quotes are verified against the actual chunk text**. Unsupported evidence is rejected. When evidence cannot answer a question, the system clearly communicates that limitation instead of hallucinating. A fluent answer is not enough; users need to know exactly where the answer came from.

---

## Responsible Legal AI

LexiGuide AI provides legal information and document understanding support. **It does not provide professional legal advice and does not replace a qualified lawyer or other legal professional.**

- Findings are informational.
- Potential concerns are review points, not declarations of illegality.
- Users should verify important decisions with qualified professionals.
- The system is constrained to not invent facts absent from the document.
- Uploaded document instructions are treated as untrusted content to prevent prompt injection.

---

## Security & Privacy

LexiGuide AI implements comprehensive anonymous security controls:
- **Server-minted anonymous identity** stored via HttpOnly, SameSite=Lax cookie.
- **Server-side document ownership** ensuring sessions cannot access other users' documents.
- **Comparison context isolation** for temporary document revisions.
- **Daily quotas** and **sliding-window rate limiting**.
- **Concurrency protection** to prevent duplicate in-flight processing.
- **File constraints** including magic-byte/signature validation, 25MB upload size limits, filename sanitization, and null-byte/control-character handling.
- **Prompt injection defenses** protecting the model from adversarial payloads inside contracts.
- **Server-only NVIDIA API key** and Zod validation across all endpoints.

*Note: Anonymous quota identity can be reset by clearing cookies, and the current cache/session state is instance-local. A shared Redis-compatible store would be the next hardening step for globally consistent distributed state.*

---

## Performance & Efficiency

LexiGuide AI architecture is optimized for minimal AI round-trips and deterministic fast paths:
- **small document local processing:** approximately 185 ms average
- **medium document local processing:** approximately 280 ms average
- **12-page document:** approximately 250 ms average
- **150-page document:** approximately 1450 ms average
- **Q&A retrieval path:** approximately 220 ms average before AI generation
- **comparison processing:** approximately 310 ms average before AI generation

Duplicate analysis requests safely reuse server-side in-flight or cached results, concurrent duplicate requests are deduplicated, and the Action Center performs no additional AI calls by leveraging existing analysis context.

---

## Accessibility

LexiGuide implements WCAG-oriented design principles to ensure broad usability:
- Keyboard navigation and comprehensive focus management.
- Focus traps for dialogs/drawers and focus restoration.
- Screen-reader-friendly labels, live regions, and skip navigation.
- Semantic headings and ARIA landmarks.
- 44px touch targets for mobile accessibility.
- Responsive layouts validated across viewport sizes.
- Tested against 200% and 400% zoom scaling.
- Playwright axe-core accessibility integration testing.

---

## Testing & Quality

LexiGuide AI is backed by comprehensive automated test coverage:

- **195 unit/integration tests**
- **6 end-to-end tests**
- **201 total automated tests**
- **0 failed | 0 skipped | 0 flaky**
- Line coverage: **85.79%**
- Branch coverage: **77.73%**
- Function coverage: **73.47%**
- Statement coverage: **85.79%**

The test matrix covers PDF/DOCX/TXT parsing, invalid/oversized files, AI schema validation, source validation, quote verification, hallucinated citation rejection, prompt injection, security isolation, quota/rate limiting, cache deduplication, document comparison, inconsistency detection, Q&A grounding, keyboard accessibility, and production smoke tests.

---

## Technology Stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4  
**AI:** NVIDIA Nemotron 3 Super 120B A12B (via NVIDIA API / OpenAI-compatible interface)  
**Document Processing:** unpdf, mammoth, internal deterministic document engine  
**Validation & Security:** Zod  
**Testing:** Node.js native test runner, Playwright, axe-core  

---

## Project Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── action-center/
│   ├── analysis/
│   ├── compare/
│   ├── qa/
│   └── upload/
├── lib/
│   ├── ai/
│   ├── document-engine/
│   ├── rate-limit/
│   ├── security/
│   └── utils/
├── schemas/
└── types/
tests/
```

---

## Getting Started

### Prerequisites
- Node.js version 20 or higher
- npm

### Installation
```bash
git clone <repository-url>
cd lexiguide-ai
npm install
```

### Environment Variables
Copy the `.env.example` file to create `.env.local`:
```bash
cp .env.example .env.local
```
Set your server-side API key in `.env.local`:
```env
NVIDIA_API_KEY=your_nvidia_api_key
```
**IMPORTANT:** Never expose `NVIDIA_API_KEY` to the browser. Never commit `.env.local`. Client code does not require or have access to this key.

### Development
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## How to Use LexiGuide AI

1. Open LexiGuide AI.
2. Upload a PDF, DOCX, or TXT document.
3. Wait for the automatic analysis to complete.
4. Review the plain-language summary and key provisions.
5. Inspect the potential concerns and obligations.
6. Open **Ask Your Document** to ask questions and view evidence.
7. Open **Compare** and upload another version to compare.
8. Review the substantive differences and potential inconsistencies.
9. Open the **Action Center**.
10. Use the suggested questions and next steps for further professional review.

---

## Supported Inputs and Limits

| Input | Supported | Notes |
| --- | --- | --- |
| **PDF** | ✅ | Text-based PDFs |
| **DOCX** | ✅ | Semantic document structure |
| **TXT** | ✅ | UTF-8 text |
| **OCR/Scanned PDF** | ❌ | Requires text-selectable documents |

**Verified System Limits:**
- Maximum file size: **25 MB**
- Maximum pages: **150**
- Anonymous upload quota: **5 documents/day**
- Anonymous analysis quota: **10 analyses/day**
- Anonymous comparisons quota: **3 comparisons/day**
- Q&A limit: **20 questions/document/day**

*(Quotas enforce anonymous-user resource protection via session IDs, not user accounts).*

---

## Current Limitations

- Scanned or image-only PDFs require OCR, which is outside the current scope of the application.
- DOCX files do not receive fabricated physical page numbers because internal physical page structure is unavailable in XML.
- Anonymous quota enforcement is session-based and can be reset by clearing browser cookies.
- Current in-memory state and caching is instance-local. A shared Redis-compatible store would improve distributed consistency for horizontal scaling.
- LexiGuide AI does not independently establish current law or provide authoritative legal advice. AI output always requires human review for consequential decisions.

---

## Future Improvements

- Implementation of shared distributed state using Redis-compatible infrastructure.
- OCR integration for scanned and image-heavy documents.
- Stronger authoritative legal-source retrieval once a verified legal-source architecture is introduced.
- Expanded comparison rule coverage for more nuanced document types.

---

## Engineering Highlights

- **Modular feature architecture**
- **Server-side AI integration**
- **Strict schema validation**
- **Source and evidence validation**
- **Deterministic document processing**
- **Deterministic comparison before LLM enrichment**
- **Prompt injection defenses**
- **Anonymous server-side security model**
- **Quotas and rate limiting**
- **In-flight deduplication**
- **Accessibility validation**
- **Comprehensive automated testing**
- **Safe error handling**
- **Production build validation**

---

## Why GenAI?

Generative AI is uniquely suited to translating dense contractual language into plain language, summarizing complex provisions, answering natural-language questions about documents, explaining differences between semantically related clauses, generating useful review questions, and synthesizing multiple evidence-backed findings.

However, LexiGuide AI ensures that **file validation, parsing, section mapping, source validation, quote verification, security, quotas, and comparison primitives remain strictly deterministic**. This demonstrates that the application does not simply send an entire document to an LLM and blindly display the response, but instead uses the LLM as a highly-constrained reasoning engine over structured, verifiable data.

---

## Product Philosophy

**Understand**  
Make complex documents easier to comprehend.

**Verify**  
Connect findings to the supplied evidence.

**Act**  
Turn understanding into practical review steps.

---

## Test Fixtures

Development and evaluation fixtures use synthetic legal documents designed to exercise document extraction, grounding, comparison, and negative-case behavior. They are not real legal contracts.

---

## Legal Disclaimer

LexiGuide AI provides informational assistance for understanding and reviewing legal documents. It is not a law firm, does not provide professional legal advice, and does not replace a qualified legal professional. AI-generated findings may be incomplete or incorrect and should be independently verified, especially before making legal, financial, employment, contractual, or other consequential decisions.

---

*Built for PromptWars: Virtual — Exclusive Edition*

**LexiGuide AI was built to make legal information easier to understand, compare, verify, and act on—while keeping professional legal review where it belongs.**
