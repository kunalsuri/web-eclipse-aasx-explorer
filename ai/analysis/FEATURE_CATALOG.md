<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Feature Catalog — web-eclipse-aasx-explorer

> Generated 2026-07-14 at commit `c9605a0` by `/create-feature-catalog`.
> This entire catalog is `[inferred]` until a human audits individual entries.
> It describes current source and wiring, not roadmap claims.

## How to read status

- **Reachable** — composed into the current React app or mounted by `server/routes.ts`.
- **Partial / API-only** — some implementation is reachable, but advertised UI,
  persistence, or backend wiring is incomplete.
- **Infrastructure-only** — source and sometimes tests exist, but the current app
  composition does not expose the feature.
- **Scaffold-only** — named surfaces exist but return placeholders, empty values, or
  not-implemented responses.

This is a single-file catalog. The optional backend/frontend split files remain
scaffolds and are not authoritative. Test layout is hybrid: the default suite
collects both centralized `tests/**` files and all 15 colocated
`client/src/**/__tests__/` files. The XML, property-editing, search, clipboard,
and undo/redo contracts are active in the default suite.

Verification snapshot on 2026-07-14: `npm test` completed with 755 passed,
0 failed, and 0 skipped tests. The eight legacy V1/V2 AASX fixtures now compare
their complete TypeScript environments with the committed C# golden environments,
not just element counts, and all eight comparisons pass.

## §1 Feature index

| ID | User-facing feature | Business goal | Main entry point | Status |
|---|---|---|---|---|
| F01 | Account access and recovery | Register, sign in, refresh credentials, sign out, and reset passwords | `client/src/pages/auth-page.tsx` | Reachable `[inferred]` |
| F02 | User profile and preferences | Manage identity, picture, preferences, and account lifecycle | `client/src/pages/profile-page.tsx` | Partial `[inferred]` |
| F03 | AASX package management | Create, upload, parse, list, download, and delete packages | `client/src/pages/aasx-manager-page.tsx` | Reachable `[inferred]` |
| F04 | AAS environment browsing | Load environments and inspect their overview, tree, metadata, and findings | `client/src/pages/aas-viewer-page.tsx` | Reachable `[inferred]` |
| F05 | AAS property and structure editing | Change property values and manage submodels/elements | `client/src/features/aas-explorer/components/property-panel.tsx` | Partial `[inferred]` |
| F06 | Clipboard, bulk operations, and undo/redo | Copy, paste, multi-select, batch-edit, and reverse edits | `client/src/features/aas-explorer/components/aas-explorer-integrated.tsx` | Infrastructure-only `[inferred]` |
| F07 | AAS validation and reports | Apply AAS V3/AASd checks and export findings | `client/src/features/aas-explorer/components/validation-panel.tsx` | Reachable `[inferred]` |
| F08 | AAS search and reference suggestions | Find elements and choose valid reference targets | `server/aasx-routes.ts` | API-only / partial `[inferred]` |
| F09 | Dictionary browsing | Search ECLASS/IEC CDD concepts and prepare ConceptDescription imports | `client/src/pages/dictionary-browser-page.tsx` | Partial `[inferred]` |
| F10 | AAS export and import | Exchange JSON, CSV, Excel, and XML representations | `server/aasx-routes.ts` | API-only / partial `[inferred]` |
| F11 | Dashboard and application shell | Navigate protected pages and see package shortcuts and overview content | `client/src/App.tsx` | Reachable `[inferred]` |
| F12 | Observability and log persistence | Capture client telemetry and inspect operational signals | `client/src/features/observability/services/observability-init.ts` | Partial `[inferred]` |
| F13 | Plugin extensibility | Register, load, configure, and host plugins | `server/src/services/plugin-registry.ts` | Infrastructure-only `[inferred]` |
| F14 | IDTA template discovery | Browse, download, inspect, and instantiate standardized templates | `client/src/features/idta-templates/pages/idta-templates-page.tsx` | Scaffold-only `[inferred]` |

Workspaces and Help are not cataloged as implemented features: their routed pages
explicitly show coming-soon or disabled actions.

## §2 Current interface surface

### Reachable client routes

