# Migration Strategy Findings & Roadmap — 2026-07-13

**Session purpose:** The user (project owner) asked for an expert assessment of how to
finish translating the C# desktop app `kunalsuri/eclipse-aasx-package-explorer`
(a fork of Eclipse AASX Package Explorer) into this web app, using Claude Code /
Sonnet 5, and wanted the plan grounded in verified facts rather than assumptions.
This document is the record of that assessment: what was checked, what was found,
what I think it means, and what to do next. It is meant to be read cold by a future
agent session — no prior conversation context is assumed.

**Companion doc:** `docs/2026-07-13-confidence-assessment-and-verification-methodology.md`
answers a specific follow-up asked in the same session — how confident we actually
are that the TypeScript codebase correctly translated the C# app, and how to
measure that quantitatively (golden-master differential testing, official AAS
conformance suite, mechanical API-surface diffing) instead of relying on
self-reported percentages. Read it alongside task 4 below.

> **Recovery update — 2026-07-14:** Task 4's V1/V2 scope decision was resolved by
> the user's request for full translation accuracy. Commit `86c32d7` implements
> legacy XML migration and requires complete deep equality for all eight committed
> C# golden environments. Current gates are `npm run check` passing and `npm test`
> at 610 passed / 0 failed / 0 skipped. A clean production build/start path was
> also repaired and smoke-tested at HTTP 200. The remaining roadmap items are not
> erased by these results; see tasks 5–12 and the current source-backed feature
> catalog in `ai/analysis/FEATURE_CATALOG.md`.

---

## 1. Executive Summary

This repo's own status documents (`.kiro/CONSOLIDATED-SUMMARY.md` and
`.kiro/specs/csharp-to-typescript-feature-mapping/analysis-output/*.md`) report two
**contradictory** feature-parity numbers — 78% and 42% — both produced by prior
autonomous agent sessions, **neither verified by actually running the build**. I ran
the checks myself this session. Headline results:

- `npm run check` (this repo's own designated correctness gate, per `CLAUDE.md`)
  currently **fails with 261 TypeScript errors**, not the "zero TypeScript errors"
  claimed throughout `CONSOLIDATED-SUMMARY.md`.
- `npm test` is honest: **539/578 passing**, roughly matching what the docs claim.
  The test suite can be trusted; the typecheck-gate claims and prose "confidence
  scores" cannot.
- The C# source repo, measured directly, is **~387,000 lines of code across 762
  files / 59 projects** — not the "~250,000 LOC" the spec doc estimated (a ~55%
  undercount). The 18-plugin catalog, by contrast, checks out exactly against the
  real plugin project folders.
- The C# repo contains an **unfinished official prior attempt at a browser port**
  (`src/BlazorExplorer/`, `src/BlazorUI/`, built on an internal `AnyUi` abstraction
  layer) — a high-value reference for scoping, and a documented cautionary tale
  (its own dev notes list crash bugs and unfinished editing flows).
- The AAS standard has an **official, standards-body-maintained conformance test
  suite** (`admin-shell-io/aas-test-engines`) that can grade this repo's validation
  engine and REST API objectively, instead of relying on self-reported constraint
  counts.

**Bottom line:** the project is real and substantially underway, but its own
progress tracking is not currently trustworthy, and the single highest-leverage
next step is restoring a working, enforced `npm run check` gate before any further
"phase complete" claims are made.

---

## 2. Methodology — what was actually verified this session

To avoid adding a third unverified parity number to the pile, I did not re-derive
percentages from reading code. Instead:

1. Read `.kiro/CONSOLIDATED-SUMMARY.md` (dated Oct 31, 2025) and
   `.kiro/specs/csharp-to-typescript-feature-mapping/analysis-output/*.md`
   (dated Oct 29, 2025) — both prior agent-authored status reports.
2. Ran `npm run check` and `npm test` directly against this repo (`main` branch
   equivalent, i.e. the working tree at session start) to see real, current status.
3. Found `node_modules` was present but incomplete (missing `@types/node`, missing
   `vite` — a stale/partial install), ran `npm install` to repair it, then re-ran
   `npm run check` to get a real error count.
4. Cloned the actual C# fork (`kunalsuri/eclipse-aasx-package-explorer`) into
   `/workspace/eclipse-aasx-package-explorer` (ephemeral session workspace — will
   not exist in a future session; re-add/re-clone if needed) and measured its
   structure directly (`find`/`wc -l`), rather than trusting the spec doc's numbers.
5. Web-searched for current (July 2026) practice in AI-driven legacy-to-web
   migration, and for the current state of official AAS conformance tooling.

---

## 3. Findings — this repo's current real state

### 3.1 TypeScript gate is broken, not clean

`npm run check` → **261 errors total**.

- **27 errors** come from a *second, dead plugin implementation* that was never
  wired up: `server/src/services/plugin-manager.ts`,
  `plugin-action-invoker.ts`, `plugin-event-handler.ts`,
  `plugin-standard-actions.ts`, `plugin-visual-extension.ts`. These files import
  types that don't exist in `shared/plugin-types.ts` (`IAasxPlugin`,
  `PluginContext`, `AasxPluginResultBase`, `AasxPluginActionDescription`,
  `StandardPluginActions`, `PluginEventStack`, `PluginSessionCollection`,
  `getPluginRegistry`, `PluginStatus`) — names lifted directly from the **C# app's
  actual plugin interfaces**. This looks like a first-draft literal port of the
  C# plugin model that was abandoned mid-way in favor of the idiomatic
  TypeScript-native system (`plugin-registry.ts`, `plugin-loader.ts`,
  `plugin-api.ts`, `shared/plugin-types.ts`) that the "Phase 2: Plugin System
  Infrastructure" section of `CONSOLIDATED-SUMMARY.md` describes as complete.
  Confirmed via `grep` that the dead files are **not imported anywhere** in
  `server/routes.ts` or `server/src/api/*.ts` — they are inert. Git history
  doesn't disambiguate which came first (both landed in the same single
  "First Upload from Local Machine" commit), but the live wiring makes the
  intended winner clear.
