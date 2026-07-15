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
| `client/src/features/aasx-editor/` | Edit AAS elements (property editor); no single index — entry is via `client/src/features/aasx-editor/components/` | `client/src/features/aasx-editor/components/` | ours | [inferred] |
| `client/src/features/aasx-manager/` | List/manage AASX packages on the server | `client/src/features/aasx-manager/index.ts` | ours | [inferred] |
| `client/src/features/app-shell/` | App layout/shell, navigation, theming | `client/src/features/app-shell/index.ts` | ours | [inferred] |
| `client/src/features/auth/` | Login/JWT auth UI | `client/src/features/auth/index.ts` | ours | [inferred] |
| `client/src/features/dashboard/` | Landing dashboard | `client/src/features/dashboard/index.ts` | ours | [inferred] |
| `client/src/features/dictionary-browser/` | ECLASS/IEC CDD dictionary lookup UI | `client/src/features/dictionary-browser/index.ts` | ours | [inferred] |
| `client/src/features/idta-templates/` | Browse/instantiate IDTA submodel templates | `client/src/features/idta-templates/index.ts` | ours | [inferred] |
| `client/src/features/observability/` | Client-side logging/telemetry UI | `client/src/features/observability/index.ts` | ours | [inferred] |
| `client/src/features/package-creator/` | Create new AASX packages | `client/src/features/package-creator/components/` | ours | [inferred] |
| `client/src/features/plugin-manager/` | Plugin list/settings UI — plugin system is early-stage (`.kiro/CONSOLIDATED-SUMMARY.md` tracks 2/18 planned plugins implemented; no actual plugin implementations were found despite `.agents/architecture.md` referencing a server-side plugins directory — **UNSURE, needs human**, see AUDIT TODO) | `client/src/features/plugin-manager/index.tsx` | ours | [inferred] |
| `client/src/features/user-profile/` | User profile/settings UI | `client/src/features/user-profile/components/` | ours | [inferred] |
| `client/src/components/` | Shared UI components (shadcn/Radix wrappers + app-level shared components) | — | stable | [inferred] |
| `client/src/stores/` | Zustand global state stores | — | ours | [inferred] |
| `client/src/api/` | TanStack Query hooks / API client wrappers | — | ours | [inferred] |
| `client/src/hooks/`, `client/src/lib/`, `client/src/utils/`, `client/src/pages/`, `client/src/commands/`, `client/src/services/`, `client/src/examples/` | Supporting client code (shared hooks, utilities, route pages, command palette, client-side services, usage examples) | — | ? | [inferred] |
| `server/routes.ts` | Composition root — mounts feature routers onto the Express app | `server/routes.ts` | stable | [inferred] |
| `server/src/api/` | REST endpoint handlers: clipboard, delete, dictionary, IDTA templates, plugin, reference/reference-suggestion, XML, `server/src/api/aasx/update.ts` | `server/src/api/clipboard-routes.ts` | ours | [inferred] |
| `server/src/services/` | Business logic (30 files): plugin registry/loader/api, AASX package creator, export/import (CSV/Excel/XML), validation preset manager, dictionary service + adapters, search, unit conversion, template cache/download/instance services | — | ours | [inferred] |
| `server/src/models/` | Data models (`document-entity.ts`) | `server/src/models/document-entity.ts` | ours | [inferred] |
| `server/src/utils/` | Server-side utilities | — | ? | [inferred] |
| `server/auth/` | Auth: JWT access tokens (`server/auth/jwt-auth-routes.ts`, `server/auth/jwt-utils.ts`) + a **separate** server-side session store (`server/auth/session-manager.ts`) + `server/auth/auth-middleware.ts`; the session manager owns startup state and must not import `server/index.ts` | `server/auth/auth-middleware.ts` | stable | [inferred] |
| `server/storage.ts` | `FileStorage` — flat-JSON persistence for `data/` (users, sessions, prefs, config); this is what dev/runtime actually reads, not Postgres | `server/storage.ts` | stable | [inferred] |
| `server/index.ts`, `server/vite.ts`, `server/aasx-routes.ts`, `server/logging-endpoint.ts`, `server/profile.ts` | Server bootstrap, Vite middleware integration, top-level AASX routes, logging endpoint, profile endpoint | `server/index.ts` | stable | [inferred] |
| `shared/aas-v3-types.ts` | AAS V3 metamodel type system (spec-derived) | `shared/aas-v3-types.ts` | stable | [inferred] |
| `shared/aas-parser.ts`, `shared/aas-xml-migration.ts` | AASX (ZIP/OPC) package discovery plus legacy V1/V2 XML-to-V3 migration; covered by complete C# environment equality in `tests/integration/golden-master/aasx-parser.test.ts` | `shared/aas-parser.ts` | stable | [inferred] |
| `shared/aas-validation-engine.ts` + `shared/validation-rules/` | AAS V3 constraint validation engine with 117 registered AASd-* IDs, all with real behavioral logic (verified: zero literal no-op validators in `AllAASdConstraints`). 33 fabricated non-IDTA IDs (AASd-031..044, AASd-078..089, AASd-091..097) were removed 2026-07-15 (ADV-2026-07-14-03) — they did not correspond to any real IDTA constraint per three independent aas-core-works reference-metamodel lookups (see `ai/lab/specs/BUGFIX_remove_fabricated_aasd_constraints.md`; `ai/lab/reviews/REVIEW_W-017.md` Finding 1 debunks an earlier, incorrect "matches real IDTA gaps" claim — don't repeat it). Per-file totals overlap; use `tests/unit/shared/validation/aasd/constraint-count.test.ts` only for registration/count checks | `shared/aas-validation-engine.ts` | stable | [inferred] |
| `shared/schema.ts` | Drizzle + Zod schema — defines the Postgres contract; **not** what dev/runtime storage actually uses (see `server/storage.ts` row and [ARCHITECTURE.md](ARCHITECTURE.md)) | `shared/schema.ts` | stable | [inferred] |
| `shared/aas-search-engine.ts`, `shared/aas-search-filters.ts`, `shared/aas-search-types.ts` | AAS element search | `shared/aas-search-engine.ts` | stable | [inferred] |
| `shared/aas-serialization.ts`, `shared/aas-validation.ts`, `shared/aas-sample-data.ts` | Serialization helpers, legacy/simple validation, sample data for dev/tests | — | ? | [inferred] |
| `shared/plugin-manifest.ts`, `shared/plugin-types.ts` | Plugin system contracts/types (system is early-stage — see plugin-manager row) | — | ours | [inferred] |
| `shared/dictionary-types.ts`, `shared/idta-templates-types.ts`, `shared/validation-types.ts` | Supporting shared type definitions | — | stable | [inferred] |
| `tests/` | Centralized test suite: `tests/unit/{client,server,shared}`, `tests/integration/{ui,validation,golden-master}`, `tests/e2e/` (README only, no specs yet), `tests/fixtures/`, `tests/utils/`; Vitest paths are anchored to the active workspace via `tests/setup/vitest.config.ts` | `tests/setup/vitest.config.ts` | ours | [inferred] |
| `data/` | **Runtime state, not source** — flat-JSON storage (`data/users.json`, `data/sessions.json`, `data/config.json`, `data/preferences.json`) + `data/aasx/`, `data/aasx-backups/`, `data/logs/`. Generated/mutated at runtime by `server/storage.ts`; never hand-edit. | — | frozen | [inferred] |
| `scripts/` | Production/ops entry points: `scripts/build.mjs` creates browser + server artifacts, `scripts/create-admin-user.ts` provisions an admin from environment variables, and `scripts/setup-local.ps1`/`scripts/setup-local.sh` support local setup | `scripts/build.mjs` | ours | [inferred] |
| `config/` | Static config: `dictionary-config.json` (ECLASS/IEC CDD dictionary adapter config) | `config/dictionary-config.json` | stable | [inferred] |
| `.kiro/` | Spec-driven planning artifacts (not app code) — `specs/<feature>/{requirements,design,tasks}.md`, `CONSOLIDATED-SUMMARY.md` (feature-parity/plugin/constraint-count roadmap vs. the C# desktop app) | `.kiro/CONSOLIDATED-SUMMARY.md` | n/a (docs) | [inferred] |
| `docs/` | Standalone analysis docs (confidence-assessment/migration-strategy notes) | — | n/a (docs) | [inferred] |
| `_external_source/` | Frozen C# reference snapshot plus source-mined feature inventory used for translation/parity analysis; never treat it as current web runtime code | `_external_source/CSHARP_TO_TYPESCRIPT_FEATURE_INVENTORY.md` | frozen | [inferred] |

Detected test locations (from orient): tests/

## Audit protocol
1. /cold-start fills rows, Stability = its guess (or `?`), Status = `[inferred]`.
2. A human sets Stability per row and flips confirmed rows to `[verified] (date)`.
3. Agents treat `?` rows as `frozen`. Agents never flip tags.

Field guide for the human audit (how to decide, evidence bar, worked rows):
https://github.com/kunalsuri/ai-fication-kit/blob/main/docs/AUDIT-GUIDE.md
