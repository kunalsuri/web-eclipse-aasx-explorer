# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RE-Eclipse AASX Web — a browser-based Asset Administration Shell (AAS V3) package explorer/editor (CEA-LIST). React 18 + TypeScript SPA, Express backend, AASX (ZIP/OPC) parsing, a 150-rule AAS V3 validation engine, and JWT-based auth. It is a web reimplementation of a C# desktop app (referenced elsewhere as `x-external-proj`); feature-parity tracking against that app lives in `.kiro/CONSOLIDATED-SUMMARY.md`.

## Commands

```bash
npm run dev              # dev server (tsx server/index.ts), serves both API and Vite client at :5000
npm run build             # vite build -> dist/public
npm start                 # run production build (NODE_ENV=production node dist/index.js)
npm run check              # tsc typecheck (no emit)

npm test                   # run full test suite (vitest, config at tests/setup/vitest.config.ts)
npm run test:watch
npm run test:coverage
npm run test:unit          # tests/unit only
npm run test:integration   # tests/integration only
npm test -- path/to/file.test.ts          # single test file
npm test -- --grep "validation"           # tests matching a name

npm run db:push            # drizzle-kit push (requires DATABASE_URL; see below)
npm run create-admin       # tsx scripts/create-admin-user.ts
```

There is no lint script in `package.json`; `npm run check` (tsc) is the enforced gate. TypeScript is `strict: true`.

## Environment

Copy `.env.local.example` to `.env`. Key vars: `DATABASE_URL`, `SESSION_SECRET`, `PORT` (default 5000), `NODE_ENV`, plus optional `ECLASS_API_*` / `IECCDD_API_*` for dictionary lookups. `drizzle.config.ts` throws immediately if `DATABASE_URL` is unset, but note this only matters for `db:push` — see the storage note below.

## Architecture

Three top-level TS project areas share one `tsconfig.json` (path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`):

- **`client/`** — Vite root. Feature-driven under `client/src/features/*` (aas-explorer, aasx-editor, aasx-manager, auth, dashboard, dictionary-browser, idta-templates, plugin-manager, ...). Cross-feature UI in `components/` (property-editors, property-grid, tree, xml, dialogs, context-menu, bulk-operations — all under `components/ui` for Radix primitives). State is Zustand (`stores/`: editorStore with undo/redo, clipboardStore, selectionStore). Data fetching via TanStack Query (`api/`). Routing via Wouter.
- **`server/`** — Express app. `server/index.ts` boots storage before `registerRoutes`. `server/routes.ts` is the composition root that mounts feature routers (`server/aasx-routes.ts`, `server/src/api/*-routes.ts`: clipboard, dictionary, delete, reference-suggestion) plus auth/profile/logging routes. Business logic lives in `server/src/services/*` (element-manager, xml-serialization/deserialization, reference-suggestion, aas-package-creator, plugin-registry/loader/api, dictionary-adapters/*). Auth is JWT access tokens + a separate server-side session store (`server/auth/`: jwt-utils, session-manager, auth-middleware) — both must be considered when touching auth.
- **`shared/`** — the AAS domain core, used by both client and server: `aas-v3-types.ts` (full AAS V3 type system), `aas-parser.ts` (AASX/ZIP/OPC parsing via JSZip + fast-xml-parser), `aas-serialization.ts` (JSON<->Environment), `aas-validation-engine.ts` + `validation-rules/*` (150 AASd-* constraints, organized by category: structural/semantic/reference/datatype/cardinality — see `.kiro/CONSOLIDATED-SUMMARY.md` for the full constraint index), `aas-search-engine.ts`, `plugin-types.ts`/`plugin-manifest.ts` (plugin system contracts), `schema.ts` (Drizzle table defs + Zod schemas for users/sessions/tokens).

**Storage duality (non-obvious):** `shared/schema.ts` defines Postgres tables via Drizzle, and `drizzle.config.ts`/`db:push` target Postgres — but the actual runtime persistence used by `server/storage.ts` (`FileStorage`) and `server/auth/session-manager.ts` is flat JSON files under `data/` (`users.json`, `sessions.json`, `password_reset_tokens.json`, `preferences.json`), not the database. Treat the Drizzle schema as the intended/production data contract and the Zod schemas from it as the validation source of truth; don't assume a live Postgres connection is being read from in dev.

**AASX packages themselves** (the uploaded `.aasx` files being explored/edited) are separate from the user/session JSON store above — they're parsed in-memory via `shared/aas-parser.ts` and manipulated through `server/src/services/element-manager.ts`.

## Testing conventions

Tests live centrally in `tests/` (not colocated with source), split into `tests/unit/{client,server,shared}`, `tests/integration/{ui,validation,...}`, `tests/e2e/`, with shared `tests/fixtures/` and `tests/utils/`. Follow the AAA pattern (Arrange/Act/Assert) already used throughout. See `tests/README.md` for more detail.

## Code conventions (from `.github/copilot-instructions.md`)

- Functional components + hooks only; no class components.
- Named exports; default export reserved for the main component of a file.
- `interface` over `type` for object contracts; avoid `any` (must have a justifying comment if unavoidable); strict null checks are on.
- Directories use `lowercase-dash` naming; hooks prefixed `use`.
- Styling is Tailwind CSS; keep dark-mode support (project uses `next-themes`) and WCAG 2.1 AA accessibility in mind for UI changes.
- No side effects/async logic inside render bodies.

## Working with this codebase's AI-agent history

This project has been developed extensively through spec-driven, autonomous AI-agent sessions — this is the norm here, not an exception:

- **`.kiro/specs/<feature-name>/`** holds the spec-driven workflow artifacts: `requirements.md`, `design.md`, `tasks.md`, and often an `analysis-output/` with catalogs/reports. When implementing a substantial feature, check whether a matching spec folder already exists before starting; follow its task breakdown rather than re-deriving one.
- **`.kiro/CONSOLIDATED-SUMMARY.md`** is the living source of truth for feature-parity status against the C# desktop app, validation constraint coverage (150/150 AASd-* rules), and the phased roadmap to 100% parity. Consult its "NEXT STEPS" section before assuming what's already implemented.
- **`.github/prompts/`** contains the historical prompt templates used to drive prior autonomous implementation phases (e.g. `autonomus-code-implementation.prompt.md`). They describe the expected operating mode for large autonomous phases: complete, production-ready implementation (no placeholders), tests added alongside each feature under `tests/`, and pausing only for genuinely missing/contradictory requirements — not for routine confirmation.
- When a task matches this pattern (large, spec-backed, multi-phase), mirror the existing convention: implement a full phase, add the corresponding unit/integration tests under `tests/`, and update `.kiro/CONSOLIDATED-SUMMARY.md`'s progress tables rather than leaving status stale.
