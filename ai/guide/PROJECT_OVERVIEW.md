<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Project overview — web-eclipse-aasx-explorer

> [!NOTE]
> **This is a scaffolded template.** Run the `/cold-start` slash command in Claude Code (or see [docs/FAQ.md#cursor-copilot-codex](../../docs/FAQ.md#cursor-copilot-codex) for other tools) to have the agent explore your repository and automatically populate this file.

> Status: drafted by /cold-start 2026-07-14 @ commit `edba5d7`, from prior-config
> extraction (`AGENTS_bkp_20260714_101200.md`) cross-checked directly against
> `package.json`/`README.md`. Every section `[inferred]` until audited.

## What this is
**A modern, web-based platform for managing, validating, and exploring Industry 4.0 digital twins**

"RE-Eclipse AASX Web" (`package.json` name: `re-eclipse-aasx-web`) — a browser-based
Asset Administration Shell (AAS V3) package explorer/editor, developed at CEA-LIST.
`[inferred]`

## Stack (from `ai/repo-profile.json` — deterministic)
- Languages: TypeScript/JavaScript
- Build: `npm install && npm run build`
- Test:  `npm test`

## Why it exists  `[inferred]`
This is a web reimplementation of a C# desktop application (referenced in
`.kiro/specs/` as `x-external-proj`), giving Industry 4.0 digital-twin users a
browser-based tool to open, inspect, edit, and validate AASX packages without
installing desktop software. Feature-parity against the desktop app is tracked
phase-by-phase in `.kiro/CONSOLIDATED-SUMMARY.md`. A core differentiator is its
built-in AAS V3 constraint validation engine (`shared/aas-validation-engine.ts`,
117 AASd-* rules, all with real behavioral logic — the registry previously
claimed "150/150" but 33 of those IDs were fabricated placeholders with no
IDTA basis and were removed 2026-07-15, see [MODULE_MAP.md](MODULE_MAP.md) and
`ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` ADV-2026-07-14-03)
and a plugin system for extending the explorer (early-stage: contracts and
registry/loader services exist in `server/src/services/` and
`shared/plugin-*.ts`, but `.kiro/CONSOLIDATED-SUMMARY.md` tracks only 2 of 18
planned plugins as implemented).

## What we add vs. what we inherit  `[inferred]`
Not a git fork (`ai/repo-profile.json` → `fork.isFork: false`) — there is no
vendored upstream code to keep frozen at the repo level. The "inherited vs. ours"
line instead runs at the *domain* level: `shared/aas-v3-types.ts` and the AAS V3
validation rules are derived from an external spec (the AAS V3 metamodel /
IDTA AASd-* constraints), so changes there should trace back to the spec, not
just local judgment — treat as `stable`, not free-form `ours`. Everything else
(client features, server services/routes, tests) is active development surface.

## Glossary  `[inferred]`
| Term | Meaning here |
|---|---|
| AAS | Asset Administration Shell — the AAS V3 metamodel this tool edits/validates (`shared/aas-v3-types.ts`). |
| AASX | The ZIP/OPC package format used to store/exchange an AAS (parsed by `shared/aas-parser.ts`). |
| AASd-* | IDTA constraint IDs enforced by `shared/aas-validation-engine.ts` + `shared/validation-rules/*` (e.g. `AASd-001`). |
| IDTA templates | Standardized submodel templates browsable/instantiable via the `idta-templates` feature and `server/src/services/template-*` services. |
| Dictionary (ECLASS / IEC CDD) | External semantic-ID lookup services surfaced via `dictionary-browser` (client) and `server/src/services/dictionary-*` (server). |
| Golden-master test | A test comparing `shared/aas-parser.ts` output against pinned `.aasx` fixtures + expected JSON in `tests/fixtures/golden-master/`. |
| Storage duality | `shared/schema.ts` (Drizzle/Postgres) is a schema *contract*; actual runtime persistence is flat JSON in `data/` via `server/storage.ts` — see [ARCHITECTURE.md](ARCHITECTURE.md). |
