<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Conventions — how to write code that fits web-eclipse-aasx-explorer

> [!NOTE]
> **This is a scaffolded template.** Run the `/cold-start` slash command in Claude Code (or see [docs/FAQ.md#cursor-copilot-codex](../../docs/FAQ.md#cursor-copilot-codex) for other tools) to have the agent explore your repository and automatically populate this file.

> Status: drafted by /cold-start 2026-07-14 @ commit `edba5d7`, from prior-config
> extraction cross-checked against `.github/copilot-instructions.md` directly.
> Still `[inferred]`; humans confirm and add the rules that live only in heads.

## Languages & style  `[inferred]`
- TypeScript/JavaScript, TypeScript `strict` mode on (`tsconfig.json`).
- No dedicated lint/format config file was found (no `.eslintrc*`/`.prettierrc*`
  detected); style is instead enforced via `.github/copilot-instructions.md`
  ("General + React + TypeScript Ruleset") and code review. `ai/repo-indepth.json`
  also flags this gap under `recommendations`.

## Patterns to follow  `[inferred]`
- Functional components + hooks only, no classes. Named exports; default export
  reserved for a file's main component. — see any file under
  `client/src/features/*/components/`.
- `interface` over `type` for object contracts; avoid `any` (needs a justifying
  comment if unavoidable).
- Directories use `lowercase-dash` naming (e.g. `dictionary-browser/`,
  `plugin-manager/`); hooks prefixed `use` (e.g. `client/src/hooks/`).
- Tailwind CSS for styling; preserve dark-mode support via `next-themes`
  (`client/src/App.tsx` wires the theme provider) and WCAG 2.1 AA accessibility.
- No side effects/async logic inside render bodies.
- New AAS validation rules extend the existing category file in
  `shared/validation-rules/*` rather than adding a new file — see
  `shared/validation-rules/aasd-structural.ts` as an exemplar. Route this work
  through the `aas-validation-engineer` subagent.
- Tests are centralized in `tests/` (not colocated with source), mirroring the
  source layout under `tests/unit/{client,server,shared}` and
  `tests/integration/{ui,validation,golden-master}`; a feature-sized change adds
  its tests here in the same change, not as a follow-up.
  (Full ruleset reference: `.github/copilot-instructions.md`.)

## Things that look wrong but are right  `[verified] required`
<Only humans add rows. The institutional knowledge that prevents "helpful" breakage.
Candidates surfaced during /cold-start that a human should confirm and move here —
see [ARCHITECTURE.md](ARCHITECTURE.md) "How they connect": the Postgres/Drizzle schema in
`shared/schema.ts` looking "unused" in dev is expected (storage duality), and the
cardinality validation rules being `info`-severity (not `error`) is intentional
per `.agents/validation-engine.md` since empty collections are valid in AAS V3.>

## Definition of done
- Builds: `npm install && npm run build` — verified against `package.json`
  (`"build": "vite build"`) `[inferred]`.
- Tests pass: `npm test` — verified against `package.json`
  (`"test": "vitest run --config tests/setup/vitest.config.ts"`) `[inferred]`.
- License headers match neighbors; diffs are surgical; ai/ knowledge updated if the
  change moved or added modules/features.
