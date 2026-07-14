<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Architecture — web-eclipse-aasx-explorer

> [!NOTE]
> **This is a scaffolded template.** Run the `/cold-start` slash command in Claude Code (or see [docs/FAQ.md#cursor-copilot-codex](../../docs/FAQ.md#cursor-copilot-codex) for other tools) to have the agent explore your repository and automatically populate this file.

> Status: drafted by /cold-start 2026-07-14 @ commit `edba5d7`, from prior-config
> extraction (`CLAUDE_bkp_*.md`/`AGENTS_bkp_*.md`) cross-checked directly against
> source. Still `[inferred]` — a human must audit and flip to `[verified] (date)`.

## The big pieces  `[inferred]`
- **`client/`** — Vite-built React 18 + TypeScript SPA, feature-driven under
  [MODULE_MAP.md](MODULE_MAP.md) `client/src/features/*` (12 features: aas-explorer, aasx-editor,
  aasx-manager, app-shell, auth, dashboard, dictionary-browser, idta-templates,
  observability, package-creator, plugin-manager, user-profile). Zustand for state
  (`client/src/stores/`), TanStack Query for data fetching (`client/src/api/`),
  Wouter for routing.
- **`server/`** — Express app. `server/routes.ts` is the composition root, mounting
  feature routers from `server/src/api/*-routes.ts` plus `server/aasx-routes.ts`.
  Business logic lives in `server/src/services/*` (30 files). Auth lives in
  `server/auth/`.
- **`shared/`** — the AAS domain core, imported by both client and server via the
  `@shared/*` tsconfig path alias: type system (`aas-v3-types.ts`), AASX parsing
  (`aas-parser.ts`), serialization, the validation engine (`aas-validation-engine.ts`
  + `validation-rules/*`), search engine, plugin contracts, and the Drizzle/Zod
  `schema.ts`.
- **`data/`** — flat-JSON runtime storage (not a database) written by
  `server/storage.ts` and `server/auth/session-manager.ts`.
- **`.kiro/`** — spec-driven planning artifacts tracking feature-parity against a
  separate C# desktop app (referenced in specs as `x-external-proj`); this repo is
  a from-scratch web reimplementation, not a fork of that app's code
  (`ai/repo-profile.json` confirms `fork.isFork: false`).

## How they connect  `[inferred]`
- **Frontend ↔ backend:** REST over HTTP — `client/src/api/` hooks (TanStack Query)
  call `server/src/api/*-routes.ts` and `server/aasx-routes.ts` endpoints mounted
  by `server/routes.ts`. Both sides also import the same domain types/logic
  directly from `shared/` at build time (not over the wire) via `@shared/*`.
- **Auth is two independent mechanisms, both required:** JWT access tokens
  (`server/auth/jwt-auth-routes.ts`, `jwt-utils.ts`) plus a separate server-side
  session store (`server/auth/session-manager.ts`), enforced together by
  `server/auth/auth-middleware.ts`.
- **Storage duality (verified directly in code — important, non-obvious):**
  `shared/schema.ts` defines Postgres tables via Drizzle, and `npm run db:push`
  targets Postgres — but this is a contract only. Actual runtime persistence in
  dev/prod is flat JSON under `data/` (`config.json`, `preferences.json`,
  `sessions.json`, `users.json`), read/written by `server/storage.ts`
  (`FileStorage`) and `server/auth/session-manager.ts`. Do not assume a live
  Postgres connection is being read from.
- **AASX packages are a third, separate data path:** parsed in-memory via
  `shared/aas-parser.ts`; persisted to `data/aasx/` (with `data/aasx-backups/`)
  via `server/src/services/atomic-file-writer.ts` — not through
  `server/storage.ts`'s `FileStorage`.
- **Plugin system is early-stage — UNSURE, needs human:** `server/src/services/`
  has `plugin-registry.ts`, `plugin-loader.ts`, `plugin-api.ts`,
  `plugin-aas-api.ts`, `plugin-options-manager.ts` and `shared/plugin-manifest.ts`
  / `plugin-types.ts` define the contracts, but no server-side plugins directory
  or concrete plugin implementation (e.g. a "document-shelf" or
  "technical-data" plugin) was found in source — only in `docs/` prose and
  `.agents/architecture.md`. `.kiro/CONSOLIDATED-SUMMARY.md` tracks this as
  2/18 planned plugins implemented. Flagged in the AUDIT TODO.

## Diagrams
Text-based (Mermaid) diagrams live in `ai/analysis/diagrams/`. Regenerate them via
/cold-start; do not hand-maintain.

## Invariants an agent must not break  `[verified] required`
<Only humans add rows here. Examples: "generated code in X is never hand-edited",
"public API schemas are backwards compatible".>