| Route | Surface |
|---|---|
| `/`, `/landing` | Landing and application entry |
| `/auth` | Registration, login, and password recovery |
| `/dashboard` | Dashboard and package shortcuts |
| `/aasx-manager` | Package management |
| `/aas-viewer` | Environment viewer |
| `/dictionary` | Dictionary browser |
| `/profile`, `/profile/preferences` | Profile and preferences |

`/workspaces` and `/help` are reachable placeholders. Routes after `/auth`
use client-side `ProtectedRoute`; this does not imply server-side API protection.

### Mounted server families

| Family | Handler | Capability |
|---|---|---|
| `/api/auth/*` | `server/auth/jwt-auth-routes.ts` | Account/session lifecycle |
| `/api/profile*` | `server/profile.ts` | JWT-protected profile/preferences |
| `/api/aasx/*` | `server/aasx-routes.ts` | Package, viewer, validation, search, editing, export/import |
| `/api/clipboard/*` | `server/src/api/clipboard-routes.ts` | Clipboard operations |
| `/api/dictionary/*` | `server/src/api/dictionary-routes.ts` | Dictionary search/import/cache |
| `/api/v1/*` | `server/src/api/delete-routes.ts` | Shell/submodel/element deletion |
| `/api/v1/references/*` | `server/src/api/reference-suggestion-routes.ts` | Reference suggestions |
| `/api/logs` | `server/logging-endpoint.ts` | Client log submission/retrieval |

Except for profile endpoints, these mounted feature APIs do not apply
`validateAccessToken`, `authenticate`, session validation, CSRF validation, or
role middleware.

### Implemented routers not mounted

`server/src/api/plugin-routes.ts`, `server/src/api/idta-templates-routes.ts`,
`server/src/api/xml-routes.ts`, `server/src/api/reference-routes.ts`, and
`server/src/api/aasx/update.ts` are not imported by `server/routes.ts`.

## §3 Full-stack touch lists

### F01 — Account access and recovery `[inferred]`

- **Business goal:** Let users create accounts and maintain authenticated sessions.
- **Status:** Reachable; SPA route protection is broader than server API protection.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/pages/auth-page.tsx`, `client/src/features/auth/hooks/use-jwt-auth.tsx`, `client/src/lib/protected-route.tsx` | `[inferred]` |
| Backend | `server/auth/jwt-auth-routes.ts`, `server/auth/jwt-utils.ts`, `server/auth/session-manager.ts` | `[inferred]` |
| Persistence | `server/storage.ts`, `data/users.json`, `data/sessions.json` | `[inferred]` |
| Tests | UNSURE — no dedicated auth/session route tests found | `[inferred]` |

- **Related:** F02, F11.

### F02 — User profile and preferences `[inferred]`

- **Business goal:** Update profile fields, picture, preferences, and account state.
- **Status:** Reachable, but picture upload likely lacks the in-memory Authorization
  header and linked-account controls are primarily presentational.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/pages/profile-page.tsx`, `client/src/pages/preferences-page.tsx`, `client/src/features/user-profile/` | `[inferred]` |
| Backend | `server/profile.ts`, `server/storage.ts` | `[inferred]` |
| Persistence | `data/users.json`, `data/preferences.json`; profile pictures are written to a runtime upload directory | `[inferred]` |
| Tests | UNSURE — no profile route/component tests found | `[inferred]` |

- **Related:** F01, F12.

### F03 — AASX package management `[inferred]`

- **Business goal:** Create or upload packages, parse them, and manage stored files.
- **Status:** Reachable through the manager and dashboard; server endpoints are not
  protected by auth middleware.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/pages/aasx-manager-page.tsx`, `client/src/features/aasx-manager/` | `[inferred]` |
| Backend | `server/aasx-routes.ts`, `server/src/services/aas-package-creator.ts` | `[inferred]` |
| Domain | `shared/aas-parser.ts`, `shared/aas-v3-types.ts` | `[inferred]` |
| Persistence | `data/aasx/` package, metadata, and parsed-environment files | `[inferred]` |
| Tests | `tests/unit/server/services/aas-package-creator.test.ts` passes; `tests/integration/golden-master/aasx-parser.test.ts` deep-compares all eight complete environments with the committed C# goldens and passes | `[inferred]` |

- **Related:** F04, F07, F10.

### F04 — AAS environment browsing `[inferred]`

- **Business goal:** Inspect loaded AAS environments as summaries, trees, and detail panels.
- **Status:** Reachable; the live page composes the basic tree/property panel rather
  than the advanced integrated explorer.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/pages/aas-viewer-page.tsx`, `client/src/features/aas-explorer/components/aas-tree-view.tsx`, `client/src/features/aas-explorer/components/property-panel.tsx` | `[inferred]` |