- **234 errors are real** and spread across the codebase, including areas the
  summary calls "100% complete" — e.g. `client/src/components/context-menu/
  TreeNodeContextMenu.tsx` and `client/src/hooks/useContextMenu.ts` alone account
  for 48 errors (a `ContextMenuItem` type requiring an `id` field that call sites
  don't provide), plus errors in `reference-editor.tsx`, several `__tests__`
  files, `shared/aas-sample-data.ts` (duplicate identifiers), `shared/
  aas-search-engine.ts`, `shared/aas-serialization.ts` (`import type` used as a
  value), `server/src/services/element-manager.ts`, `element-finder.ts`,
  `reference-suggestion-service.ts`, and a missing `xml2js` dependency
  (imported in `xml-deserialization-service.ts` but not in `package.json`).

**What I think this means:** past autonomous sessions were implementing features
without running `npm run check` as a hard gate before declaring a phase done — or
were running it against a different/staged subset of files. The self-reported
"zero TypeScript errors" was not true at any point this session found it not to
be true. This is the single biggest reason the two prior parity estimates (42%
vs 78%) don't reconcile: both are narrative assessments, not derived from a
green build.

### 3.2 Tests are trustworthy

`npm test` → **539 passed, 39 skipped, 0 failing** (578 total), 28 test files
passed / 3 skipped. This roughly matches `CONSOLIDATED-SUMMARY.md`'s claim of
537/578. Unlike the typecheck claim, the test-pass-rate claim holds up under
verification. Recommendation: keep trusting `npm test` output; keep insisting
`npm run check` also be run and pasted before any future "complete" claim.

### 3.3 `node_modules` was stale

Not a code defect, but worth recording: at session start, `node_modules` existed
but was missing `@types/node` and `vite` entirely, causing `tsc` to fail before
even reaching real project errors. `npm install` (added 667 packages) fixed this.
If a future session sees `TS2688: Cannot find type definition file for 'node'`,
run `npm install` first — it's an environment problem, not a code problem.

`npm install` also reported **31 vulnerabilities (1 low, 12 moderate, 16 high, 2
critical)** in the dependency tree — not investigated further this session, but
worth a `npm audit` pass before any production deployment.

---

## 4. Findings — the actual C# source (ground truth, measured directly)

Cloned to `/workspace/eclipse-aasx-package-explorer` (session-ephemeral path).

| Metric | Spec doc claimed | Measured directly | Delta |
|---|---|---|---|
| C# files | 786 | **762** | close, roughly accurate |
| Projects (`.csproj`) | 60+ | **59** | accurate |
| Lines of C# code | ~250,000 | **386,861** | **~55% undercount** |
| Plugin projects | 18 (named) | **18**, names match exactly | accurate |

### 4.1 Module breakdown (`.cs` file count per top-level `src/` project)

The largest, most business-logic-dense modules — i.e. the highest-value porting
targets — are:

| Project | Files | What it is |
|---|---|---|
| `AasxFileServerRestLibrary` | 102 | REST server/API model — compare against official IDTA Part 2 API, not just port ad hoc |
| `AasxPackageLogic` | 80 | Core editing/business logic, shared by both WPF and Blazor UIs |
| `AasxCsharpLibrary` | 79 | Core AAS data model/parsing — this repo's `shared/aas-v3-types.ts` + `aas-parser.ts` territory |
| `AasxPredefinedConcepts` | 48 | Predefined semantic dictionaries — relates directly to the "Dictionary Integration" gap |
| `AasxWpfControlLibrary` | 35 | WPF UI controls — **desktop-only, do not port literally** |
| `AasxIntegrationBase` | 26 | Cross-cutting integration/base logic used by both WPF and Blazor UIs |
| `AasxServer.DomainModelV3_0_RC02` | 23 | A separate server-side domain model |
| `AasCore.Aas3_1` | 19 | The **official reference AAS 3.1 metamodel library** (admin-shell-io) |
| `BlazorExplorer` | 18 | Prior unfinished web-port attempt (see 4.2) |
| Individual plugin projects | 4–34 each | Confirmed real, mostly small — tractable to port one at a time |

`obsolete/` contains only 2 `.cs` files — not a meaningful source of scope.

### 4.2 Major discovery: a prior, unfinished official web-port attempt exists

`src/BlazorExplorer/` and `src/BlazorUI/` are a genuine prior attempt by the
original project authors at a browser-based version of this exact app, built in
C#/.NET using Blazor. Both depend on an internal abstraction layer called
**`AnyUi`** (`AnyUiHtml.cs`, `AnyUiLambdaActionBlazor.cs`, referenced from
`AasxIntegrationBase`) that lets the same business-logic/rendering calls target
either WPF (desktop) or HTML (Blazor/web) — i.e. the original team already solved
"what has to change to go from desktop to browser" once, in C#.

Its own dev notes (`src/BlazorExplorer/Notes_BlazorExplorer.md`) list unresolved
issues: cut/copy not refreshing the screen, "save repo" incomplete, a documented
crash converting nameplate data to a new version, and unfinished JSON-clipboard
editing. **This is both a gift and a warning**: `AnyUi` + `AasxPackageLogic` +
`AasxIntegrationBase` are the clearest evidence of which logic is genuinely
UI-independent (map these to this repo's `shared/` + `server/src/services/`
layer), but the original authors themselves did not reach full desktop-editing
parity in a browser — so this repo's roadmap should not treat "100%
desktop-editing parity" as an early milestone; treat it as a long-tail goal.

### 4.3 What I think this means for porting strategy

This repo already contains a natural experiment proving the right approach:
- The **idiomatic TypeScript plugin rewrite** (`plugin-registry.ts` /
  `plugin-api.ts` / `shared/plugin-types.ts`) — designed fresh for the web, not a
  literal transliteration — is the one that's actually wired up and (mostly)
  compiles.
- The **literal C#-interface port** (`plugin-manager.ts` and friends, importing
  `IAasxPlugin`/`PluginContext`/`AasxPluginResultBase`) is the one that's dead,
  orphaned, and doesn't compile.

