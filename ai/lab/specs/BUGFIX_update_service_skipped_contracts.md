<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Update-service skipped contracts `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** Included in the user's request to repair all pending
> codebase failures and complete the translation.

## Symptom
The only two service assertions still disabled cover a successful
MultiLanguageProperty update and restoring the latest backup. The restore method
constructs a new timestamped filename, which cannot identify an existing backup.

## Expected
Valid language arrays persist, and restore selects the newest existing backup for
the requested file while reporting a clear error when none exists.

## Reproduction
Activate the two assertions in
`tests/unit/server/services/update-service.test.ts` and run that file.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `server/src/services/update-service.ts` | ours | Select and restore the newest matching backup |
| `shared/aas-validation-engine.ts` | stable | Do not recurse into MultiLanguageProperty language arrays as submodel elements |
| `tests/unit/server/services/update-service.test.ts` | ours | Activate both permanent regressions |
| `ai/guide/FEATURE_MAP.md` | n/a (docs) | Record the restore contract |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required ledger row |

## Acceptance
1. Both formerly skipped assertions pass and no tests remain skipped.
2. The full update-service suite and `npm test` are green.

## Knowledge update on completion
- [x] `FEATURE_MAP.md` records the latest-backup restore contract
- [x] `FEATURE_CATALOG.md` records the active update-service coverage
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