| Backend | `server/aasx-routes.ts` file/environment endpoints | `[inferred]` |
| Domain | `shared/aas-parser.ts`, `shared/aas-v3-types.ts` | `[inferred]` |
| Persistence | Parsed environment files under `data/aasx/` | `[inferred]` |
| Tests | `tests/integration/golden-master/aasx-parser.test.ts` deep-compares all eight complete environments with C# goldens; colocated property/tree tests run in the default suite | `[inferred]` |

- **Related:** F03, F05, F07, F08.

### F05 — AAS property and structure editing `[inferred]`

- **Business goal:** Persist property changes and manage the AAS element hierarchy.
- **Status:** Partial. Ordinary Property edits use the mounted environment-property
  endpoint; richer multi-language, element, reorder, restore, and version operations
  target an unmounted router or unused integrated UI.

| Layer | Touch list | Confidence |
|---|---|---|
| Live UI | `client/src/features/aas-explorer/components/property-panel.tsx`, `client/src/features/aas-explorer/components/property-editor.tsx` | `[inferred]` |
| Advanced UI | `client/src/features/aas-explorer/components/aas-explorer-integrated.tsx`, `client/src/features/aas-explorer/services/update-service.ts` | `[inferred]` |
| Backend | `server/aasx-routes.ts`, `server/src/api/aasx/update.ts`, `server/src/services/element-manager.ts`, `server/src/services/update-service.ts` | `[inferred]` |
| Persistence | Environment files under `data/aasx/`; advanced services also target backups/audit logs | `[inferred]` |
| Tests | `tests/unit/server/services/element-manager.test.ts`, `tests/unit/server/services/update-service.test.ts`, `tests/integration/ui/property-editing-flow.test.tsx` | `[inferred]` |

- **Related:** F04, F06, F07.

### F06 — Clipboard, bulk operations, and undo/redo `[inferred]`

- **Business goal:** Support compound editing workflows and reversible changes.
- **Status:** Infrastructure-only for the live viewer. Clipboard APIs are mounted,
  but `AasExplorerIntegrated` is not composed and several bulk/reorder client calls
  have no mounted matching route.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/features/aas-explorer/components/aas-explorer-integrated.tsx`, `client/src/features/aas-explorer/components/editor-toolbar.tsx` | `[inferred]` |
| Client logic | `client/src/features/aas-explorer/hooks/use-clipboard.ts`, `client/src/features/aas-explorer/services/undo-service.ts`, `client/src/features/aas-explorer/services/bulk-operations-service.ts` | `[inferred]` |
| Backend | `server/src/api/clipboard-routes.ts`, `server/src/services/clipboard-manager.ts` | `[inferred]` |
| Persistence | Process memory on the server; localStorage fallback on the client | `[inferred]` |
| Tests | `tests/unit/server/services/clipboard-manager.test.ts`, `tests/integration/ui/undo-redo-flow.test.tsx`, and colocated clipboard/undo suites all run by default | `[inferred]` |

- **Related:** F05.

### F07 — AAS validation and reports `[inferred]`

- **Business goal:** Apply AAS V3/AASd constraints and communicate actionable findings.
- **Status:** Reachable. The viewer validates locally; separate server validation and
  preset endpoints are also mounted.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/features/aas-explorer/components/validation-panel.tsx`, `client/src/features/aas-explorer/components/validation-report-dialog.tsx` | `[inferred]` |
