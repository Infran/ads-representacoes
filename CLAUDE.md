# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A React + TypeScript + Vite single-page app for **ADS Representações**, a Brazilian sales-representative business. It manages clients (`Clientes`), representatives (`Representantes`), products (`Produtos`), and budgets/quotes (`Orçamentos`), including PDF budget generation. All UI copy, routes, and domain fields are in Portuguese (Brazil). Backend is Firebase (Auth + Firestore), hosted on Firebase Hosting.

## Commands

```bash
npm run dev          # start dev server (mode=development)
npm run start         # alias for dev
npm run build:dev     # tsc + vite build --mode development
npm run build:prod    # tsc + vite build --mode production
npm run build          # tsc + vite build (default mode)
npm run lint           # eslint . --ext ts,tsx --max-warnings 0
npm run preview        # preview a production build locally
```

Test suite: Vitest + React Testing Library (`npm run test` / `npm run test:run`), plus a separate Firestore rules suite against the emulator (`npm run test:rules`). See `AUDITORIAS/ESTRUTURA/PLANO_EXECUCAO_ESTRUTURA.md` (F1) and `AUDITORIAS/SEGURANCA/PLANO_EXECUCAO_SEGURANCA.md` (S3.1) for how these were introduced.

### Deploy

**⚠️ Project ID naming is counter-intuitive — confirmed 2026-07-10 via `.env.production`/`.env.development`:**
- Real **production** Firestore/Auth = Project ID **`ads-representacoes-dev`** (display name "ads-representacoes-prod" in Firebase Console)
- Real **development** Firestore/Auth = Project ID **`ads-representacoes`** (display name "ads-representacoes-new-dev" in Firebase Console)

Yes, the ID *without* `-dev` is the dev project, and the ID *with* `-dev` is prod. Don't trust the suffix — verify against `.env.production`'s `VITE_FIREBASE_PROJECT_ID` if in doubt.

Firebase project aliases in `.firebaserc` (corrected 2026-07-10 to match the real mapping above): `default`/`development` → `ads-representacoes` (dev), `production` → `ads-representacoes-dev` (prod). An earlier pass in this session (SEG S0.4) had these backwards — it assumed the project ID without `-dev` suffix was production, which turned out to be false. Always verify against the `.env.*` files, not the project ID suffix.

**No CI/CD pipeline** — `.github/workflows/{ci,deploy}.yaml` were removed 2026-07-12 by explicit user decision; automation (lint/test/rules-check on push, and auto-deploy) is deferred to a future session. Don't recreate workflow files unless the user asks. This also retires the former SEG-09-rev finding (the old `deploy.yaml` had `development`/`main` branches auto-deploying to the *opposite* real environment) — there's no longer any automation left to have that bug.

Deploys are now **manual only**, via the Firebase CLI, using the aliases above:
```bash
firebase use development && npm run build:dev  && firebase deploy   # → real DEV  (ads-representacoes)
firebase use production  && npm run build:prod  && firebase deploy   # → real PROD (ads-representacoes-dev)
```
Bare `firebase deploy` (no `--only`) publishes **everything** in `firebase.json` — Hosting **and** `firestore.rules`/`firestore.indexes.json`. Scope it with `--only hosting` or `--only firestore:rules` when you mean just one. Never publish rules to a project before confirming its `staff/{uid}` docs already exist (see rule below) — this is now entirely on whoever runs the command, since nothing automated enforces the order anymore.

## Architecture

### Data flow: global cache in front of Firestore

This is the most important architectural pattern in the app (see `.gemini/tasks/firestore-optimization.md` for the full history/rationale — it was a deliberate optimization to stay within the Firestore free-tier read quota).

- `src/services/*Services.ts` (`budgetServices`, `clientServices`, `productServices`, `representativeServices`) contain the raw Firestore CRUD calls (`getDocs`, `setDoc`, `updateDoc`, `deleteDoc`, transactions for atomic ID generation, etc). These are considered low-level and are only meant to be called from `DataContext`.
- `src/services/cacheService.ts` is a module-level in-memory cache (`CacheKey = "budgets" | "clients" | "products" | "representatives"`) with a 5-minute TTL, mirrored to `localStorage` under key `ads_representacoes_cache`.
- `src/context/DataContext.tsx` (`DataProvider` / `useData()`) is the single source of truth for app data. It loads all four collections once on mount (after login), exposes them as arrays, and provides:
  - `refresh*()` — invalidates cache and refetches from Firestore
  - `search*Local()` — client-side filtering, zero Firestore reads
  - `add/update/remove*ToCache/InCache/FromCache()` — optimistic local cache mutation after a CRUD write, so screens never need a full reload

