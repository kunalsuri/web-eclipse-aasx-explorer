# Architecture

## Layout & aliases

Single `tsconfig.json` covers `client/src/**`, `shared/**`, `server/**`. Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*` (also mirrored in `vite.config.ts`, which additionally aliases `@assets`, though `attached_assets/` doesn't currently exist in this checkout — don't assume it's there).

## Client (`client/`)

Vite root is `client/` (build output → `dist/public`). Structure:

- `src/features/*` — feature-driven modules, one directory per domain: `aas-explorer` (the core tree/property/validation UI — by far the largest feature, with its own `components/`, `hooks/`, `services/`, `api/`, `contexts/`, `utils/`), `aasx-editor`, `aasx-manager`, `auth`, `dashboard`, `dictionary-browser`, `idta-templates`, `observability`, `package-creator`, `plugin-manager`, `user-profile`, `app-shell`.
- `src/components/` — cross-feature UI: `property-editors` (11 type-specific editors + factory/wrapper), `property-grid`, `tree`, `xml` (import/export dialogs), `dialogs`, `context-menu`, `bulk-operations`, `validation`, `element-creation`, `toolbar`, and `ui/` (Radix primitives + Tailwind, shadcn-style).
- `src/stores/` — Zustand: `editorStore` (dirty tracking, undo/redo), `clipboardStore`, `selectionStore` (multi-select: click / Ctrl+click / Shift+click).
- `src/api/` — TanStack Query hooks/clients.
- `src/hooks/`, `src/lib/`, `src/services/`, `src/utils/`, `src/pages/` (route-level, Wouter routing), `src/commands/`, `src/examples/`.

When adding a feature, follow the existing `features/<name>/{components,hooks,services,api}` shape rather than inventing a new top-level layout.

## Server (`server/`)

- `server/index.ts` — boot sequence: awaits `storage.ready()` before `registerRoutes()`; in development, sets up Vite middleware (`setupVite`) so one process serves both the API and the client; in production, `serveStatic` serves the built `dist/public`. Reads `PORT` (default 5000).
- `server/routes.ts` — composition root. Mounts: JWT auth routes, profile routes, log endpoints, `aasx-routes.ts` at `/api/aasx`, and `server/src/api/*-routes.ts` (clipboard at `/api/clipboard`, dictionary at `/api/dictionary`, delete + reference-suggestion under `/api/v1`).
- `server/src/api/` — thin route handlers per domain (clipboard, dictionary, delete, reference-suggestion, plus `api/aasx/*` for package-specific endpoints).
- `server/src/services/` — the real business logic, one file per concern: `element-manager` (CRUD over AAS elements), `xml-serialization-service` / `xml-deserialization-service` / `xml-element-serializer` / `xml-schema-validator`, `aas-search-service`, `aas-package-creator`, `reference-suggestion-service`, `clipboard-manager`, `atomic-file-writer` (backup-before-write), `audit-log`, `export-service` / `excel-export-service` / `excel-import-service` / `csv-export-service`, `dictionary-service` / `dictionary-transformation` / `dictionary-validation` / `dictionary-adapters/*` (ECLASS, IEC CDD), `template-*-service` (IDTA templates), `unit-conversion-service`, `update-service`, `validation-preset-manager`, and the plugin runtime (`plugin-registry`, `plugin-loader`, `plugin-manager`, `plugin-api`, `plugin-aas-api`, `plugin-action-invoker`, `plugin-event-handler`, `plugin-options-manager`, `plugin-standard-actions`, `plugin-visual-extension`).
- `server/src/plugins/` — the actual plugin implementations (currently `document-shelf-plugin`, `technical-data-plugin`); `shared/plugin-manifest.ts` / `shared/plugin-types.ts` define the manifest/contract shape they conform to.
- `server/auth/` — see Auth below.
- `server/storage.ts` — see Storage below.

## Auth: JWT + a separate session store

Auth is **two mechanisms working together**, not one:

- `server/auth/jwt-utils.ts` — issues short-lived access tokens and 7-day refresh tokens (`jwt.sign`), password hashing (bcryptjs), CSRF token generation.
- `server/auth/session-manager.ts` — an independent server-side session record (persisted to `data/sessions.json`), keyed separately from the JWT itself, checked alongside token validation. Sessions are invalidated relative to `SERVER_START_TIME` (exported from `server/index.ts`) to drop stale sessions across restarts.
- `server/auth/auth-middleware.ts` — `validateAccessToken` reads the bearer token, then cross-checks it against the session store; both must be considered together when changing auth behavior — a valid JWT alone is not sufficient if the middleware also expects a live session.
- `server/auth/jwt-auth-routes.ts` — registers `/api/auth/register`, `/api/auth/login`, etc., validated with the Zod schemas in `shared/schema.ts` (`jwtRegisterSchema`, `jwtLoginSchema`).

## Storage duality

`shared/schema.ts` defines Postgres tables via Drizzle ORM (`users`, `passwordResetTokens`, ...) plus Zod schemas derived from them (`drizzle-zod`) that are the actual validation source of truth used by routes. `drizzle.config.ts` / `npm run db:push` target a real Postgres instance via `DATABASE_URL`.

But at runtime, `server/storage.ts` (`FileStorage` class) and `server/auth/session-manager.ts` **do not talk to Postgres** — they read/write flat JSON files directly under `data/` (`users.json`, `sessions.json`, `password_reset_tokens.json`, `preferences.json`), loaded into in-memory `Map`s on boot (`storage.ready()` / `sessionManager.ready()` gate startup on this load completing). Treat the Drizzle/Zod schema as the intended data contract; don't assume dev-mode reads/writes touch a database.

AASX packages (the uploaded `.aasx` files users explore/edit) are a third, unrelated data path: parsed in-memory by `shared/aas-parser.ts` (JSZip + fast-xml-parser, OPC/ZIP → `Environment`), manipulated via `server/src/services/element-manager.ts`, and written back with `atomic-file-writer.ts` (backup-then-replace). They are not part of the `FileStorage`/`data/` user-store system above.

## Shared domain core (`shared/`)

- `aas-v3-types.ts` — the full AAS V3 type system (Environment, AssetAdministrationShell, Submodel, all 14 SubmodelElement types, etc.).
- `aas-parser.ts` / `aas-serialization.ts` — AASX (ZIP/OPC) ⇄ `Environment` ⇄ JSON.
- `aas-validation-engine.ts` + `validation-rules/*` — see `.agents/validation-engine.md`.
- `aas-search-engine.ts`, `aas-search-filters.ts`, `aas-search-types.ts` — full-text + typed/semantic-ID filtering used by both the UI search panel and `server/src/services/aas-search-service.ts`.
- `plugin-types.ts`, `plugin-manifest.ts` — the plugin system's TypeScript contracts (16 interfaces: manifest, lifecycle states, permissions, UI/API integration points).
- `schema.ts` — Drizzle table defs + Zod schemas (see Storage duality above).
- `idta-templates-types.ts`, `dictionary-types.ts`, `validation-types.ts` — supporting type modules for their respective subsystems.