**Recommendation derived from this evidence:** for headless/business logic
(`AasxCsharpLibrary`, `AasCore.Aas3_1`, `AasxPackageLogic`,
`AasxIntegrationBase`, `AasxFileServerRestLibrary`), port semantics and behavior
faithfully — these map closely to `shared/` and `server/src/services/`. For UI
(`AasxWpfControlLibrary`, `BlazorExplorer`, `BlazorUI`), use them only as a
reference for *intended UX*, and rebuild idiomatically in React — do not
transliterate C# UI classes into TypeScript/React 1:1. Delete the dead literal
plugin port files rather than trying to fix them into compiling; the working
system already supersedes them.

---

## 5. Findings — external, standards-body ground truth (higher trust than either repo)

The AAS metamodel and REST API are a real published standard (IDTA), and the
standards body maintains its own official conformance tooling:

- **`admin-shell-io/aas-test-engines`** (GitHub) — sends real conformance
  requests/checks against an implementation's HTTP/REST API and validates
  against Part 2 of the spec; currently tests against metamodel 3.0.1 and API
  3.0.3, with 3.1.3 as the latest bugfix line (IDTA-01002-3-2 schemas).
- **IDTA-01001-3-0** — Specification of the AAS, Part 1: Metamodel (defines the
  normative source for the `AASd-*` constraint IDs this repo's validation engine
  implements — the constraints should be checkable against this document
  directly, independent of what the C# app does).
- **IDTA-01002-3-0 / 3-2** — Specification of the AAS, Part 2: APIs (the
  normative source for what this repo's REST API in `server/routes.ts` should
  actually expose).

**What I think this means:** "150/150 AASd constraints passing" and "100% REST
API" should ultimately be graded against these documents/tools, not against the
C# app's behavior or against this repo's own hand-written tests alone. The C#
app is one implementation of the standard, not the standard itself — treat it as
authoritative for *desktop UX/workflow parity*, and treat IDTA's specs +
`aas-test-engines` as authoritative for *protocol/metamodel correctness*.

---

## 6. Findings — current (July 2026) practice in agentic legacy-to-web migration

From web research this session, converging themes relevant to this project:

- **A verification agent that never writes code.** A dedicated agent/role whose
  only job is running the build, tests, and typecheck, and refusing to let a
  "phase complete" claim stand without that evidence — this is the single
  practice most directly missing here, and the most directly implicated in the
  42%-vs-78%-vs-"261 errors" discrepancy. (Sources: Anthropic's code
  modernization playbook, ADC Consulting.)
- **Golden-master / fixture-based regression testing** — capture real
  input/output pairs from the *actual running* C# app (sample AASX files → parsed
  JSON, validation results, XML round-trips) and use them as fixtures the
  TypeScript port must reproduce, instead of narrative confidence scores.
  (Source: EffectiveSoft.)