| Backend | `server/aasx-routes.ts`, `server/src/services/validation-preset-manager.ts` | `[inferred]` |
| Domain | `shared/aas-validation-engine.ts`, `shared/validation-rules/` | `[inferred]` |
| Persistence | Validation cache beside packages and optional custom presets under `data/` | `[inferred]` |
| Tests | `tests/unit/shared/validation/`, `tests/integration/validation/` | `[inferred]` |

- **Related:** F04, F05, F10.

### F08 — AAS search and reference suggestions `[inferred]`

- **Business goal:** Find elements and assist users in constructing valid references.
- **Status:** API-only / partial. Search APIs are mounted, but search UI is not
  composed into the live viewer. Reference suggestions load the parsed environment
  identified by the request's `fileId` query/body field.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/features/aas-explorer/components/aas-search-bar.tsx`, `client/src/features/aas-explorer/components/reference-editor.tsx` | `[inferred]` |
| Backend | `server/aasx-routes.ts`, `server/src/api/reference-suggestion-routes.ts` | `[inferred]` |
| Core | `server/src/services/aas-search-service.ts`, `server/src/services/reference-suggestion-service.ts`, `shared/aas-search-engine.ts` | `[inferred]` |
| Persistence | In-memory indexes/caches; recent client searches use localStorage | `[inferred]` |
| Tests | `tests/unit/server/api/reference-suggestion-routes.test.ts` covers environment selection; the colocated search-bar suite runs by default | `[inferred]` |

- **Related:** F04, F05, F09.

### F09 — Dictionary browsing `[inferred]`

- **Business goal:** Discover standardized concepts from ECLASS and IEC CDD.
- **Status:** Partial. The page and backend are mounted, but the current panel leaves
  richer results/filter behavior for future work and its import callback is a TODO.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/pages/dictionary-browser-page.tsx`, `client/src/features/dictionary-browser/` | `[inferred]` |
| Backend | `server/src/api/dictionary-routes.ts`, `server/src/services/dictionary-service.ts`, `server/src/services/dictionary-adapters/` | `[inferred]` |
| Contracts/config | `shared/dictionary-types.ts`, `config/dictionary-config.json` | `[inferred]` |
| Persistence | Server memory cache; optional browser cache/history | `[inferred]` |
| Tests | UNSURE — no dictionary tests found | `[inferred]` |

- **Related:** F08, F14.

### F10 — AAS export and import `[inferred]`

- **Business goal:** Exchange AAS content in JSON, CSV, Excel, and XML forms.
- **Status:** API-only / partial. JSON/CSV/Excel endpoints are mounted; export dialogs
  are not composed, XML routes are unmounted, and Excel import previews rather than
  applies updates.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/features/aas-explorer/components/export-dialog.tsx`, `client/src/components/xml/` | `[inferred]` |
| Backend | `server/aasx-routes.ts`, `server/src/api/xml-routes.ts` | `[inferred]` |
| Services | `server/src/services/export-service.ts`, `server/src/services/excel-export-service.ts`, `server/src/services/excel-import-service.ts`, `server/src/services/xml-serialization-service.ts` | `[inferred]` |
| Persistence | Reads parsed environments from `data/aasx/`; downloads are client-side | `[inferred]` |
| Tests | `tests/unit/server/services/xml-serialization-service.test.ts` has 16 active structural round-trip/well-formedness assertions; no official XSD, CSV, or Excel route tests found | `[inferred]` |

- **Related:** F03, F07.

### F11 — Dashboard and application shell `[inferred]`

- **Business goal:** Provide navigation, theming, layout, and a package-oriented landing area.
- **Status:** Reachable. Dashboard statistics, chart, and recent activity use static
  sample data rather than backend analytics.

| Layer | Touch list | Confidence |
|---|---|---|
| Routing | `client/src/App.tsx`, `client/src/features/app-shell/config/navigation.ts` | `[inferred]` |
| UI | `client/src/pages/dashboard-page.tsx`, `client/src/features/app-shell/`, `client/src/features/dashboard/` | `[inferred]` |
| Backend/persistence | None for dashboard metrics; package widgets reuse F03 APIs | `[inferred]` |
| Tests | UNSURE — no route/shell/dashboard behavior tests found | `[inferred]` |

