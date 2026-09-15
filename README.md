# LexiGuide AI

> **"Understand. Compare. Act with confidence."**

LexiGuide AI is an India-first legal document intelligence and legal information assistant built for the **PromptWars: Virtual (Exclusive Edition)** challenge by Hack2Skill. It helps users understand complex agreements, highlight key clauses, detect potential concerns, analyze obligations, compare document revisions, and generate actionable next steps.

> **IMPORTANT LEGAL NOTICE:**  
> LexiGuide AI is a legal information assistant. It is **NOT an AI lawyer** and does **NOT provide formal legal advice**. It must never be positioned as replacing a qualified legal professional.

---

## Final Production Status: Phase 7 Complete & Release Ready

- **Phase 1**: Frontend UI Foundation & Light-Only Design System (`#0B1F44`, `#2563EB`, `#38BDF8`, `#F8FAFC`).
- **Phase 2**: Real Document Processing Engine (PDF, DOCX, TXT normalization, section detection, semantic chunking).
- **Phase 3**: NVIDIA Nemotron 3 Super 120B A12B Legal Document Intelligence Pipeline.
- **Phase 4**: Grounded AI Q&A Engine (Ask Document) with citation-verified evidence retrieval.
- **Phase 5**: Dual-Document Comparison Engine with temporary Document B lifecycle & Action Center.
- **Phase 6**: Anonymous identity, sliding-window rate limiting, daily quota store, and comprehensive test suite.
- **Phase 7**: Production polish, removal of Analysis Copilot, collapsed-by-default document navigation sidebar, layout stability (`scrollbar-gutter: stable`), and full document workspace reset on Exit.

---

## Core Product Workflow

```
UPLOAD A DOCUMENT
      ↓
DOCUMENT PROCESSING (PDF / DOCX / TXT)
      ↓
ANALYSIS WORKSPACE (Overview, Summary, Clauses, Concerns, Obligations, Dates)
      ↓
ASK DOCUMENT (Grounded Q&A with real citations)
      ↓
COMPARE (Temporary Document B revision comparison)
      ↓
ACTION CENTER (Document-derived review items & checklist)
      ↓
EXIT BUTTON (Complete Workspace Reset → Clean Upload State)
```

---

## AI Model & Architecture

- **AI Model**: NVIDIA Nemotron 3 Super 120B A12B
- **Model ID**: `nvidia/nemotron-3-super-120b-a12b`
- **Provider**: NVIDIA API
- **Protocol**: NVIDIA hosted OpenAI-compatible API (`/chat/completions`)
- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **Context Handling**: Bounded context builder with untrusted document boundaries (`<untrusted_document_context>`, `<document_evidence>`)
- **Validation**: Strict Zod schema validation + verbatim evidence source verification

---

## Anonymous Security, Quotas & Rate Limits

LexiGuide AI operates with privacy-first anonymous sessions (no forced signup or user tracking):
- **Identity**: Cryptographic UUID assigned via secure, HttpOnly, SameSite=Lax cookie (`lexiguide_session`).
- **Sliding-Window Rate Limits**:
  - Uploads: 5 per minute
  - AI Analyses: 3 per minute
  - Q&A Questions: 10 per minute
  - Comparisons: 3 per minute
- **Daily Quotas**:
  - Uploads: 5 documents / day
  - AI Analyses: 10 / day
  - Comparisons: 3 / day
  - Q&A: 20 questions / document / day
- **File Constraints**: Maximum 25MB file size, maximum 150 pages.

---

## Document Workspace & Exit Lifecycle

### The Invariant:
```
NO ACTIVE DOCUMENT = NO DOCUMENT WORKSPACE
EXIT = COMPLETE DOCUMENT WORKSPACE RESET
```

When the user clicks **Exit**:
1. **Client Reset**: Active document, session documents, cached AI analyses, and custom action items are purged from `sessionStorage`.
2. **Server Reset**: Server-side document registrations and temporary comparison documents are deleted from `serverDocumentStore` and `temporaryComparisonStore`.
3. **In-Flight Discard**: In-flight requests are aborted and stale late responses are discarded via workspace generation tracking.
4. **Identity Preserved**: The anonymous session UUID, rate limit windows, and quota consumption are preserved.
5. **Clean Slate**: Direct routes (`/analyze`, `/qa`, `/compare`, `/action-center`) and browser Back navigation render the clean upload-required state.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS v4 with semantic CSS variables
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Node Test Runner (`node:test`)

---

## Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env.local` and configure your server-side API key:
```bash
cp .env.example .env.local
```
Set `NVIDIA_API_KEY` in `.env.local`. Client code never has access to this key.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Tests & Validation
```bash
npm test            # 148 automated tests
npm run typecheck   # TypeScript type check
npm run lint        # ESLint check
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 5. Production Build
```bash
npm run build
```

---

## Known Infrastructure Limitations

- **In-Memory Store**: `serverDocumentStore`, `temporaryComparisonStore`, `quotaStore`, and `rateLimiter` operate in-memory on the Node server runtime. This is ideal for single-instance, hackathon, and local evaluation environments. For horizontally-scaled, multi-instance production clusters, backing these stores with a distributed Redis-compatible cache (e.g. Upstash Redis) is recommended.
