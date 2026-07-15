<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# REVIEW: W-017 — Fix ADV-03: remove 33 fabricated AASd constraint IDs
> **Date:** 2026-07-15 · **Spec:** `ai/lab/specs/BUGFIX_remove_fabricated_aasd_constraints.md` · **Ledger row:** `W-017`
> **Reviewer:** agent, fresh session — did not implement this change
> **Verdict:** approve-with-notes

## Scope reviewed
Commit `285dbfd` ("Fix ADV-03: remove 33 fabricated AASd constraint IDs") on branch
`claude/codebase-context-review-toog73`. Its actual parent on this branch is
`d274905` ("Record fresh-context review of W-016 and fix doc-accuracy findings"),
**not** `e4d80c1` as the task brief guessed — confirmed with
`git log -1 --format=%H 285dbfd^` → `d274905`. All diffs below are
`git diff d274905..285dbfd`. 17 files changed, 170 insertions(+), 390 deletions(-):
`shared/validation-rules/aasd-structural.ts`, `shared/validation-rules/aasd-semantic.ts`,
6 test files, 7 `ai/`/`.agents/` docs, plus the new spec doc itself and a
`ai/lab/WORKLOG.md` row. HEAD was at `285dbfd` with a clean working tree for the
entire review (verified with `git status --short` before running any suite), so
everything executed below ran against the exact reviewed commit.

## Checks — evidence, not assertions
| Check | Result | Evidence |
|---|---|---|
| ADV-03 finding match — removed IDs = audited IDs | ✅ | `ADVERSARIAL_AUDIT_2026-07-14.md` ADV-2026-07-14-03 lists exactly `AASd-031..044, AASd-050, and AASd-078..097` (35 IDs). The diff removes `AASd_031..044` (14) + dead-code `AASd_050` (1) from `aasd-structural.ts`, and `AASd_078..089, AASd_091..097` (19) + dead-code `AASd_090` (1) from `aasd-semantic.ts` = 35 touched, 33 registered removals. Exact match, no more, no less. |
| Load-bearing claim ("these 33 IDs are fabricated, not real IDTA constraints") | ⚠️ **unverifiable by this review** | No local spec text exists to check against: `find . -iname "_external_source*" -o -iname "*.pdf" -o -iname "*idta*spec*" -o -iname "*metamodel*"` (excluding `node_modules`) returned nothing. The claim rests entirely on external web research (`aas-core-works/aas-core-meta`, `aas-core3.0-python`) this review could not re-run. See Finding 1 and "What the human should double-check." |
| Internal-consistency supporting evidence (gap-list example) | ❌ **factually wrong** | See Finding 1 — the specific example cited to corroborate the claim (IDs 107, 114, 116, 118-121, 130, 131 as "gaps matching the real spec") is empirically false in this codebase: all seven are defined and registered. |
| Removal precision — only the 33 intended IDs removed, nothing else | ✅ | `git diff ... -- shared/validation-rules/aasd-structural.ts \| grep '^@@'` → 3 hunks (031-044 block, 050 stub + comment, array-entry list). `aasd-semantic.ts` → 2 hunks (078-097 block + comment, array-entry list). No other hunks in either file. `git diff --stat -- shared/` shows only these two files changed under `shared/`. |
| Registry integrity — count, no-ops, duplicates | ✅ | Ran a throwaway `tsx` script importing `AllAASdConstraints` from `shared/validation-rules/index.ts`: **total 117**, **0 literal `() => []` validators**, **0 duplicate IDs**, all 33 target IDs confirmed absent, `AASd-050`/`AASd-090` (the real, non-removed implementations) confirmed present. |
| Test correctness — hardcoded numbers recomputed independently | ✅ | Recomputed from the live arrays, not trusted from the commit message: `AASdStructuralConstraints.length` = 27 (test asserts `>=27` ✅, exact-ID list of 27 matches byte-for-byte after sorting both sides); `AASdSemanticConstraints.length` = 24, and is exactly `AASd-053..076` contiguous (test asserts `>=24` ✅); `structuralConstraints` filtered from `AllAASdConstraints` by `category==="structure"` = 29 (test asserts `>25` ✅); `getConstraintCount()` = 117 (cardinality test asserts `===117` ✅, exact); datatype test asserts `>=105`, and `117 - 12 (datatype) = 105` reproduces the comment's own arithmetic, actual total 117 clears it. |
| Surgical diff — kept constraints (`AASd-045..049`, `AASd-053..076`, etc.) byte-unchanged | ✅ | Hunk headers above show only the deletion blocks plus the export-array entries and comments — no hunk touches surviving `validate` bodies. `shared/validation-rules/aasd-advanced-constraints.ts`, `aasd-constraints.ts`, `aasd-reference.ts`, `aasd-datatype.ts`, `aasd-cardinality.ts`, `index.ts`, `aas-validation-engine.ts`, `validation-types.ts` — zero of these appear in the diff. |
| Stability respected | ✅ | `ai/guide/MODULE_MAP.md:50` lists `shared/aas-validation-engine.ts` + `shared/validation-rules/` as `stable` (not `frozen`) — editing is permitted. |
| Doc accuracy — no "117/117 = full official spec" overclaim | ✅ (one nit) | Spot-checked `.agents/validation-engine.md`, `.agents/workflow.md`, `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/PROJECT_OVERVIEW.md`, `ai/guide/FEATURE_MAP.md`, `ai/guide/MODULE_MAP.md`. `.agents/validation-engine.md` explicitly states: *"'117 registered' is not the same claim as '117/117 of the official IDTA spec'... the spec has additional constraint IDs... this engine does not cover."* `FEATURE_CATALOG.md` explicitly flags the 117 as not content-fidelity-audited. No file claims full spec conformance. One stale statement found — see Finding 3 — and `MODULE_MAP.md`'s "(non-contiguous, matching real IDTA gaps)" phrase repeats the same unverified/partly-debunked claim as Finding 1, propagated into a guide doc (folded into Finding 1). |
| Provenance clean — no `[verified]` written by an agent | ✅ | `git diff d274905..285dbfd -- ai/ .agents/ \| grep '\[verified\]'` → no matches. All new/edited rows keep `[inferred]` (spec doc title, `MODULE_MAP.md` row, `WORKLOG.md` row). |
| Second finding (ADV-2026-07-15-01) correctly left open, not silently fixed | ✅ | `DEFECT_TRACEABILITY.md` new row: severity medium, **Status: OPEN**, describes the `AASd-050`/`AASd-090` content-fidelity mismatch, explicitly "not fixed." `shared/validation-rules/aasd-advanced-constraints.ts` (where these two live) does not appear in the diff — confirmed unedited. |
| `.kiro/` untouched | ✅ | `git diff d274905..285dbfd --name-only \| grep -i kiro` → no matches. |
| Tests — suites green | ✅ | See results below, run directly by this review. |
| Verify claims — `node install.mjs verify . --strict` | `BLOCKED-ENV` | No `install.mjs` anywhere in the repo. This is a **pre-existing, already-documented** gap — `ai/lab/reviews/REVIEW_W-015.md` Finding 4 flagged the identical blocker on 2026-07-15, unrelated to this diff. **Compensating evidence:** ran `npm run check`, `npm test`, `npm run build` directly (below) plus the manual path/registry checks in this table. Per the review template, this caps the verdict at approve-with-notes independent of any other finding. |