- **Related:** F01, F03, F12.

### F12 — Observability and log persistence `[inferred]`

- **Business goal:** Capture client errors, logs, performance, traces, and metrics.
- **Status:** Partial. Initialization and log transport are wired, while the dashboard
  includes illustrative telemetry and log retrieval is unauthenticated.

| Layer | Touch list | Confidence |
|---|---|---|
| UI/init | `client/src/App.tsx`, `client/src/features/observability/`, `client/src/features/user-profile/components/preferences-section.tsx` | `[inferred]` |
| Client core | `client/src/lib/logger.ts`, `client/src/lib/tracing.ts`, `client/src/lib/metrics.ts` | `[inferred]` |
| Backend | `server/logging-endpoint.ts`, `server/routes.ts` | `[inferred]` |
| Persistence | Runtime log files; `App.tsx` also passes a stale absolute development log directory | `[inferred]` |
| Tests | UNSURE — no automated observability/log endpoint tests found | `[inferred]` |

- **Related:** F02, F11.

### F13 — Plugin extensibility `[inferred]`

- **Business goal:** Register/load extensions and expose permissioned plugin APIs/settings.
- **Status:** Infrastructure-only. Tests use synthetic plugins, but plugin UI and routes
  are not wired and no concrete source plugin implementation exists.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/features/plugin-manager/`, `client/src/components/DocumentShelfPanel.tsx`, `client/src/components/TechnicalDataPanel.tsx` | `[inferred]` |
| Backend | `server/src/api/plugin-routes.ts`, `server/src/services/plugin-registry.ts`, `server/src/services/plugin-loader.ts`, `server/src/services/plugin-api.ts` | `[inferred]` |
| Contracts | `shared/plugin-manifest.ts`, `shared/plugin-types.ts` | `[inferred]` |
| Persistence | Optional runtime plugin settings/storage under `data/`; current route state is in memory | `[inferred]` |
| Tests | `tests/unit/server/services/plugin-registry.test.ts`, `tests/integration/plugin-system.test.ts` | `[inferred]` |

- **Related:** None currently reachable. Do not reuse the contradictory historical
  “2/18 plugins” count as a source fact.

### F14 — IDTA template discovery `[inferred]`

- **Business goal:** Discover and instantiate standardized IDTA submodel templates.
- **Status:** Scaffold-only. The page is not routed, the router is not mounted, hooks
  return stub values, and server operations are empty or not implemented.

| Layer | Touch list | Confidence |
|---|---|---|
| UI | `client/src/features/idta-templates/` | `[inferred]` |
| Backend | `server/src/api/idta-templates-routes.ts`, `server/src/services/idta-repository-service.ts`, `server/src/services/template-download-service.ts`, `server/src/services/template-instance-service.ts` | `[inferred]` |
| Contracts | `shared/idta-templates-types.ts` | `[inferred]` |
| Persistence | UNSURE — intended cache/download persistence is not implemented | `[inferred]` |
| Tests | UNSURE — no IDTA template tests found | `[inferred]` |

- **Related:** F03, F09.

## §4 Where new code lives

```
What kind of change?
├── New routed page or navigation item?
│   ├── page composition ........ client/src/pages/
│   ├── feature UI/hooks ........ client/src/features/<feature>/
│   └── route/navigation ........ client/src/App.tsx + app-shell config
├── New REST capability?
│   ├── AASX/package/search ..... server/aasx-routes.ts
│   ├── feature router .......... server/src/api/
│   ├── business logic .......... server/src/services/
│   └── mandatory mount ......... server/routes.ts
├── AAS domain behavior?
│   ├── metamodel/parser ........ shared/aas-v3-types.ts + shared/aas-parser.ts
│   ├── validation .............. shared/aas-validation-engine.ts + validation-rules/
│   └── search/contracts ........ shared/aas-search-*.ts
├── Identity or user state?
│   ├── auth/session ............ server/auth/
│   ├── profile/preferences ..... server/profile.ts + server/storage.ts
│   └── client account UI ....... client/src/features/auth/ or user-profile/
├── External semantic data?
│   ├── dictionary .............. dictionary-browser + dictionary service/adapters
│   └── IDTA templates .......... idta-templates + template services (wire first)
├── Extension point?
│   └── plugin contracts/runtime  shared/plugin-*.ts + plugin services (wire first)
└── Tests?
    ├── default active suite .... tests/unit/ or tests/integration/
    └── colocated tests ......... client/src/**/__tests__/ (config decision required)
