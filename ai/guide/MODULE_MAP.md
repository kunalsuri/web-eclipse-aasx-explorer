<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Module map — directory → responsibility → entry point

> [!NOTE]
> **This is a scaffolded template.** Run the `/cold-start` slash command in Claude Code (or see [docs/FAQ.md#cursor-copilot-codex](../../docs/FAQ.md#cursor-copilot-codex) for other tools) to have the agent explore your repository and automatically populate this file.

> **Index only.** Find the area here, then open the entry file directly. Don't crawl
> the tree. The directory list can be regenerated; **Responsibility** and **Stability**
> are judgement and must be audited by a human.
> Drafted: 2026-07-14 @ commit `edba5d7` `[inferred]`. Last verified: <fill in date> @ commit <fill in sha> — human audit still pending.

## Stability legend (the most important column)
- `frozen` — inherited / load-bearing legacy, **or generated/vendored code**: never
  hand-edit; if it has a regeneration command, name it in the Responsibility cell
  and change the module only by re-running it. **DO NOT edit** without explicit
  instruction.
- `stable` — works; change carefully and with tests.
- `ours`   — active development surface. Safe for agents to modify.
- `?`      — not yet audited. **Treat as `frozen` until a human decides.**

## Modules (drafted by /cold-start 2026-07-14, commit `edba5d7` — audit before trusting)
| Directory | Responsibility (one line) | Entry point | Stability (guess) | Status |
|---|---|---|---|---|
| `client/src/features/aas-explorer/` | Browse/view a parsed AASX package's element tree | `client/src/features/aas-explorer/index.ts` | ours | [inferred] |
| `client/src/features/aasx-editor/` | Edit AAS elements (property editor); no single index — entry is via `components/` | `client/src/features/aasx-editor/components/` | ours | [inferred] |
| `client/src/features/aasx-manager/` | List/manage AASX packages on the server | `client/src/features/aasx-manager/index.ts` | ours | [inferred] |
| `client/src/features/app-shell/` | App layout/shell, navigation, theming | `client/src/features/app-shell/index.ts` | ours | [inferred] |
| `client/src/features/auth/` | Login/JWT auth UI | `client/src/features/auth/index.ts` | ours | [inferred] |
| `client/src/features/dashboard/` | Landing dashboard | `client/src/features/dashboard/index.ts` | ours | [inferred] |
| `client/src/features/dictionary-browser/` | ECLASS/IEC CDD dictionary lookup UI | `client/src/features/dictionary-browser/index.ts` | ours | [inferred] |
| `client/src/features/idta-templates/` | Browse/instantiate IDTA submodel templates | `client/src/features/idta-templates/index.ts` | ours | [inferred] |
| `client/src/features/observability/` | Client-side logging/telemetry UI | `client/src/features/observability/index.ts` | ours | [inferred] |
| `client/src/features/package-creator/` | Create new AASX packages | `client/src/features/package-creator/components/` | ours | [inferred] |
| `client/src/features/plugin-manager/` | Plugin list/settings UI — plugin system is early-stage (`.kiro/CONSOLIDATED-SUMMARY.md` tracks 2/18 planned plugins implemented; no actual plugin implementations found in `server/` despite `.agents/architecture.md` referencing a `server/src/plugins/` dir — **UNSURE, needs human**, see AUDIT TODO) | `client/src/features/plugin-manager/index.tsx` | ours | [inferred] |
| `client/src/features/user-profile/` | User profile/settings UI | `client/src/features/user-profile/components/` | ours | [inferred] |
| `client/src/components/` | Shared UI components (shadcn/Radix wrappers + app-level shared components) | — | stable | [inferred] |
| `client/src/stores/` | Zustand global state stores | — | ours | [inferred] |
| `client/src/api/` | TanStack Query hooks / API client wrappers | — | ours | [inferred] |
| `client/src/{hooks,lib,utils,pages,commands,services,examples}/` | Supporting client code (shared hooks, utilities, route pages, command palette, client-side services, usage examples) | — | ? | [inferred] |
| `server/routes.ts` | Composition root — mounts feature routers onto the Express app | `server/routes.ts` | stable | [inferred] |
| `server/src/api/` | REST endpoint handlers: clipboard, delete, dictionary, IDTA templates, plugin, reference/reference-suggestion, XML, `server/src/api/aasx/update.ts` | `server/src/api/*-routes.ts` | ours | [inferred] |
| `server/src/services/` | Business logic (30 files): plugin registry/loader/api, AASX package creator, export/import (CSV/Excel/XML), validation preset manager, dictionary service + adapters, search, unit conversion, template cache/download/instance services | — | ours | [inferred] |
| `server/src/models/` | Data models (`document-entity.ts`) | `server/src/models/document-entity.ts` | ours | [inferred] |
| `server/src/utils/` | Server-side utilities | — | ? | [inferred] |
| `server/auth/` | Auth: JWT access tokens (`jwt-auth-routes.ts`, `jwt-utils.ts`) + a **separate** server-side session store (`session-manager.ts`) + `auth-middleware.ts` — both mechanisms must be valid; see [ARCHITECTURE.md](ARCHITECTURE.md) | `server/auth/auth-middleware.ts` | stable | [inferred] |
| `server/storage.ts` | `FileStorage` — flat-JSON persistence for `data/` (users, sessions, prefs, config); this is what dev/runtime actually reads, not Postgres | `server/storage.ts` | stable | [inferred] |
| `server/index.ts`, `server/vite.ts`, `server/aasx-routes.ts`, `server/logging-endpoint.ts`, `server/profile.ts` | Server bootstrap, Vite middleware integration, top-level AASX routes, logging endpoint, profile endpoint | `server/index.ts` | stable | [inferred] |
| `shared/aas-v3-types.ts` | AAS V3 metamodel type system (spec-derived) | `shared/aas-v3-types.ts` | stable | [inferred] |
| `shared/aas-parser.ts` | AASX (ZIP/OPC) package parser; covered by golden-master fixtures in `tests/fixtures/golden-master/` | `shared/aas-parser.ts` | stable | [inferred] |
| `shared/aas-validation-engine.ts` + `shared/validation-rules/*` | AAS V3 constraint validation engine — 7 rule-category files (constraints, advanced, structural, semantic, reference, datatype, cardinality). Verified directly: `grep -ohE 'id: *"AASd-[0-9]+"' shared/validation-rules/*.ts \| sort -u` gives exactly 150 unique IDs, contiguous AASd-001..150 — matches `.kiro/CONSOLIDATED-SUMMARY.md`'s "150/150" claim. (Per-file counts sum to 161 because `aasd-advanced-constraints.ts`'s 11 rules overlap with IDs also defined in `aasd-constraints.ts` — don't double-count by summing file totals.) Use the `aas-validation-engineer` subagent for changes here. | `shared/aas-validation-engine.ts` | stable | [inferred] |
| `shared/schema.ts` | Drizzle + Zod schema — defines the Postgres contract; **not** what dev/runtime storage actually uses (see `server/storage.ts` row and [ARCHITECTURE.md](ARCHITECTURE.md)) | `shared/schema.ts` | stable | [inferred] |
| `shared/aas-search-engine.ts`, `aas-search-filters.ts`, `aas-search-types.ts` | AAS element search | `shared/aas-search-engine.ts` | stable | [inferred] |
| `shared/aas-serialization.ts`, `aas-validation.ts`, `aas-sample-data.ts` | Serialization helpers, legacy/simple validation, sample data for dev/tests | — | ? | [inferred] |
| `shared/plugin-manifest.ts`, `plugin-types.ts` | Plugin system contracts/types (system is early-stage — see plugin-manager row) | — | ours | [inferred] |
| `shared/dictionary-types.ts`, `idta-templates-types.ts`, `validation-types.ts` | Supporting shared type definitions | — | stable | [inferred] |
| `tests/` | Centralized test suite: `unit/{client,server,shared}`, `integration/{ui,validation,golden-master}`, `e2e/` (README only, no specs yet), `fixtures/`, `utils/` | `tests/setup/vitest.config.ts` | ours | [inferred] |
| `data/` | **Runtime state, not source** — flat-JSON storage (`users.json`, `sessions.json`, `config.json`, `preferences.json`) + `aasx/`, `aasx-backups/`, `logs/`. Generated/mutated at runtime by `server/storage.ts`; never hand-edit. | — | frozen | [inferred] |
| `scripts/` | One-off ops scripts: `add-license-headers.js`, `setup-local.ps1`/`.sh`. **Broken reference:** `package.json`'s `"create-admin": "tsx scripts/create-admin-user.ts"` script points at a file that does not exist anywhere in the repo (verified: `find . -iname "create-admin*"` outside `node_modules` returns nothing) — `npm run create-admin` will fail. Needs human decision: restore the script or remove the npm entry. See AUDIT TODO. | `scripts/add-license-headers.js` | ours | [inferred] |
| `config/` | Static config: `dictionary-config.json` (ECLASS/IEC CDD dictionary adapter config) | `config/dictionary-config.json` | stable | [inferred] |
| `.kiro/` | Spec-driven planning artifacts (not app code) — `specs/<feature>/{requirements,design,tasks}.md`, `CONSOLIDATED-SUMMARY.md` (feature-parity/plugin/constraint-count roadmap vs. the C# desktop app) | `.kiro/CONSOLIDATED-SUMMARY.md` | n/a (docs) | [inferred] |
| `docs/` | Standalone analysis docs (confidence-assessment/migration-strategy notes) | — | n/a (docs) | [inferred] |

Detected test locations (from orient): tests/

## Audit protocol
1. /cold-start fills rows, Stability = its guess (or `?`), Status = `[inferred]`.
2. A human sets Stability per row and flips confirmed rows to `[verified] (date)`.
3. Agents treat `?` rows as `frozen`. Agents never flip tags.

Field guide for the human audit (how to decide, evidence bar, worked rows):
https://github.com/kunalsuri/ai-fication-kit/blob/main/docs/AUDIT-GUIDE.md
