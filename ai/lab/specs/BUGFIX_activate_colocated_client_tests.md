<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Activate colocated client tests `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** Included in the user's request to repair pending failures
> and establish an accurate runnable baseline.

## Symptom
The default Vitest include pattern collects only `tests/**`, silently excluding
15 client suites under `client/src/**/__tests__`. An explicit diagnostic run of
those suites exposed two failures: `PropertyValueEditor` does not validate an
invalid initial boolean or fractional integer until the user changes or saves it.

## Expected
The default test command collects both centralized and colocated suites, and the
editor shows the declared type's validation error as soon as an invalid property
is loaded.

## Reproduction
Run the colocated suites with the same Vitest setup. Before the fix, 143 tests
pass and the two initial-value validation assertions fail.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `tests/setup/vitest.config.ts` | stable test gate | Include colocated client suites in the default command |
| `client/src/features/aasx-editor/components/property-editors/PropertyValueEditor.tsx` | ours | Validate whenever the input property changes |
| `client/src/features/aasx-editor/components/property-editors/__tests__/PropertyValueEditor.test.tsx` | ours | Existing permanent regressions become part of the gate |
| `ai/analysis/FEATURE_CATALOG.md` | n/a (docs) | Record the complete test layout |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the ledger row |

## Acceptance
1. Both formerly excluded validation assertions pass.
2. `npm test` collects all centralized and colocated suites with zero failures
   and zero skips.
3. `npm run check` and `npm run build` remain green.

## Knowledge update on completion
- [x] `FEATURE_CATALOG.md` records the complete default-suite layout
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
