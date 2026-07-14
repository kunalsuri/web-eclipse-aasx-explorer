<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Post-cold-start verification — 2026-07-14

`[inferred]`

## Scope and method

Audited the `ai/` knowledge layer plus `AGENTS.md` and `CLAUDE.md` after the
2026-07-14 cold-start pass. Placeholder and provenance checks covered every file
under `ai/`; semantic review covered the five guide documents, the three Mermaid
diagrams, the machine-readable profiles, the entry instructions, and the source
files needed to test load-bearing claims about authentication, storage, plugins,
and test placement.

The mechanical `VERIFICATION_MANIFEST.json` was absent at audit start. In
accordance with the post-cold-start verification workflow, this report does not
substitute hand-derived path results for that deterministic manifest. A final
non-writing `verify --dry-run --strict` check confirmed 235 claims and reported
14 unconfirmed path claims; it exited 1 and intentionally did not create the
manifest or the verifier's companion report.

## Summary

| Priority | Count | Meaning |
|---|---:|---|
| P1 | 3 | Agent-blocking or unsafe to trust |
| P2 | 5 | Materially misleading or incomplete |
| P3 | 1 | Intentional scaffold residue |

## P1 — agent-blocking

### P1.1 — The deterministic verification manifest is missing

- **Location:** `ai/analysis/audit-reports/VERIFICATION_MANIFEST.json` (absent).
- **Evidence:** No manifest exists. The deterministic final dry-run scanned 249
  claims, confirmed 235, and reported 14 missing/unconfirmed claims, so strict
  path integrity is currently red even though the results were not persisted.
- **Suggested fix:** From the ai-fication-kit checkout, run `node install.mjs verify <repo> --strict` and review every non-`confirmed` claim before trusting the maps.

### P1.2 — Three MODULE_MAP surfaces still have unknown Stability

- **Location:** `ai/guide/MODULE_MAP.md:10`, `ai/guide/MODULE_MAP.md:39`,
  `ai/guide/MODULE_MAP.md:44`, `ai/guide/MODULE_MAP.md:53`.
- **Evidence:** The last-verified date/SHA remain `<fill in>` placeholders, and
  the grouped client support directories, `server/src/utils/`, and three shared
  modules retain `?`; repository instructions require agents to treat these as
  frozen, so ordinary work in those areas is blocked pending human audit.
- **Suggested fix:** A human should assign each row `frozen`, `stable`, or `ours`, then replace the last-verified placeholders with the audit date and commit while adding dated `[verified]` tags only to claims actually checked.

### P1.3 — The documented authentication boundary is false for most API routes

- **Location:** `ai/guide/ARCHITECTURE.md:41-44`,
  `ai/guide/MODULE_MAP.md:45`, `ai/guide/FEATURE_MAP.md:50-54`, and
  `ai/analysis/diagrams/seam.mmd:17-20`.
- **Evidence:** The guides say JWT and server-side session validation are both
  required and the sequence diagram routes every request through
  `auth-middleware.ts`. In current source, `server/routes.ts` mounts the AASX,
  clipboard, dictionary, delete, and reference routes without authentication;
  only `server/profile.ts` imports `validateAccessToken`, and no route imports the
  combined `authenticate` middleware that also calls `validateSession`.
- **Suggested fix:** Rewrite the maps and seam diagram to show actual per-route enforcement, and separately require a human security decision on whether the unprotected routes are intentional or an application bug.

## P2 — misleading

### P2.1 — The documented test topology contradicts the repository

- **Location:** `ai/guide/CONVENTIONS.md:33-36`,
  `ai/guide/MODULE_MAP.md:56`, and `ai/repo-indepth.json:604,854-866`.
- **Evidence:** The guide says tests are centralized and not colocated, but 15
  tests live under source `__tests__/` directories in `client/src/features/`.
  The indepth profile also reports two different test-file counts (53 and 64)
  and says `integrationTests: false` despite populated `tests/integration/`
  suites referenced by the guides.
- **Suggested fix:** Document the real hybrid test layout and regenerate or qualify the contradictory indepth test facts so agents select both colocated and centralized suites.

### P2.2 — Plugin implementation status is copied from contradictory planning data

- **Location:** `ai/guide/MODULE_MAP.md:34`,
  `ai/guide/ARCHITECTURE.md:54-61`, `ai/guide/PROJECT_OVERVIEW.md:32-35`, and
  `ai/guide/FEATURE_MAP.md:71-75`.
