# LexiGuide AI

> **"Understand. Compare. Act with confidence."**

LexiGuide AI is a legal document intelligence and legal information assistant designed to help users understand complex agreements, highlight key clauses, detect risks, analyze obligations, compare documents, and generate actionable next steps.

The product is architected with an **India-first + international/general contract support** model.

> **IMPORTANT LEGAL NOTICE:**  
> LexiGuide AI is a legal information assistant. It is **NOT an AI lawyer** and does **NOT provide formal legal advice**. It must never be positioned as replacing a qualified legal professional.

---

## Development State: Phase 3 Nemotron 3 Super 120B Engine (ACTIVE)

- **Phase 1 (1A–1F)**: Complete Frontend UI Foundation & Design System (Frozen baseline)
- **Phase 2**: High-Fidelity Document Processing Engine (PDF, DOCX, TXT normalization, section detection, semantic chunking)
- **Phase 3**: NVIDIA Nemotron 3 Super 120B A12B Legal Document Intelligence Pipeline

### AI Model & Architecture

- **AI Model**: NVIDIA Nemotron 3 Super 120B A12B
- **Model ID**: `nvidia/nemotron-3-super-120b-a12b`
- **Provider**: NVIDIA
- **API Style**: NVIDIA hosted OpenAI-compatible API (`/chat/completions`)
- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **Historical Benchmark Model**: `nvidia/nemotron-3-ultra-550b-a55b` (previous prototype baseline)

#### End-to-End Analysis Pipeline:
```
User Document (PDF / DOCX / TXT)
      ↓
Phase 2 Document Engine (Extraction, Section Detection, Chunks)
      ↓
NormalizedDocument
      ↓
Coverage-Aware Context Builder (12–15 Legal Categories, deterministic bounds)
      ↓
Legal Safety System Prompt (Untrusted Data boundary, no legal advice, concise bounds)
      ↓
NVIDIA API (OpenAI-compatible)
      ↓
NVIDIA Nemotron 3 Super 120B A12B
      ↓
Structured JSON Stream
      ↓
JSON Parse & Cleanup
      ↓
Zod Schema Validation (RawAiAnalysisResponseSchema)
      ↓
Source & Evidence Validator (Chunk quote grounding, section/page verification)
      ↓
Verified AnalysisResult
      ↓
LexiGuide Interactive Workspace
```

The model is **never** the final authority. The uploaded document, strict schema validation, and citation verification are the authority.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, Server Components by default)
- **Language**: TypeScript 5 (Strict Mode enabled)
- **Styling**: Tailwind CSS v4 with semantic CSS variables
- **Icons**: Lucide React
- **Validation**: Zod
- **Code Quality**: ESLint 9 (`next/core-web-vitals`, `next/typescript`)

---

## Project Structure

```
src/
├── app/                  # Next.js App Router root layouts, pages, and global CSS
│   ├── layout.tsx        # Application shell layout (Header, Main, Footer)
│   ├── page.tsx          # Phase 1A foundation status & brand presentation
│   ├── globals.css       # Tailwind imports, brand tokens, semantic variables
│   ├── not-found.tsx     # 404 handler
│   ├── error.tsx         # Client error boundary
│   └── loading.tsx       # Loading skeleton
│
├── components/
│   ├── ui/               # Reusable primitive UI components (Button, Card, Badge)
│   ├── layout/           # Application shell components (AppHeader, AppFooter)
│   └── shared/           # Cross-cutting components (BrandLogo)
│
├── features/             # Modular feature boundaries (Architectural contracts)
│   ├── landing/          # Homepage presentation layer (Phase 1C)
│   ├── upload/           # Document ingestion & dropzone (Phase 1C / Phase 2)
│   ├── analysis/         # Summary, Clauses, Risks, Obligations (Phase 1D / Phase 3)
│   ├── comparison/       # Dual-document comparison & diffs (Phase 1E / Phase 5)
│   ├── qa/               # Grounded Q&A & citations (Phase 1D / Phase 4)
│   └── action-center/    # Action plans & checklists (Phase 1E / Phase 5)
│
├── lib/
│   ├── config/           # Environment variable validation (client vs server)
│   ├── constants/        # Brand tokens, file constraints, navigation constants
│   └── utils/            # Class merging (cn), safe error sanitization
│
├── types/                # Domain type contracts (Document, Analysis, Comparison, QA)
└── schemas/              # Zod validation schemas (Document upload metadata)
```

---

## Brand Foundation & Design Tokens

Official brand tokens derived from approved visual guidelines:
- **Primary Navy**: `#0B1F44` (`--color-brand-navy`)
- **Primary Blue**: `#2563EB` (`--color-brand-blue`)
- **Accent Cyan**: `#38BDF8` (`--color-brand-accent`)
- **Near White**: `#F8FAFC` (`--color-surface`)

Official brand assets are located in `public/brand/`:
- `lexiguide-logo-light.png`: Approved horizontal lockup on light background
- `lexiguide-logo-dark.png`: Approved horizontal lockup on dark navy background
- `lexiguide-icon.png`: Official document + guide path + intelligence star mark
- `favicon.png`: 32x32 brand favicon
- `brand-guidelines.png`: Master visual identity specification sheet

---

## Environment Variable Architecture

Copy `.env.example` to `.env.local` for local execution:

```bash
cp .env.example .env.local
```

### Philosophy:
- Variables with `NEXT_PUBLIC_` are safely exposed to the client bundle (e.g. `NEXT_PUBLIC_APP_NAME`).
- Server secrets (e.g. future `NVIDIA_API_KEY`, `DATABASE_URL`) are strictly kept server-side and accessed via `getServerSecret()` in `src/lib/config/env.ts`.
- Never commit `.env` or `.env.local` files to Git.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Typecheck & Lint
```bash
npm run typecheck
npm run lint
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Production Bundle
```bash
npm run build
```
