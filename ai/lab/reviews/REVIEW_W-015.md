<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# REVIEW: W-015 (ledger row `W-016`) — Complete ADV-2026-07-14-02: persist submodel/element mutations into the real AASX package
> **Date:** 2026-07-15 · **Spec:** `ai/lab/specs/SPEC_F01_package_create_open_save_close.md` §4.2, C1-C7 · **Ledger row:** `W-016`
> **Reviewer:** agent, fresh session — did not implement this change
> **Verdict:** approve-with-notes

## Scope reviewed
This review was dispatched against an **uncommitted working-tree diff**, captured at
`/tmp/claude-0/.../scratchpad/W-015.diff` and covering `server/aasx-routes.ts` and
`tests/integration/aasx-package-roundtrip.test.ts`, plus doc-only changes to
`ai/analysis/FEATURE_CATALOG.md`, `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`,
`ai/guide/FEATURE_MAP.md`, `ai/lab/ROADMAP.md`.

**Mid-review, that working tree was committed** as `ce5c3c8` ("Persist submodel/element
mutations into the real AASX package (ADV-02)"), on top of parent `e4d80c1`. This
happened while the review was in progress (git status went from 6 modified files to
clean between two of my `git status` calls; `ai/lab/WORKLOG.md` gained a row, `W-016`,
that was not present at the start of this session). I did not author that commit — I
issued no `git commit` in this session. I re-diffed `e4d80c1..ce5c3c8` for
`server/aasx-routes.ts` and `tests/integration/aasx-package-roundtrip.test.ts` and
confirmed the content is byte-identical to the original `W-015.diff` I was handed, so
the review below evaluates `ce5c3c8` (the diff did not change under me, only its commit
state did).

Effective scope: `git diff e4d80c1 ce5c3c8` — 7 files, `43 insertions(+), 28 deletions(-)`.

Ledger note: `ai/lab/WORKLOG.md` already has a row `W-015` (added by an earlier session,
covering `e4d80c1`'s fix of ADV-01/ADV-04 and the *first two* ADV-02 routes). The row
for **this** change was filed as `W-016`, not `W-015` — see Finding 2.

## Checks — evidence, not assertions
| Check | Result | Evidence |
|---|---|---|
| Spec conformance — mutation routes persist to the real `.aasx` transactionally (§4.2) | ✅ | All 5 routes read at `server/aasx-routes.ts:1003, 1040, 1072, 1111, 1156` now end in `await saveEnvironment(id, environment);` instead of the old `tempPath`/`fs.rename` sidecar-only pair. `saveEnvironment` (`server/aasx-routes.ts:168-176`) calls `AasxPackageService.save` (`server/src/services/aasx-package-service.ts:26-41`), which repacks via `replaceAasxEnvironment`, validates by reopening (`parseAasxBuffer`), then atomically replaces the package (`writeValidatedPackage` → `AtomicFileWriter`), matching C3/C4. |
| Correctness — `environment` passed is the mutated object, not stale | ✅ | Read each handler in full (`server/aasx-routes.ts:986-1166`). In every route the mutation is applied in place on the same `environment` object (or on a nested object reached via `.find()`, which is a reference into `environment.submodels`), so `saveEnvironment(id, environment)` always sees the post-mutation state. E.g. `submodel.submodelElements.push(element)` at line 1037 mutates the array reachable from `environment.submodels`, not a copy. |
| Error handling — `saveEnvironment` failures don't crash or corrupt state | ✅ | All 5 routes keep the pre-existing outer `try { ... } catch (error) { console.error(...); res.status(500).json({ error: "..." }); }` wrapper unchanged (diff only replaces the 3-line save block). `AasxPackageService.save` (lines 34-39) rolls back the package bytes if the JSON-sidecar write fails after the package write succeeds, and `replaceAasxEnvironment` (`shared/aasx-package.ts:105-111`) throws `"Saving XML-backed AASX environments requires a canonical XML serializer"` for non-JSON environments — that throw propagates to the route's catch and returns a 500, it does not crash the process or leave a torn write (verified by reading the function; not separately re-tested here since it is unchanged, already-merged `e4d80c1` code). |
| Missed spots — no route still does the old sidecar-only write | ✅ | `grep -n "tempPath\|fs.rename(tempPath, envPath)" server/aasx-routes.ts` → only hit is `writeMetadata`'s own temp-file pattern (line 163-165), which writes `metadata.json` (an unrelated file, not an environment/package write) and is untouched by this diff. No mutation route left using the old pattern. |
| Surgical diff — nothing beyond the described scope changed | ✅ | `git diff --numstat e4d80c1 ce5c3c8 -- server/aasx-routes.ts` → `5  15`. Exactly 5 hunks, each `-3/+1` (remove `tempPath`+`writeFile`+`rename`, add one `saveEnvironment` call). No other line in the 1347-line file changed. |
| Stability respected | ✅ | `ai/guide/MODULE_MAP.md:47` lists `server/aasx-routes.ts` as `stable` (not `frozen`), and the spec's touch list (`SPEC_F01...md` §5) explicitly names it with change "route create/upload/mutations/download through package service" — this diff is a narrow instance of exactly that. |
| Tests — new behavior covered; suites green | ✅ | See Test results below. Both new tests exercise `AasxPackageService.save` directly, matching the file's existing style (`upload -> edit Property -> save -> download -> reopen`); there is genuinely no HTTP-level harness in this repo — confirmed via `grep -rl "supertest\|aasx-routes" tests/` → no matches anywhere. Route-level correctness (right `environment` object reaches `saveEnvironment`) was therefore verified by direct code reading (row above), not by an HTTP test, because none exists to write against. |
| Conventions & license headers match neighbors | ✅ | `server/aasx-routes.ts` and `tests/integration/aasx-package-roundtrip.test.ts` both have no header in this repo's convention (checked `head -3` of both plus a sibling test file); diff adds none, consistent. |
| Knowledge updated — maps/catalog amended, tagged `[inferred]` | ✅ (with notes) | `FEATURE_CATALOG.md` F03, `FEATURE_MAP.md` AASX Manager gotchas, `DEFECT_TRACEABILITY.md` ADV-02 row, `ROADMAP.md` F01 row all updated and tagged `[inferred]`. No overclaim of XML-backed save support or auth middleware found (checked explicitly — see Findings). Two accuracy issues found, see Findings 1-2. |
| Provenance clean — no `[verified]` written by an agent | ✅ | `grep -n "\[verified\]" ai/analysis/FEATURE_CATALOG.md ai/analysis/audit-reports/DEFECT_TRACEABILITY.md ai/guide/FEATURE_MAP.md ai/lab/ROADMAP.md ai/lab/WORKLOG.md` → all touched rows remain `[inferred]`; nothing flipped. |
| Scope discipline — ADV-03/ADV-05 and unrelated modules untouched | ✅ | `git diff e4d80c1 ce5c3c8 --stat` touches only the 7 files listed above. `shared/validation-rules/aasd-*` and `server/routes.ts` do not appear in the diff. |

`BLOCKED-ENV: node install.mjs verify . --strict` — no `install.mjs` exists anywhere in
this repo (`find … -iname "*install*"` finds only `ai/install-manifest.json`), and
`npx --no-install install.mjs verify . --strict` 404s against the npm registry — the
kit's verify CLI was never vendored into this checkout. **Compensating evidence:**
manually resolved every backtick-quoted file path referenced in the four touched `ai/`
docs against the tree (all 14 checked paths exist — see command output captured during
review); ran the full test suite, typecheck, and build directly (all green, below).
Per the review template, this caps the verdict at approve-with-notes regardless of
other findings.

### Test / build / typecheck results (run directly, not trusted from any prior report)
- `npx vitest run --config tests/setup/vitest.config.ts tests/integration/aasx-package-roundtrip.test.ts` → **5 passed / 5** (the 3 pre-existing tests plus the 2 new ones: "add submodel -> save -> download -> reopen includes the new submodel", "delete element -> save -> download -> reopen no longer contains it").
- `npm test` (full suite) → **762 passed / 762**, **53 test files passed / 53**, 0 failed.
- `npm run check` (`tsc`) → exit 0, no diagnostics.
- `npm run build` (`node scripts/build.mjs`) → exit 0; only pre-existing, unrelated warnings (stale browserslist data, one dynamic/static import overlap in `client/src/features/auth`, a >500kB chunk-size notice) — none touch the reviewed files.

## Findings
| # | Severity | File | Finding | Resolution |
|---|---|---|---|---|
| 1 | major | `ai/lab/ROADMAP.md:43` | The `F01` row marks the **entire** F01 spec `Shipped` on 2026-07-15. This review's authorizing scope was explicitly narrowed to ADV-02 (§4.2 of the spec), not full F01 acceptance. The spec's own definition-of-done (§6-7) requires T6 "C# differential package manifest" tests against `tests/fixtures/f01-package-parity/` — that directory does not exist (`ls tests/fixtures/f01-package-parity` → not found; `grep -rl "f01-package-parity" **/*.ts` → no matches) — and acceptance criterion #2 (`node install.mjs verify . --strict` exits zero) cannot even execute in this repo (see BLOCKED-ENV above). Marking full F01 "Shipped" is not substantiated by what was actually verified; only the ADV-02 closure (this diff) and `e4d80c1`'s earlier fixes are. | not fixed — flagged for the implementer/human to either scope the row down to what was verified or complete T6 before asserting "Shipped" |
| 2 | minor | `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md:11` | The ADV-2026-07-14-02 row credits the remaining 5-route fix to "`ai/lab/WORKLOG.md` row `W-015`". The actual ledger row for this change is `W-016` (`W-015` was already claimed by an earlier session's retroactive log entry for `e4d80c1`, covering ADV-01/ADV-04 and only the first two ADV-02 routes — see `ai/lab/WORKLOG.md:52-53`). The citation points at the wrong row. | not fixed — one-line citation correction (`W-015` → `W-016`) recommended |
| 3 | minor | `ai/lab/WORKLOG.md:53` | Row `W-016`'s "Commits / PR" column reads "uncommitted (working tree)". That became stale mid-review: the change is now commit `ce5c3c8` (see Scope reviewed). Not a defect in the original change (the commit landed *during* this review), but worth updating so the ledger reflects reality. | not fixed — recommend updating the Commits column to `ce5c3c8` |
| 4 | nit | — | `node install.mjs verify . --strict`, mandated by `CLAUDE.md`/`AGENTS.md` rule 9 as the pre-completion path-integrity check, is unreachable in this checkout (no `install.mjs`, no published npm package by that name). This is a repo-tooling gap that predates this change, not something introduced by it, but every future review will hit the same BLOCKED-ENV until it's fixed or the instruction is corrected to name the actual available tool. | not fixed — outside this change's scope, flagged for awareness |

No correctness, error-handling, or missed-spot findings survived review — the code
change itself (the actual subject of ADV-02) is sound.

## What the human should double-check
1. **Verdict rationale for Finding 1:** I treated the ROADMAP "Shipped" overclaim as
   `major` (a real, checkable overstatement of what's verified) but did not let it push
   the verdict to `request-changes`, because it is a documentation-only issue that does
   not affect the correctness of the shipped code, and the task explicitly scoped this
   review to ADV-02 rather than full F01 acceptance. If your standard is stricter (any
   `major` ⇒ `request-changes`), downgrade this verdict accordingly — that's a judgment
   call, not a mechanical one.
2. **The mid-review commit (`ce5c3c8`):** confirm this doesn't indicate two agents (an
   "implementer" and this "reviewer") were operating on the same working tree
   concurrently in a way that could race on other files. I found no evidence of that
   beyond the one commit, and the content I reviewed did not change under me, but it's
   worth confirming the process boundary that produced this.
3. **Whether to complete T6 now or defer it:** the C# differential package-fixture
   tests were part of the original F01 spec's touch list and never landed (neither in
   `e4d80c1` nor here). Decide whether that's tracked as a separate follow-up (and the
   ROADMAP/spec status reflects "in progress" until then) or whether it's being
   deliberately descoped from F01's definition of done.
