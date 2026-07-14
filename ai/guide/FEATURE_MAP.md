<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Feature map — feature → files, intent, gotchas

> [!NOTE]
> **This is a scaffolded template.** Run the `/cold-start` slash command in Claude Code (or see [docs/FAQ.md#cursor-copilot-codex](../../docs/FAQ.md#cursor-copilot-codex) for other tools) to have the agent explore your repository and automatically populate this file.

> Humans think in features; agents should too. This file holds the SHORT version —
> per-feature pointers and non-obvious notes. The full generated catalog lives in
> `ai/analysis/FEATURE_CATALOG.md` (via /create-feature-catalog).

## Template (copy per feature)

### <Feature name>  `[inferred]`
- **Business goal:** <one line>
- **Touches:** <dirs/files across layers — UI, backend, persistence, tests>
- **Verify with:** <the specific test command or suite>
- **Gotchas:** <the non-obvious thing that bites people>
- **Related:** <other features that share code paths>

## Candidate features (drafted by /cold-start 2026-07-14 @ commit `edba5d7`, audit before trusting)

### AAS Explorer  `[inferred]`
- **Business goal:** Browse a parsed AASX package's element tree.
- **Touches:** `client/src/features/aas-explorer/`, `shared/aas-parser.ts`, `shared/aas-v3-types.ts`.
- **Verify with:** `npm run test:unit -- tests/unit/client`, `npm run test:integration -- tests/integration/golden-master`.
- **Gotchas:** Parsing is in-memory only (see [ARCHITECTURE.md](ARCHITECTURE.md) storage duality); not persisted via `server/storage.ts`.
- **Related:** AASX Editor, AASX Manager.

### AASX Editor  `[inferred]`
- **Business goal:** Edit AAS element properties in-place.
- **Touches:** `client/src/features/aasx-editor/components/`, `server/src/services/element-finder.ts`, `element-manager.ts`, `server/src/services/atomic-file-writer.ts`.
- **Verify with:** `npm run test:unit`, `npm run test:integration`.
- **Gotchas:** No single `index.tsx`; entry surface is the `components/` directory.
- **Related:** AAS Explorer.

### AASX Manager / Package Creator  `[inferred]`
- **Business goal:** List, manage, and create AASX packages server-side.
- **Touches:** `client/src/features/aasx-manager/`, `client/src/features/package-creator/`, `server/src/services/aas-package-creator.ts`, `server/aasx-routes.ts`, `data/aasx/`, `data/aasx-backups/`.
- **Verify with:** `npm run test:integration`.
- **Gotchas:** Writes go through `server/src/services/atomic-file-writer.ts`, a separate path from `server/storage.ts`'s `FileStorage`.
- **Related:** AAS Explorer.

### Validation Engine  `[inferred]`
- **Business goal:** Validate an AAS against IDTA AASd-* constraints.
- **Touches:** `shared/aas-validation-engine.ts`, `shared/validation-rules/*`, `server/src/services/validation-preset-manager.ts`.
- **Verify with:** `npm run test:unit -- tests/unit/shared/validation`.
- **Gotchas:** 150 AASd-* rules total (verified directly, see [MODULE_MAP.md](MODULE_MAP.md) — don't sum per-category-file counts, two files overlap); cardinality rules are deliberately `info` severity, not `error`. Use the `aas-validation-engineer` subagent.
- **Related:** AAS Explorer, AASX Editor.

### Auth  `[inferred]`
- **Business goal:** User login and session management.
- **Touches:** `client/src/features/auth/`, `server/auth/*`, `data/users.json`, `data/sessions.json`.
- **Verify with:** `npm run test:unit -- tests/unit/server`.
- **Gotchas:** Two independent mechanisms (JWT + server-side session store) both required — see [ARCHITECTURE.md](ARCHITECTURE.md).
- **Related:** User Profile.

### Dictionary Browser  `[inferred]`
- **Business goal:** Look up semantic IDs against ECLASS / IEC CDD dictionaries.
- **Touches:** `client/src/features/dictionary-browser/`, `server/src/api/dictionary-routes.ts`, `server/src/services/dictionary-service.ts`, `dictionary-adapters/`, `config/dictionary-config.json`.
- **Verify with:** `npm run test:integration`.
- **Gotchas:** External API keys (`ECLASS_API_*`/`IECCDD_API_*`) are optional env vars per `.env.local.example`; unset means adapters likely no-op or stub — **UNSURE, needs human**.
- **Related:** IDTA Templates.

### IDTA Templates  `[inferred]`
- **Business goal:** Browse and instantiate standardized IDTA submodel templates.
- **Touches:** `client/src/features/idta-templates/`, `server/src/api/idta-templates-routes.ts`, `server/src/services/template-*-service.ts`.
- **Verify with:** `npm run test:integration`.
- **Gotchas:** none noted yet.
- **Related:** Dictionary Browser.

### Plugin Manager  `[inferred]`
- **Business goal:** Extend the explorer via plugins.
- **Touches:** `client/src/features/plugin-manager/`, `server/src/services/plugin-registry.ts`, `plugin-loader.ts`, `plugin-api.ts`, `plugin-aas-api.ts`, `shared/plugin-manifest.ts`, `plugin-types.ts`.
- **Verify with:** `npm run test:unit -- tests/unit/server/services` (path a guess — confirm on audit).
- **Gotchas:** Early-stage — registry/loader/contracts exist but no concrete plugin implementation was found in source; `.kiro/CONSOLIDATED-SUMMARY.md` tracks 2/18 planned plugins. See AUDIT TODO.
- **Related:** none yet.

### Export/Import (CSV, Excel, XML)  `[inferred]`
- **Business goal:** Serialize AAS data to/from CSV, Excel, and XML.
- **Touches:** `server/src/services/{csv,excel,xml}-export-service.ts`, `excel-import-service.ts`, `xml-deserialization-service.ts`, `xml-element-serializer.ts`, `xml-schema-validator.ts`, `xml-serialization-service.ts`.
- **Verify with:** `npm run test:unit -- tests/unit/server`.
- **Gotchas:** none noted yet.
- **Related:** Validation Engine.

### Dashboard / App Shell / Observability / User Profile  `[inferred]`
- **Business goal:** App-wide layout, navigation, theming, landing page, client-side logging, and user profile settings.
- **Touches:** `client/src/features/{dashboard,app-shell,observability,user-profile}/`.
- **Verify with:** `npm run test:unit -- tests/unit/client`.
- **Gotchas:** none noted yet.
- **Related:** Auth.
