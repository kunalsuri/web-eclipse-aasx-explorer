<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Reference-suggestion environment loading `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** Included in the user's request to repair pending reachable
> functionality and finish the translation.

## Symptom
The mounted reference-suggestion routes read an `environment` property that no
middleware sets, so every lookup returns HTTP 500. A second legacy router contains
an explicit `getEnvironmentFromStorage not implemented` throw.

## Expected
Reference requests identify the parsed AASX environment with `fileId`; the server
loads `data/aasx/<fileId>-environment.json`, rejects unsafe IDs, and distinguishes
missing input from a missing environment.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `server/src/api/reference-suggestion-routes.ts` | ours | Load and validate the requested environment |
| `server/src/api/reference-routes.ts` | ours | Reuse the same loader instead of throwing |
| `tests/unit/server/api/reference-suggestion-routes.test.ts` | ours | Permanent loader regressions |
| `ai/analysis/FEATURE_CATALOG.md` | n/a (docs) | Record the concrete fileId contract |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the ledger row |

## Acceptance
1. Valid IDs load their environment; missing/unsafe IDs and absent files report
   actionable 400/404 errors.
2. No reference route contains a not-implemented environment loader.
3. Focused tests, typecheck, full tests, and production build pass.

## Knowledge update on completion
- [x] `FEATURE_MAP.md` records the required `fileId` environment contract
- [x] `FEATURE_CATALOG.md` records the mounted route's current wiring
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
