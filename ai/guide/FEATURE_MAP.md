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

> Source-backed expansion and current wiring status: [FEATURE_CATALOG.md](../analysis/FEATURE_CATALOG.md) `[inferred]`.

### AAS Explorer  `[inferred]`
- **Business goal:** Browse a parsed AASX package's element tree.
- **Touches:** `client/src/features/aas-explorer/`, `shared/aas-parser.ts`, `shared/aas-xml-migration.ts`, `shared/aas-v3-types.ts`.
- **Verify with:** `npm run test:unit -- tests/unit/client`, `npm run test:integration -- tests/integration/golden-master`.
- **Gotchas:** Parsing is in-memory only (see [ARCHITECTURE.md](ARCHITECTURE.md) storage duality); not persisted via `server/storage.ts`. The OPC part named "aasx/aasx-origin" is a marker, not an AAS environment. Legacy V1/V2 XML migration is locked to complete deep equality with all eight committed C# golden environments.
- **Related:** AASX Editor, AASX Manager.

### AASX Editor  `[inferred]`
- **Business goal:** Edit AAS element properties in-place.
- **Touches:** `client/src/features/aasx-editor/components/`, `server/src/services/element-finder.ts`, `server/src/services/element-manager.ts`, `server/src/services/atomic-file-writer.ts`.
- **Verify with:** `npm run test:unit`, `npm run test:integration`.
- **Gotchas:** No single `index.tsx`; entry surface is `client/src/features/aasx-editor/components/`. Windows can transiently lock a destination during atomic replacement, so the writer retries only `EPERM`, `EBUSY`, and `ENOTEMPTY` with bounded backoff. Property editing and undo/redo are covered by active centralized integration flows.
- **Related:** AAS Explorer.

### AASX Manager / Package Creator  `[inferred]`
- **Business goal:** List, manage, and create AASX packages server-side.
- **Touches:** `client/src/features/aasx-manager/`, `client/src/features/package-creator/`, `server/src/services/aas-package-creator.ts`, `server/src/services/aasx-package-service.ts`, `shared/aasx-package.ts`, `server/aasx-routes.ts`, `data/aasx/`, `data/aasx-backups/`.
- **Verify with:** `npm run test:integration`.
- **Gotchas:** Writes go through `server/src/services/atomic-file-writer.ts`, a separate path from `server/storage.ts`'s `FileStorage`; do not replace the retrying atomic rename with delete-then-write. Backup restore selects the newest existing timestamped backup and writes it atomically. Every mutation route in `server/aasx-routes.ts` (property patch, whole-environment PUT, submodel/element add/delete, duplicate) must persist through `saveEnvironment` -> `AasxPackageService.save`, which repacks the real `.aasx` transactionally; writing only the `<id>-environment.json` sidecar silently desyncs the downloadable package from the viewer (this was ADV-2026-07-14-02). `shared/aasx-package.ts` discovers the environment part via OPC origin/specification relationships, not file extension — never reintroduce `.xml`/`.json` extension filtering when touching supplementary-file extraction.
- **Related:** AAS Explorer.

### Validation Engine  `[inferred]`
- **Business goal:** Validate an AAS against IDTA AASd-* constraints.
- **Touches:** `shared/aas-validation-engine.ts`, `shared/validation-rules/*`, `server/src/services/validation-preset-manager.ts`.
- **Verify with:** `npm run test:unit -- tests/unit/shared/validation`.
- **Gotchas:** 117 AASd-* rules total, all with real behavioral logic (verified directly, see [MODULE_MAP.md](MODULE_MAP.md) — don't sum per-category-file counts, two files overlap); 33 previously-registered IDs (AASd-031..044, AASd-078..089, AASd-091..097) were removed 2026-07-15 as fabricated non-IDTA placeholders, see `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` ADV-2026-07-14-03; cardinality rules are deliberately `info` severity, not `error`. Use the `aas-validation-engineer` subagent.
- **Related:** AAS Explorer, AASX Editor.

### Search and Reference Suggestions  `[inferred]`
- **Business goal:** Find AAS elements and assist construction of valid references.
- **Touches:** `server/aasx-routes.ts`, `server/src/api/reference-suggestion-routes.ts`, `server/src/services/reference-suggestion-service.ts`, `shared/aas-search-engine.ts`.
- **Verify with:** `npm test -- tests/unit/server/api/reference-suggestion-routes.test.ts`.
- **Gotchas:** Reference-suggestion requests must provide the parsed package `fileId`; the loader accepts only letters, digits, underscores, and dashes before reading the matching environment file.
- **Related:** AAS Explorer, Validation Engine.

### Auth  `[inferred]`
- **Business goal:** User login and session management.
- **Touches:** `client/src/features/auth/`, `server/auth/*`, `scripts/create-admin-user.ts`, `data/users.json`, `data/sessions.json`.
- **Verify with:** `npm run test:unit -- tests/unit/server`.
- **Gotchas:** Two independent mechanisms (JWT + server-side session store) both required — see [ARCHITECTURE.md](ARCHITECTURE.md). The session manager owns its startup timestamp to avoid a circular import of `server/index.ts`; `npm run create-admin` requires `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
- **Related:** User Profile.

### Dictionary Browser  `[inferred]`
- **Business goal:** Look up semantic IDs against ECLASS / IEC CDD dictionaries.
- **Touches:** `client/src/features/dictionary-browser/`, `server/src/api/dictionary-routes.ts`, `server/src/services/dictionary-service.ts`, `server/src/services/dictionary-adapters/`, `config/dictionary-config.json`.
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
- **Gotchas:** The 16 XML structural serialization/round-trip and well-formedness assertions are active. They do not execute the official AAS XSD suite, so do not present them as proof of full XSD conformance.
- **Related:** Validation Engine.

### Production Runtime  `[inferred]`
- **Business goal:** Build and launch the browser application and Express server from one reproducible command contract.
- **Touches:** `package.json`, `scripts/build.mjs`, `vite.config.ts`, `server/index.ts`, `server/auth/session-manager.ts`.
- **Verify with:** `npm run build`, `node --check dist/server.js`, `npm start`, then request `http://127.0.0.1:5000/`.
- **Gotchas:** The browser and server are separate artifacts (`dist/public/` and `dist/server.js`). Bundle repository code but leave npm packages external; bundling CommonJS packages such as ExcelJS into ESM breaks runtime `require()` calls.
- **Related:** Auth, Export/Import.

### Dashboard / App Shell / Observability / User Profile  `[inferred]`
- **Business goal:** App-wide layout, navigation, theming, landing page, client-side logging, and user profile settings.
- **Touches:** `client/src/features/{dashboard,app-shell,observability,user-profile}/`.
- **Verify with:** `npm run test:unit -- tests/unit/client`.
- **Gotchas:** none noted yet.
- **Related:** Auth.
