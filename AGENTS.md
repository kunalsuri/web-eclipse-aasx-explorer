# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Codex, Copilot, Aider, Windsurf, etc.) working in this repository. This is the canonical, tool-agnostic source of truth — tool-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`) point back here rather than duplicating it.

## Project

RE-Eclipse AASX Web — a browser-based Asset Administration Shell (AAS V3) package explorer/editor, developed at CEA-LIST. React 18 + TypeScript SPA, Express backend, AASX (ZIP/OPC) parsing, a 150-rule AAS V3 validation engine, and JWT-based auth. It is a web reimplementation of a C# desktop app (referenced in specs as `x-external-proj`); feature-parity tracking against that app lives in `.kiro/CONSOLIDATED-SUMMARY.md`.

## Setup & commands

```bash
npm install
npm run dev                 # dev server (tsx server/index.ts): serves API + Vite client at :5000
npm run build                # vite build -> dist/public
npm start                    # run production build (NODE_ENV=production node dist/index.js)
npm run check                 # tsc typecheck, no emit — the enforced correctness gate (no separate lint script)

npm test                      # full test suite (vitest, config at tests/setup/vitest.config.ts)
npm run test:watch
npm run test:coverage
npm run test:unit             # tests/unit only
npm run test:integration      # tests/integration only
npm test -- path/to/file.test.ts        # single test file
npm test -- --grep "validation"         # tests matching a name

npm run db:push               # drizzle-kit push (requires DATABASE_URL; see note below — dev runtime doesn't use it)
npm run create-admin          # tsx scripts/create-admin-user.ts
```

Before calling a task done: run `npm run check` and the relevant `npm test` scope.

## Environment

Copy `.env.local.example` to `.env`. Key vars: `DATABASE_URL`, `SESSION_SECRET`, `PORT` (default 5000), `NODE_ENV`, optional `ECLASS_API_*` / `IECCDD_API_*` for dictionary lookups. `drizzle.config.ts` requires `DATABASE_URL` to be set to run `db:push`, but everyday dev does not read from Postgres — see the storage note below.

## Architecture (short version — see `.agents/architecture.md` for depth)

One `tsconfig.json` covers three areas, with path aliases `@/*` → `client/src/*` and `@shared/*` → `shared/*`:

- **`client/`** — Vite root, feature-driven under `client/src/features/*` (aas-explorer, aasx-editor, aasx-manager, auth, dashboard, dictionary-browser, idta-templates, plugin-manager, ...). Zustand for state (`stores/`), TanStack Query for data fetching (`api/`), Wouter for routing.
- **`server/`** — Express app. `server/routes.ts` is the composition root mounting feature routers; business logic lives in `server/src/services/*`; auth combines JWT access tokens with a separate server-side session store (`server/auth/`).
- **`shared/`** — the AAS domain core used by both sides: type system (`aas-v3-types.ts`), AASX parsing (`aas-parser.ts`), serialization, the validation engine (`aas-validation-engine.ts` + `validation-rules/*`, 150 AASd-* constraints), search engine, plugin contracts, and Drizzle/Zod `schema.ts`.

**Storage duality (important, non-obvious):** `shared/schema.ts` defines Postgres tables via Drizzle and `db:push` targets Postgres, but actual runtime persistence (`server/storage.ts`, `server/auth/session-manager.ts`) is flat JSON under `data/` (`users.json`, `sessions.json`, etc.), not the database. Don't assume a live Postgres connection is being read from in dev. AASX packages being explored/edited are separate again — parsed in-memory via `shared/aas-parser.ts`, not persisted through `server/storage.ts`.

## Testing conventions

Tests are centralized in `tests/` (not colocated with source): `tests/unit/{client,server,shared}`, `tests/integration/{ui,validation,...}`, `tests/e2e/`, shared `tests/fixtures/` and `tests/utils/`. Follow the AAA pattern (Arrange/Act/Assert). Details in `tests/README.md` and `.agents/testing.md`.

## Code conventions

- Functional components + hooks only, no classes. Named exports; default export reserved for a file's main component.
- `interface` over `type` for object contracts; avoid `any` (needs a justifying comment if unavoidable); TypeScript `strict` mode is on.
- Directories use `lowercase-dash` naming; hooks prefixed `use`.
- Tailwind CSS for styling; preserve dark-mode support (`next-themes`) and WCAG 2.1 AA accessibility.
- No side effects/async logic inside render bodies.

(Full ruleset: `.github/copilot-instructions.md`.)

## How this repo is actually built: spec-driven, autonomous agent development

This is the norm here, not an exception — read `.agents/workflow.md` before starting any feature-sized task. In short:

- Check `.kiro/specs/<feature-name>/` for an existing `requirements.md` / `design.md` / `tasks.md` before inventing your own plan for a substantial feature.
- Check `.kiro/CONSOLIDATED-SUMMARY.md` for current feature-parity status and the phased roadmap before assuming what's implemented.
- For a feature-sized task, deliver complete, tested code (add tests under `tests/`) rather than partial/placeholder implementations, matching this repo's existing convention (see `.github/prompts/` for the historical prompt templates that established it) — but still ask when a requirement is genuinely missing or contradictory, not just to check in routinely.

## Deeper reference docs

`.agents/` holds focused docs beyond this summary:
- `.agents/architecture.md` — full client/server/shared breakdown, auth flow, AASX parsing pipeline, plugin system
- `.agents/testing.md` — test layout and conventions in detail
- `.agents/validation-engine.md` — the 150 AASd-* constraint categories and where each lives
- `.agents/workflow.md` — the spec-driven / autonomous-agent development pattern used throughout this repo's history

## Tool-specific files

- `CLAUDE.md` — imports this file; add Claude-Code-only notes there (available subagents in `.claude/agents/`, slash commands in `.claude/commands/`).
- `.github/copilot-instructions.md` — GitHub Copilot's React+TypeScript ruleset (referenced above under Code conventions).