```

Always add a new router to `server/routes.ts`; a complete-looking router file alone
does not make a server feature reachable.

## §5 The 3-file rule

Read these three files first before changing a feature.

| Feature | First | Second | Third |
|---|---|---|---|
| F01 Account access | `server/auth/jwt-auth-routes.ts` | `client/src/features/auth/hooks/use-jwt-auth.tsx` | `server/routes.ts` |
| F02 Profile | `server/profile.ts` | `client/src/features/user-profile/api/profile-api.ts` | `client/src/features/user-profile/components/preferences-section.tsx` |
| F03 Package management | `server/aasx-routes.ts` | `client/src/features/aasx-manager/components/aasx-file-list.tsx` | `shared/aas-parser.ts` |
| F04 Environment browsing | `client/src/pages/aas-viewer-page.tsx` | `client/src/features/aas-explorer/components/aas-tree-view.tsx` | `client/src/features/aas-explorer/components/property-panel.tsx` |
| F05 Editing | `client/src/features/aas-explorer/components/property-panel.tsx` | `server/aasx-routes.ts` | `server/src/api/aasx/update.ts` |
| F06 Clipboard/undo | `client/src/features/aas-explorer/components/aas-explorer-integrated.tsx` | `server/src/api/clipboard-routes.ts` | `client/src/features/aas-explorer/services/update-service.ts` |
| F07 Validation | `shared/aas-validation-engine.ts` | `client/src/features/aas-explorer/components/validation-panel.tsx` | `server/src/services/validation-preset-manager.ts` |
| F08 Search/references | `server/aasx-routes.ts` | `client/src/features/aas-explorer/components/aas-search-bar.tsx` | `server/src/api/reference-suggestion-routes.ts` |
| F09 Dictionary | `client/src/features/dictionary-browser/components/dictionary-browser-panel.tsx` | `server/src/api/dictionary-routes.ts` | `server/src/services/dictionary-service.ts` |
| F10 Export/import | `server/aasx-routes.ts` | `client/src/features/aas-explorer/components/export-dialog.tsx` | `server/src/api/xml-routes.ts` |
| F11 Dashboard/shell | `client/src/App.tsx` | `client/src/features/app-shell/config/navigation.ts` | `client/src/pages/dashboard-page.tsx` |
| F12 Observability | `client/src/App.tsx` | `client/src/features/observability/services/observability-init.ts` | `server/logging-endpoint.ts` |
| F13 Plugins | `server/src/services/plugin-registry.ts` | `tests/integration/plugin-system.test.ts` | `server/routes.ts` |
| F14 IDTA templates | `server/src/api/idta-templates-routes.ts` | `client/src/features/idta-templates/pages/idta-templates-page.tsx` | `server/src/services/idta-repository-service.ts` |

## §6 Specification-driven development

1. Draft a spec under `ai/lab/specs/`.
2. Use this catalog to enumerate UI, backend, persistence, and test touch points.
3. Confirm the target row in `ai/guide/MODULE_MAP.md` is not `frozen` or `?`.
4. Implement through `/add-feature` or `/fix-bug`.
5. Update this catalog and append the work to `ai/lab/WORKLOG.md`.

## Human sampling guide

Spot-check these five entries first because their source is substantial but their
runtime reachability or completeness is least certain:

1. **F05 — Editing:** confirm which mutations the live viewer is intended to expose.
2. **F06 — Clipboard/undo:** decide whether `AasExplorerIntegrated` should replace the basic viewer.
3. **F09 — Dictionary:** separate the routed placeholder panel from richer unused hooks/components.
4. **F10 — Export/import:** verify intended UI wiring and whether Excel import should apply updates.
5. **F12 — Observability:** audit sample telemetry, the stale absolute path, and unauthenticated log retrieval.