- **Evidence:** All guides repeat “2/18 planned plugins implemented” while also
  saying no concrete implementation exists. The cited `.kiro/CONSOLIDATED-SUMMARY.md`
  itself says both 0/5 core plus 0/13 additional plugins and, elsewhere, 2/18;
  the current tree contains plugin infrastructure and tests but no concrete
  `client/src/plugins/` or `server/src/plugins/` implementations.
- **Suggested fix:** State the observed source status (infrastructure present, concrete plugins absent) and label conflicting planning counts as historical until a human reconciles the planning document.

### P2.3 — Every populated guide still tells readers it is an unpopulated scaffold

- **Location:** `ai/guide/ARCHITECTURE.md:5`,
  `ai/guide/CONVENTIONS.md:5`, `ai/guide/FEATURE_MAP.md:5`,
  `ai/guide/MODULE_MAP.md:5`, and `ai/guide/PROJECT_OVERVIEW.md:5`.
- **Evidence:** Each populated cold-start output still says “This is a scaffolded
  template” and instructs readers to run `/cold-start`, contradicting the dated
  drafted content immediately below it and encouraging an unnecessary rerun.
- **Suggested fix:** Replace the five scaffold banners with a concise drafted-by-cold-start, pending-human-audit notice.

### P2.4 — The repository-specific invariant sections are still empty

- **Location:** `ai/guide/ARCHITECTURE.md:67-69` and
  `ai/guide/CONVENTIONS.md:39-45`.
- **Evidence:** Both human-only sections still contain angle-bracket instructional
  text rather than audited invariants, even though the surrounding draft already
  identifies storage duality, spec-derived validation rules, generated/runtime
  data, and cardinality severity as candidate load-bearing knowledge.
- **Suggested fix:** A human should promote only confirmed candidates into dated `[verified]` invariant rows, or explicitly record that no additional invariants were accepted.

### P2.5 — Actionable feature guidance still contains unresolved audit guesses

- **Location:** `ai/guide/FEATURE_MAP.md:61`,
  `ai/guide/FEATURE_MAP.md:74-75`, `ai/guide/MODULE_MAP.md:34`, and
  `ai/guide/MODULE_MAP.md:58`.
- **Evidence:** The map retains `UNSURE`, “path a guess,” and `AUDIT TODO` markers
  for dictionary configuration, plugin verification/status, and the broken
  `create-admin` script. These warnings are honest, but the navigation layer is
  not yet decision-ready for work in those areas.
- **Suggested fix:** Have a human resolve each marked claim against current source/config and replace the markers with a concrete fact, owner decision, or tracked issue reference.

## P3 — cosmetic

### P3.1 — The on-demand feature catalogs remain illustrative placeholders

- **Location:** `ai/analysis/FEATURE_CATALOG.md:8,48-55`,
  `ai/analysis/FEATURE_CATALOG_BACKEND.md:8-29`, and
  `ai/analysis/FEATURE_CATALOG_FRONTEND.md:8-29`.
- **Evidence:** The files explicitly identify themselves as placeholders and use
  example rows with angle-bracket paths and `?` status. This is intentional until
  `/create-feature-catalog` runs, but the artifacts are not usable as repository
  intelligence yet.
- **Suggested fix:** Run `/create-feature-catalog` when a full catalog is needed; until then, keep these files clearly marked as non-authoritative examples.

## Checks that passed

- **Profile consistency:** `npm install && npm run build` and `npm test` match in
  `ai/repo-profile.json`, `AGENTS.md`, `CLAUDE.md`, `PROJECT_OVERVIEW.md`, and
  `CONVENTIONS.md`.
- **Provenance hygiene:** No agent-authored factual claim carries a dated or
  undated `[verified]` status; occurrences are policy text or `[verified] required`
  placeholders. All cold-start diagrams are tagged `[inferred]`.
- **Template residue check:** No `{{...}}` token remains. Exact `<fill in>` tokens
  and Stability `?` values are fully accounted for in P1.2; catalog example `?`
  values are accounted for in P3.1.

## Mechanical verification result

- Command: `node install.mjs verify <repo> --dry-run --strict`
- Result: **failed as expected** — 249 claims scanned, 235 confirmed, 0 moved,
  14 missing/unconfirmed; exit code 1.
- Write behavior: `--dry-run` preserved the skill's one-report limit, so
  `VERIFICATION_MANIFEST.json` and `VERIFICATION_REPORT.md` remain absent.

## Recommended order

1. Generate and inspect the strict verification manifest.
2. Correct the authentication model in the knowledge layer and decide the source-level security intent.
3. Complete the human Stability and invariant audit.
4. Reconcile test topology, plugin status, and remaining uncertainty markers.
5. Remove stale scaffold banners; generate feature catalogs only if needed.
