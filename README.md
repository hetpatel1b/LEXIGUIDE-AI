# LexiGuide AI

> **"Understand. Compare. Act with confidence."**

LexiGuide AI is a legal document intelligence and legal information assistant designed to help users understand complex agreements, highlight key clauses, detect risks, analyze obligations, compare documents, and generate actionable next steps.

The product is architected with an **India-first + international/general contract support** model.

> **IMPORTANT LEGAL NOTICE:**  
> LexiGuide AI is a legal information assistant. It is **NOT an AI lawyer** and does **NOT provide formal legal advice**. It must never be positioned as replacing a qualified legal professional.

---

## Current Development State: Phase 1 Complete (FROZEN)

**Phase 1 (1A through 1F) — Complete Frontend UI Foundation & Architecture**

The full frontend UI suite for LexiGuide AI is implemented, hardened, and accessible:
- **Phase 1A**: Foundation & Architecture (Next.js 16, TypeScript Strict, Design Tokens)
- **Phase 1B**: Design System & Primitives (Button, Card, Badge, Modal, Drawers, Theme Engine)
- **Phase 1C**: Landing Page & Upload Experience (`/`)
- **Phase 1D**: Analysis Workspace & 3-Panel Dashboard (`/analyze`)
- **Phase 1E**: Comparison (`/compare`), Ask Document Q&A (`/qa`), Action Center (`/action-center`)
- **Phase 1F**: Final Responsive, Accessibility (WCAG 2.2 AA), Touch Targets, and Frontend Hardening

### Architectural Boundaries & Current Limitations:
All frontend workflows are currently driven by centralized, typed synthetic development fixtures (`src/features/*/fixtures/`).
The following backend systems are intentionally deferred to subsequent phases:
- ❌ Real AI / NVIDIA Nemotron API integration (Scheduled for Phase 3)
- ❌ Real PDF / DOCX / TXT file extraction and parsing engine (Scheduled for Phase 2)
- ❌ RAG pipelines, embeddings, or vector databases (Scheduled for Phase 3 / 4)
- ❌ Algorithmic document diffing backend (Scheduled for Phase 5)
- ❌ Authentication, database persistence, user accounts, or billing

Phase 1 is officially **FROZEN** and serves as the stable UI baseline for Phase 2 (Real Document Processing Engine).

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
