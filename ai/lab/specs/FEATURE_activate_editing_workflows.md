<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# FEATURE: Activate editing workflow coverage `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** The user's request to finish the pending translation and
> repair the codebase end to end.

## Goal
Turn the disabled property-editing and undo/redo workflow suites into active
integration coverage, repairing implementation defects exposed by those tests.

## Scope
- Activate all property editing and undo/redo workflow assertions.
- Correct stale test module boundaries so mocks target the production services.
- Make only surgical component/service changes required by the active contracts.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `tests/integration/ui/property-editing-flow.test.tsx` | ours | Activate property workflow coverage |
| `tests/integration/ui/undo-redo-flow.test.tsx` | ours | Activate undo/redo coverage |
| `client/src/features/aas-explorer/` | ours | Only fixes proven by activated tests |
| `ai/guide/FEATURE_MAP.md` | n/a (docs) | Record active integration coverage |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required ledger row |

## Acceptance
1. All 21 formerly suite-skipped workflow tests are active; no assertion remains
   skipped without a documented external blocker.
2. Focused workflow tests, `npm run check`, and `npm test` are green.
3. No directory moves or unrelated UI changes.

## Knowledge update on completion
- [x] `FEATURE_MAP.md` records the active editing workflow coverage
- [x] `FEATURE_CATALOG.md` records the current source/test wiring
- [x] `ROADMAP.md` links this feature while fresh-context review is pending
- [x] `WORKLOG.md` row appended (type `feature`, linking this doc + review)