### Test / build / typecheck results (run directly against `285dbfd`, HEAD, clean tree)
- `npm run check` (`tsc`) → exit 0, no diagnostics.
- `npm test` (`vitest run --config tests/setup/vitest.config.ts`) → **762 passed / 762**, **53 test files passed / 53**, 0 failed. `constraint-count.test.ts`'s own stdout independently corroborates the category breakdown: `AASdConstraints: 11, AASdAdvancedConstraints: 11, AASdStructuralConstraints: 27, AASdSemanticConstraints: 24, AASdReferenceConstraints: 25, Total AllAASdConstraints: 117` (datatype 12 + cardinality 7 not printed in that log line but independently confirmed by script = 117 total). `find-duplicates.test.ts` stdout: `Duplicate IDs: []`.
- `npm run build` (`node scripts/build.mjs`) → exit 0; only pre-existing, unrelated warnings (stale browserslist data, one dynamic/static import overlap in `client/src/features/auth`, a >500kB chunk-size notice).

## Findings
| # | Severity | File | Finding | Resolution |
|---|---|---|---|---|
| 1 | major | `ai/lab/specs/BUGFIX_remove_fabricated_aasd_constraints.md:45-49`, propagated to `ai/guide/MODULE_MAP.md:50` | The spec doc's "Conclusion" offers an *internally checkable* piece of supporting evidence for the fabrication claim: "the codebase's genuine constraint IDs already skip numbers exactly where the real spec does, e.g. 107, 114, 116, 118-121, 130, 131." This is **false**. A script against the live `AllAASdConstraints` registry shows the numeric range 98-150 is fully contiguous with **zero gaps** anywhere in it — the only gaps in the entire registry are exactly where the 33 IDs were just removed (31-44, 78-89, 91-97). Direct grep confirms `AASd_107`, `AASd_114` are defined and exported from `aasd-advanced-constraints.ts`, and `AASd_116`, `AASd_118`, `AASd_119`, `AASd_120`, `AASd_121`, `AASd_130`, `AASd_131` are defined and exported from `aasd-constraints.ts` — all seven cited "gap" IDs are real, registered, behaviorally-implemented constraints, not gaps. This specific corroborating example does not survive a check that required no internet access, which weakens confidence in the surrounding external-research claim it was meant to support (though it does not disprove that claim — see next point). `MODULE_MAP.md`'s new row repeats the same unverified assertion ("non-contiguous, matching real IDTA gaps"). Some other internal evidence *does* hold up: the removed rules' names/descriptions ("Additional Structural Constraint 31," "Semantic Constraint 78," "Additional semantic validation") are visibly generic/auto-generated-looking compared to every surviving rule's specific name (e.g. "SubmodelElementList Type Consistency" for AASd-045, "Blob MIME Type Required" for AASd-050) — that contrast is real and was independently observed in this review, not just asserted by the implementer. | not fixed — flagged for the implementer/human to correct or drop the specific (107/114/116/118-121/130/131) example in the spec doc and `MODULE_MAP.md`, since it is demonstrably wrong as stated |
| 2 | — (not a defect, procedural note) | — | The core justification for deleting 33 registered constraints — that none of the 35 audited IDs correspond to any real IDTA constraint — rests entirely on external web research this review could not re-run (no internet fetch used, per the task's framing; no local IDTA spec text exists in this repo to check against instead, confirmed by searching for `_external_source/`, `*.pdf`, and spec-text files). Everything checkable *without* that external source (removal precision, registry integrity, test arithmetic, surgical diff, doc caveats, provenance, open-issue tracking) checks out. This is the single most important thing the human should independently confirm before trusting the removal — see "What the human should double-check." | not resolved by this review — inherent scope limit, task explicitly anticipated this and mandated at least approve-with-notes on this basis |
| 3 | minor | `shared/validation-rules/aasd-semantic.ts:2` | The file's top-of-file docstring still reads `AAS V3.0 Semantic Constraints (AASd-053 to AASd-097)`. After this diff the file's highest remaining constraint is `AASd-076` (`AASd-077` and `AASd-090` live in `aasd-advanced-constraints.ts`; `078-097` were just removed) — the range comment is now stale/misleading. Not in the touch list, not a functional issue. | not fixed — one-line docstring correction recommended |
| 4 | nit | — | `node install.mjs verify . --strict` (CLAUDE.md/AGENTS.md rule 9) remains unreachable in this checkout, as already documented in `REVIEW_W-015.md` Finding 4. Recorded here again as BLOCKED-ENV per the review template rather than silently skipped; not introduced by this change. | not fixed — pre-existing, outside this change's scope |

No correctness, registry-integrity, or test-arithmetic findings survived review — every mechanically checkable claim in the diff holds up exactly as stated.

## What the human should double-check
1. **The load-bearing external claim itself.** This review could not re-run the
   `aas-core-works/aas-core-meta` / `aas-core3.0-python` cross-reference the implementer
   used to conclude all 33 IDs are fabricated (no internet access used in this review, no
   local spec copy in the repo). Everything internally checkable supports the *mechanics*
   of the fix being done correctly and matching what ADV-03 asked for, but the
   foundational premise — "no real IDTA constraint exists under these 33 numbers" — is
   taken on faith from the spec doc. Given Finding 1 shows one piece of the spec doc's own
   supporting evidence for that premise is factually wrong, this needs an independent,
   real check against the actual IDTA-01001-3-0-1 / `aas-core-meta` text before being
   treated as settled, not just a re-read of the spec doc's prose.
2. **Whether Finding 1's error changes anything material.** The registry cleanup itself
   is low-risk to be wrong about either way: these 33 rules were `() => []` no-ops
   providing zero validation value before removal, so even if a future audit finds a
   couple of the removed IDs *do* correspond to real (currently unimplemented) IDTA
   constraints, the fix is cleanly reversible (re-add with real semantics) and no
   currently-passing behavior regresses. Decide whether that risk profile is acceptable
   to merge now versus wait for the gap-list claim to be corrected first.
3. **Doc/spec hygiene follow-ups (Finding 1's `MODULE_MAP.md` phrase, Finding 3's stale
   header comment).** Neither blocks merge; both are small, low-cost fixes a human (or a
   follow-up agent session) can make in a few minutes.