- **Architectural guardrails + feature-flagged, human-reviewed slices** rather
  than large "phase" claims validated only by the implementing agent itself.
  (Source: AYKAN Soft — reports an 8-months-to-4 migration speedup using this
  pattern plus specialized agents.)
- **Hierarchical/specialized subagents per module** — this repo already does
  this correctly (`.claude/agents/aas-validation-engineer`,
  `frontend-feature-dev`, `backend-service-dev`); the gap is not agent
  specialization but the missing independent-verification role above.

Sources consulted:
- [The Code Modernization Playbook (Anthropic)](https://resources.anthropic.com/hubfs/ebook-code-modernization-playbook-01_update%202%20(1).pdf?hsLang=en)
- [Agentic code migration (ADC Consulting)](https://adc-consulting.com/insights/agentic-code-migration-turning-legacy-into-modern-software/)
- [AI-Powered Legacy Code Modernization and Migration (EffectiveSoft)](https://www.effectivesoft.com/blog/ai-legacy-code-modernization-migration.html)
- [8 Months to 4: How Agentic AI Halved a Legacy Migration (AYKAN)](https://www.aykansoft.com/blogs/?p=30731)
- [admin-shell-io/aas-test-engines (GitHub)](https://github.com/admin-shell-io/aas-test-engines)
- [admin-shell-io/aas-specs-api (GitHub)](https://github.com/admin-shell-io/aas-specs-api)
- [IDTA Part 2: Application Programming Interfaces (PDF)](https://industrialdigitaltwin.org/wp-content/uploads/2023/04/IDTA-01002-3-0_SpecificationAssetAdministrationShell_Part2_API.pdf)
- [IDTA Part 1: Metamodel (PDF)](https://industrialdigitaltwin.org/wp-content/uploads/2023/06/IDTA-01001-3-0_SpecificationAssetAdministrationShell_Part1_Metamodel.pdf)

---

## 7. Recommended strategy (synthesis)

1. **Fix the gate before anything else.** Delete the 27-error orphaned literal
   plugin port; fix the remaining 234 real `npm run check` errors. Until this is
   green, no future "X% complete" claim from any agent session should be trusted
   — this is the direct root cause of the 42%-vs-78% confusion.
2. **Replace prose parity tracking with a regenerable matrix.** A script that
   walks both repos' file/symbol lists and outputs a checkable CSV/JSON (C#
   module → TS equivalent → status), rather than an LLM re-estimating a
   percentage from memory each session.
3. **Split "port literally" from "redesign idiomatically" by layer**, per the
   evidence in §4.3: headless logic (`AasxCsharpLibrary`, `AasCore.Aas3_1`,
   `AasxPackageLogic`, `AasxIntegrationBase`, `AasxFileServerRestLibrary`) → port
   faithfully into `shared/`/`server/`. UI (`AasxWpfControlLibrary`,
   `BlazorExplorer`, `BlazorUI`) → reference only, rebuild idiomatically in React.
4. **Anchor correctness to external oracles**: run `aas-test-engines` against
   this repo's validation engine and REST API; treat IDTA Part 1/Part 2 as the
   normative spec for metamodel/API correctness, independent of the C# app.
5. **Add an independent verification subagent** (`.claude/agents/`) with
   read/bash/test-only tools, required to paste `npm run check` + `npm test` +
   (where applicable) `aas-test-engines` output before any phase is marked
   complete in `.kiro/CONSOLIDATED-SUMMARY.md`.
6. **Re-sequence plugin work using confirmed-real scope**: 18 plugins,
   4–34 C# files each, route through the working `plugin-registry`/`plugin-api`
   infrastructure — never resume the dead literal-port files.
7. **Set expectations honestly**: even the original authors' own Blazor attempt
   didn't reach full desktop-editing parity in a browser (documented crash bugs,
   unfinished flows). Don't treat "100% desktop parity" as an early-phase
   success criterion.

---

## 8. Task tracker

Status legend: `TODO` not started · `IN PROGRESS` · `BLOCKED` needs a decision ·
`DONE`.

**Update — 2026-07-14:** Tasks 1 and 2 are done — see [PR #17](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/17)
(merged to `main`). `npm run check` is now genuinely **0 errors** (was 261).
Task 3 (`npm audit`) is also now done — see [PR #18](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/18)
and [PR #21](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/21)
(both merged): 31 vulnerabilities → **4 moderate, 0 high/critical**. Also
landed in earlier commits on `main` this same window (predating PR #17):
golden-master fixtures and a differential test
(`tests/integration/golden-master/aasx-parser.test.ts`), which is the first
real step on task 4 below — see "What task 4's new golden-master test found"
beneath the table, plus a deeper follow-up finding recorded further below
("2026-07-14: task 4 is bigger than it looked"). Task 4 was subsequently
completed by the 2026-07-14 recovery update at the top of this document.

| # | Task | Area | Priority | Status | Notes |
|---|------|------|----------|--------|-------|
| 1 | Delete orphaned literal-port plugin files (`plugin-manager.ts`, `plugin-action-invoker.ts`, `plugin-event-handler.ts`, `plugin-standard-actions.ts`, `plugin-visual-extension.ts`) | `server/src/services` | P0 | **DONE** (PR #17) | Also found and deleted 2 more of the same pattern during the fix: `server/src/plugins/document-shelf-plugin.ts`, `technical-data-plugin.ts` — confirmed unimported anywhere, superseded by `DocumentShelfPanel.tsx`/`TechnicalDataPanel.tsx`. 7 files removed total |
| 2 | Fix remaining ~234 real `npm run check` errors | repo-wide | P0 | **DONE** (PR #17) | `npm run check` → 0 errors. Root causes: 89 of the 234 were `tsconfig.json` only excluding `**/*.test.ts`, not `**/*.test.tsx` (jest-dom matcher types on 8 test files); rest were real — enum literal/member mismatches, missing type guards on `SubmodelElement \| Submodel` unions, a stale `LangStringSet` type reference, `Express.Request` augmentation drift, missing `xml2js` dependency. `npm test` unchanged at 548 passed / 8 failed / 39 skipped (no regressions; the 8 failures are the task-4 finding below) |
| 3 | Run `npm audit`, triage 31 vulnerabilities (2 critical, 16 high) | deps | P1 | **DONE** ([PR #18](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/18), [PR #21](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/21)) | `npm audit` confirmed 31 (1 low/12 moderate/16 high/2 critical) — GitHub's 76 count on the PR appears to double-count advisories per dependency path, npm's own count is authoritative. **PR #18**: fixed 24 of 31 — `npm audit fix` (no `--force`) got 18 including both criticals (`fast-xml-parser` — real attack surface, uploaded `.aasx` XML; `vitest` — dev-only UI-server RCE); `drizzle-orm` bumped 0.39.1→0.45.2 (real SQL-injection CVE fix, plain registry install); `xlsx` (SheetJS, no npm-registry fix at all — maintainers only publish patches via their own CDN post-MFA-incident) replaced entirely with `exceljs@4.4.0` since it's a real attack surface (`excel-import-service.ts` runs `XLSX.read()`/now `ExcelJS.Workbook#load()` on **user-uploaded** file buffers) — both `excel-import-service.ts` and `excel-export-service.ts` rewritten, `exportEnvironment` is now `async`, verified with a manual export→import round-trip smoke test plus `npm run check`/`npm test`; exceljs's own nested vulnerable `uuid@8.3.2` pinned to `uuid@^13.0.2` via a `package.json` `overrides` entry. **PR #21**: the 5 remaining (all one `vite`/`drizzle-kit`/`esbuild` dev-tooling chain, see the now-superseded subsection below) turned out worth revisiting instead of permanently accepting — actually ran the `vite` 5→8 major bump end-to-end (not just risk-assessed it), verified clean (`npm run check`, `npm test` 548/8/39, `npm run build`, a manual dev-server smoke test), and it resolved the high-severity finding. **Net result: 31 → 4 vulnerabilities, 0 high/critical remaining** — only `drizzle-kit`'s still-unfixed-upstream `@esbuild-kit` chain (4 moderate), a genuinely accepted risk (dev-server-only, `drizzle-kit` isn't in the runtime path). Also closed 6 now-redundant Dependabot PRs (#8, #9, #10, #11, #12, #13) that were pure duplicates of what #18 already fixed; 2 more Dependabot PRs opened after #21 merged (#19 `esbuild`, #20 `vite`/`vitest`) and auto-closed themselves as already-satisfied |
| 4 | Build a regenerable C#↔TS parity matrix (script, not prose) — **prefer golden-master differential testing over a symbol-diff matrix alone; see companion doc** | tooling | P1 | **DONE** (`86c32d7`) | `tests/integration/golden-master/aasx-parser.test.ts` now parses all eight committed legacy V1/V2 fixtures and deep-compares each complete environment with its C# golden output; the OPC origin-marker discovery bug and legacy XML migration gap were fixed |
| 5 | Add an independent verification subagent that gates "phase complete" claims | `.claude/agents/` | P1 | TODO | Read/bash/test tools only; no code-writing |
| 6 | Run `admin-shell-io/aas-test-engines` against this repo's REST API + validation engine | validation / API | P1 | TODO | Establishes objective, standards-body-graded correctness |
| 7 | Re-verify actual AASd-* constraint correctness against IDTA-01001-3-0 Part 1 text, not just internal test count | `shared/validation-rules/*` | P1 | TODO | "150/150" is a count of implemented functions, not proof of spec fidelity |
| 8 | Core plugin porting: Export Table, Generic Forms, Digital Nameplate, Contact Information, Asset Interface Description | `client/src/plugins/*` | P1 | TODO | Use working `plugin-registry`/`plugin-api`; C# sources are small (4–34 files each) |
| 9 | Dictionary integration (ECLASS, IEC CDD) | `server/src/services` | P1 | TODO | Cross-reference `AasxPredefinedConcepts` (48 C# files) as source of truth |
| 10 | Remaining plugins (13 more) | `client/src/plugins/*` | P2 | TODO | See §4.1 plugin list |
| 11 | XML/AML/RDF import-export completeness check against C# `AasxAmlImExport`, `AasxBammRdfImExport` | `server/src/services` | P2 | TODO | |
| 12 | Update `.kiro/CONSOLIDATED-SUMMARY.md` to reflect verified (not self-reported) numbers | docs | P1 | **IN PROGRESS** | A current-evidence warning and verified gate snapshot were added on 2026-07-14. The historical feature percentages still require a full source-backed rewrite; use `ai/analysis/FEATURE_CATALOG.md` meanwhile |

### Task 3: the vite/esbuild chain — first accepted as risk, then actually fixed (PR #21)

After PR #18's fixes, `npm audit` reported 5 (4 moderate, 1 high), all
downstream of one root cause: **`drizzle-kit` still depends on the
deprecated, abandoned `@esbuild-kit/esm-loader`/`@esbuild-kit/core-utils`
packages**, which pull a vulnerable `esbuild` (`GHSA-67mh-4wv8-2f99` — a
website can send requests to, and read responses from, a running dev
server). `vite` independently bundled its own (already-patched, from the
earlier `npm audit fix` pass) `esbuild`, but npm's dependency graph still
flagged `vite` in the same remediation path because forcing the fix required
`vite@8.1.4`.

Checked upstream status directly (`drizzle-team/drizzle-orm` GitHub issues,
July 2026): **at least 5 open PRs propose dropping `@esbuild-kit/esm-loader`
in favor of `tsx`** (the actively-maintained successor, by the same author),
the oldest open since November 2024, the newest from April 2026 — none
merged as of this session. npm's own suggested "fix" for `drizzle-kit` is to
**downgrade** to `0.18.1`, which is npm's resolver routing around a
dependency range rather than a real upstream fix, and would lose 13+ minor
versions of functionality — not applied, and still not applied as of PR #21.

**First decision this session: left as-is, accepted risk, no code change**,
on the reasoning that both remaining paths are dev-server-only exploits (not
reachable in the production bundle or a deployed server), `drizzle-kit` isn't
in this repo's actual runtime path (storage is flat JSON, not live
Postgres), and the only real fix for the `vite` half (a 3-major-version jump)
looked like more regression risk than the exposure justified.

**Revised in the same session, after actually testing it (PR #21):**
prompted by Dependabot's still-open PR #14 proposing the same `vite` bump,
the upgrade was run end-to-end instead of left as an assumption — see the
task tracker row above for the full result. It worked cleanly (verified with
typecheck, full test suite, a real build, and a dev-server smoke test), and
it resolved the `vite`/`esbuild` half of this finding entirely. **Lesson for
future sessions: "this looks risky" is a reason to test it in a throwaway
branch, not a reason to permanently defer it** — the actual regression risk
here turned out to be zero, once checked instead of estimated.

**What's still deferred, and why:** only the `drizzle-kit`/`@esbuild-kit`
portion (4 moderate) remains, because unlike `vite`, there genuinely is no
fix to test yet — `drizzle-kit` has not merged any of the open PRs dropping
`@esbuild-kit`. This part of the original rationale still holds: dev-server
only, `drizzle-kit` isn't in the runtime path, revisit when upstream merges
one of those PRs or ships a release without the dependency.

### What task 4's new golden-master test found

All 8 real-world `.aasx` fixtures parse without throwing (matches the C#
reference's `parse.success`), but `assetAdministrationShellCount` /
`submodelCount` / `conceptDescriptionCount` come back **0 for every fixture**,
while the C# reference reports real counts (e.g. 1/6/154 for one file). Root
cause: every real-world sample stores its environment as namespaced AAS XML
(`*.aas.xml`), and `convertXmlToEnvironment`/`convertXmlToAAS`/
`convertXmlToSubmodel`/`convertXmlToConceptDescription` in
`shared/aas-parser.ts` are explicitly-commented "simplified" stubs that assume
a flat object shape, not the real namespaced XML schema — so parsing
"succeeds" but silently returns an empty environment.

### 2026-07-14: task 4 is bigger than it looked — needs a scoping decision

Follow-up session dug into what "implement a real AAS-XML deserializer" would
actually require, and found the framing was wrong: **none of the 8
golden-master fixtures are AAS V3 XML.** Inspecting the actual XML inside each
`.aasx` (`xmlns:aas="http://www.admin-shell.io/aas/2/0"` etc.) shows 7 fixtures
are legacy **AAS V2.0** XML and 1 (`Phoenix_Contact_PT_4_-_CAD.aasx`) is **AAS
V1.0**. The C# reference (`AdminShellPackageFileBasedEnv` in
`AasxCsharpLibrary/PackageEnv/AdminShellPackageEnvBase.cs:145-206`) detects the
schema version by namespace and runs the XML through a dedicated migration
path — `res.ConvertFromV20(v20)` / `res.ConvertFromV10(v10)` — before handing
back a V3 `Environment`. That migration is implemented as `ConvertFromV20`/
`ConvertFromV10` extension methods spread across ~26 files under
`eclipse-aasx-package-explorer/src/AasxCsharpLibrary/Extensions/*`, backed by
the V1.0/V2.0 compatibility object models in `AasxCompatibilityModels/V10/`
(4,649 lines) and `AasxCompatibilityModels/V20/` (8,896 lines).

So this is not "write an XML parser for the shape we already understand" — it's
"port a legacy-format migration engine," and it has real, non-obvious,
fixture-verified semantics, e.g. (diffed directly from
`Example_AAS_ServoDCMotor_21.aasx` against its golden JSON):
- `semanticId` reference keys are always normalized to `GlobalReference`
  in the V3 output, regardless of the original V2 `type` attribute (a V2
  `<aas:key type="ConceptDescription" local="true" idType="IRDI">` semanticId
  key still comes out as `{"type": "GlobalReference", ...}`).
- `valueId` reference keys, by contrast, keep their original V2 `type`
  attribute unchanged.
- A V2 `<aas:qualifier>` with an empty `<aas:valueType />` defaults to
  `"xs:string"` in the V3 output.
- `assetRef` + `submodelRefs` (V2, on the AAS) collapse into V3's
  `assetInformation` (`assetKind`/`globalAssetId`, sourced from the separate
  top-level `<aas:asset>` element) and `submodels` (`ModelReference[]` with
  `Submodel`-typed keys) respectively — different reference-type handling
  again from either of the above.

This was surfaced to the user as a scoping question (full V1+V2 port vs.
V2.0-only first, covering 7/8 fixtures, vs. no formal spec) — **decision still
pending as of this update; do not start implementing until it's resolved.**
Recommendation if/when resumed: scope to V2.0 first (7/8 fixtures), write it
as a `.kiro/specs/` entry given the size (~13,500 lines of C# reference model
+ scattered conversion logic to port faithfully), and treat V1.0
(`Phoenix_Contact_PT_4_-_CAD.aasx`) as an explicit follow-up rather than
blocking on it.

---

## 9. Operational note: local `git push`/`git fetch` fails in this dev environment

Discovered and worked around repeatedly across this session's later work
(the npm-audit and vite-8-upgrade PRs): `git push`, `git fetch`, and even a
bare `curl https://github.com` **fail from this machine's own local shell**
with a TLS/certificate error (`SSL certificate ... unable to get local
issuer certificate`, or `schannel: ... CRYPT_E_NO_REVOCATION_CHECK`). This
is not a `gh` CLI problem — `gh api`/`gh pr create`/`gh pr close` all work
fine, because `gh` doesn't go through the same TLS path. Root cause traced
to `NODE_EXTRA_CA_CERTS` pointing at `C:\ProgramData\Norton\Antivirus\
wscert.pem` plus an active `SSLKEYLOGFILE` proxy hook in the environment —
strongly indicative of **Norton's HTTPS/TLS-inspection feature** intercepting
the connection and the revocation check on its injected certificate failing.

**What this means for a future session:** git operations that only touch the
local repo (commit, branch, diff, log) work fine. Anything that talks to
`github.com` directly over git's own HTTPS transport (`push`, `fetch`,
`pull`) will fail in this sandbox. Do not spend time re-diagnosing this —
either use `gh` for anything that needs GitHub (PR creation, branch
existence checks via `gh api repos/.../branches/<name>`, etc.), or ask the
user to run the `git push`/`git pull` themselves from their own terminal
(confirmed working there — see PR #18 and #21, both pushed manually by the
user after the same failure here). **Verify a claimed push actually landed**
via `gh api repos/kunalsuri/web-eclipse-aasx-explorer/branches/<name>`
rather than trusting local remote-tracking refs — this session hit a case
where a stale local tracking ref existed before the real push had happened,
which produced a confusing false-positive.

---

## 10. How to resume this in a future session

1. Re-read this file first.
2. If you need the C# source again: it was cloned to `/workspace/eclipse-aasx-package-explorer`
   in an earlier session's ephemeral container — that path will not exist in a new
   session. It's also available locally as a sibling checkout at
   `C:\Users\kunal\Documents\GitHub\eclipse-aasx-package-explorer` (used directly
   in the 2026-07-14 session for task 4's investigation, see §8 above) — check there
   first before re-cloning.
3. Before trusting any existing "X% complete" claim in `.kiro/CONSOLIDATED-SUMMARY.md`
   or the `analysis-output/` folder, run `npm run check` and `npm test` yourself —
   do not propagate un-reverified numbers forward again.
4. See §9 immediately above before attempting any `git push`/`git fetch`/`git pull` —
   it will very likely fail from this sandbox's shell, and that's expected, not
   a sign of a broken repo.

**Current state as of 2026-07-14 (recovery update):** Tasks 1–4
are done and merged to `main` ([PR #17](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/17),
[PR #18](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/18),
[PR #21](https://github.com/kunalsuri/web-eclipse-aasx-explorer/pull/21)), plus
task 4 in commit `86c32d7`.
`npm run check` passes, `npm test` is 610/0/0, and `npm audit` is
4 moderate/0 high/0 critical. All
Dependabot PRs as of this writing are closed (either merged-equivalent or
auto-closed as redundant) — no open PRs were recorded in that earlier check.
The 39 skipped tests were subsequently activated and repaired during the same
recovery. **Next concrete step, by priority:** task 6 (`aas-test-engines`) and
task 7 (AASd-* spec re-verification). Tasks 8–11 remain
the feature-parity backlog; task 12 remains a full historical-summary rewrite.