**Rule of thumb:** UI components and pages should read data via `useData()`, not via the `*Services.ts` functions directly. Call the raw service functions only for the actual write operation, then call the matching `useData()` cache-update function (or `refresh*`) — never `window.location.reload()`.

### Auth

`src/context/ContextAuth.tsx` (`AuthProvider` / `useAuth()`, also exports `AuthContext` directly) wraps the whole app in `main.tsx`. Uses Firebase Auth with `browserSessionPersistence` and a manual auto-logout timer keyed off `sessionStorage.loginTime`. `src/Router.tsx` reads `AuthContext` directly (via `useContext`, not the `useAuth` hook) to decide whether to mount the public `Login` route tree or the authenticated app (wrapped in `DataProvider`). `src/utils/ProtectedRoutes.tsx` is an additional `<Outlet>`-based guard used inside route definitions, redirecting to `/Login`.

### Routing & layout

Routes are defined in `src/Router.tsx` using Portuguese path segments (`/Home`, `/Produtos`, `/Clientes`, `/Representantes`, `/Orcamentos`, `/Orcamentos/Adicionar`, `/Orcamentos/Editar/:id`). Authenticated routes render inside `src/layouts/DefaultLayout` (fixed `AppHeader` + collapsible `Sidebar` + content `Outlet`). Sidebar menu items, route→title mapping, and breadcrumb derivation are centralized in `src/components/Layout/Sidebar/sidebarConfig.ts` — update this file when adding a new page/route rather than hardcoding titles elsewhere.

### Domain model

Core interfaces live in `src/interfaces/` (`ibudget.ts`, `iclient.ts`, `iproduct.ts`, `irepresentative.ts`), all backed by Firestore `Timestamp` for `createdAt`/`updatedAt`. Key relationships:
- `IRepresentative` embeds its parent `IClient`.
- `IBudget` embeds `IClient`, `IRepresentative`, and a list of `ISelectedProducts` (each wrapping an `IProduct` snapshot + `quantity` + optional `customUnitValue` — a per-budget price override that does not mutate the underlying product).
- Budget IDs are generated atomically via a Firestore transaction against `meta/lastBudgetId` (`getNextBudgetId` in `budgetServices.ts`), not Firestore auto-IDs.
- Money values (`unitValue`, `customUnitValue`) are stored as integer cents; `src/utils/Masks.ts` (`brMoneyMask`, `formatCurrencyToNumber`) handles BRL formatting/parsing. The same file has masks for CNPJ, CPF, CEP, and phone numbers — reuse these instead of writing new regexes for Brazilian document/format fields.

### Budget form

`src/hooks/useBudgetForm.ts` centralizes state and validation for both create and edit budget flows (used by `src/pages/BudgetFormPage`, mode `"create" | "edit"`). It reads `products`/`representatives` from `useData()` (never fetches directly) and filters them locally via `useMemo` + debounced search input. Section-by-section validation (`representative`, `products`, `terms`) is exposed via `sectionValidation` for progressive form UI.

### PDF generation

`src/utils/PDFGenerator/BudgetPdf.tsx` uses `@react-pdf/renderer` to generate the budget PDF document from an `IBudget`.

### Modals

CRUD modals are organized by verb under `src/components/Modal/{Create,Edit,Delete}/<Entity>Modal/`. New entity modals should follow this same folder-per-modal convention and call the corresponding `useData()` cache-update function on success.

## Conventions

- Path aliases: none — imports are relative (`../../services/...`).
- TypeScript `strict` is **off** in `tsconfig.json`; `noUnusedParameters` and `noFallthroughCasesInSwitch` are on. Don't assume strict-null-checks-level safety when reading existing code.
- ESLint config (`.eslintrc.cjs`) extends `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`, plus `react-refresh/only-export-components`. Run with `--max-warnings 0`, so warnings fail CI-equivalent checks.
- Env vars are Vite-style (`VITE_FIREBASE_*`) and loaded per-mode from `.env.development` / `.env.production` / `.env.local`; `src/firebase.ts` reads them via `import.meta.env`.
- User-facing strings, comments in service files, and confirmation dialogs (via `sweetalert2`) are written in Portuguese — match this when adding new UI text.
- **Commit Messages**: Use Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`) with optional scope: `type(scope): description`.
  - Start the commit title in lowercase (e.g., `refactor(produtos): migrate Products to...` or `feat(onboarding): adiciona indicador visual para...`).
  - For complex changes, add a body separated by a blank line explaining what and why.
  - **CRITICAL:** Do NOT under any circumstances include "Co-Authored-By" attribution or reference any AI/model name (e.g., Claude, Gemini) in the commit header, body, or footer.

