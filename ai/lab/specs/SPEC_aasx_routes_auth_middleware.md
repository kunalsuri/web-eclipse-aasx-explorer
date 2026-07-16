<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# SPEC: AASX route authentication
> **Status:** draft
> **Author:** AI draft · **Date:** 2026-07-16 · **Revision:** 1

This spec is written to be implemented **without further design decisions**.
Read the whole spec before writing code. Where the implementer is tempted to
improvise, the spec says what to do instead.

## 1. Goal
Every route in `server/aasx-routes.ts` — package create/upload/parse, environment
read/mutate, validation, search, submodel/element CRUD, export/import — is
currently reachable by any unauthenticated caller. This has been noted
repeatedly in the knowledge docs (`ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`,
this spec's origin) but never scoped as work. After this ships, every AASX
route requires a valid JWT access token, matching the protection level
`server/profile.ts` already applies to profile routes. Invariant: anonymous
requests to any `/api/aasx/*` route receive `401` and touch no package data or
files on disk.

## 2. Hard constraints (violating any of these fails the review)
| # | Constraint |
|---|---|
| C1 | Zero new runtime dependencies — `validateAccessToken` already exists in `server/auth/auth-middleware.ts` and is proven in `server/profile.ts`. |
| C2 | Do not modify `server/auth/auth-middleware.ts`, `server/auth/jwt-utils.ts`, or `server/auth/session-manager.ts` — import their exports, do not reimplement or extend auth primitives as part of this change. |
| C3 | Match the license-header practice of neighboring files (none currently in `server/aasx-routes.ts`; add none). |
| C4 | Surgical diffs: touch only the files in §5; no reformatting of untouched code, no route reordering, no behavior change beyond the auth gate. |
| C5 | Do not add CSRF protection (`validateCSRF`/`protectedRoute`) in this pass — `server/profile.ts`'s mutation routes (PUT/POST/DELETE) use `validateAccessToken` alone, not `protectedRoute`; match that existing precedent rather than introducing a stricter standard unilaterally. Note as a follow-up in §3 Out. |

## 3. Scope & glossary
**In:** add `validateAccessToken` (imported from `server/auth/auth-middleware.ts`,
the same import `server/profile.ts:6` uses) as a per-route middleware argument
to all 37 handlers currently registered in `server/aasx-routes.ts`, listed
verbatim in §5.

**Out (explicitly — do NOT build now):**
- CSRF protection (`validateCSRF`/`protectedRoute`) — see C5.
- Role-based restriction (`requireRole`/`requireAdmin`) — no requirement found that any AASX route needs elevated privilege over a logged-in user.
- Per-package ownership/authorization checks (i.e., verifying the authenticated user owns/may access a given package `:id`) — today's `FileMetadata` model has no owner field; adding one is a separate, larger data-model change.
- Any change to how the client attaches the bearer token — `client/src/api/` hooks already send it for other authenticated endpoints; verify during T1–T3 that AASX API calls do too, but do not add new client plumbing beyond what's needed to keep the existing UI working end-to-end.

Terms:
- **`validateAccessToken`** — the middleware at `server/auth/auth-middleware.ts:20`. On success it sets `req.jwtUser`/`req.sessionId` and calls `next()`; on failure it sends `401` with `{ message, code: 'MISSING_TOKEN' | 'INVALID_TOKEN' }` and does **not** call `next()` — the route handler body never executes for unauthenticated requests.

## 4. Behaviour (exact)
For each of the 37 route registrations below, insert `validateAccessToken` as
the middleware immediately after the path string and before any other
middleware already present (e.g. `upload.single("file")`), matching the
argument order Express expects: `router.<method>(path, validateAccessToken, ...existingMiddleware, handler)`.

Add the import at the top of `server/aasx-routes.ts`:
```ts
import { validateAccessToken } from "./auth/auth-middleware";
```

No other code in any handler body changes. No response shape, status code (other
than the new `401` for unauthenticated calls), or business logic changes.

## 5. Touch list (complete — nothing else changes)
| Layer | Location | Stability (from MODULE_MAP) | Change |
|---|---|---|---|
| backend | `server/aasx-routes.ts` | `stable` | Add `validateAccessToken` import; add it as middleware to all 37 routes below |
| tests | `tests/integration/` (new or existing AASX route test file) | `ours` | Add T1–T3 from §6 |
| docs | `ai/guide/FEATURE_MAP.md` | `[inferred]`, editable | Update the AASX-related feature rows to note routes now require auth |
| docs | `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` | `[inferred]`, editable | Close/trace this item once implemented |

Stability check: no `frozen` or `?` files touched — `server/aasx-routes.ts` is
`stable` (works; change carefully and with tests, per `ai/guide/MODULE_MAP.md`).

Routes to gate (method, path, line as of this spec's writing — re-verify line
numbers before editing, the file may have shifted):
1. `POST /new` (`:18`)
2. `POST /upload` (`:179`, keep `upload.single("file")` after the auth middleware)
3. `POST /parse/:id` (`:226`)
4. `GET /environment/:id` (`:279`)
5. `GET /files` (`:303`)
6. `GET /files/:id` (`:320`)
7. `GET /download/:id` (`:344`)
8. `DELETE /files/:id` (`:363`)
9. `PATCH /environment/:id/property` (`:395`)
10. `PUT /environment/:id` (`:452`)
11. `POST /:id/validate` (`:477`)
12. `GET /:id/validation` (`:523`)
13. `GET /:id/validation-report` (`:542`)
14. `GET /validation/presets` (`:624`)
15. `GET /validation/rules` (`:636`)
16. `POST /validation/presets` (`:648`)
17. `GET /validation/presets/:id` (`:673`)
18. `DELETE /validation/presets/:id` (`:693`)
19. `GET /validation/presets/custom/list` (`:716`)
20. `POST /:id/search/index` (`:734`)
21. `POST /:id/search` (`:761`)
22. `GET /:id/search/status` (`:800`)
23. `DELETE /:id/search/index` (`:820`)
24. `POST /:id/search/by-value` (`:838`)
25. `POST /:id/search/by-id` (`:874`)
26. `POST /:id/search/by-semantic-id` (`:910`)
27. `POST /:id/search/by-description` (`:946`)
28. `POST /:id/submodel` (`:986`)
29. `POST /:id/submodel/:submodelId/element` (`:1018`)
30. `DELETE /:id/submodel/:submodelId` (`:1057`)
31. `DELETE /:id/submodel/:submodelId/element/:elementIdShort` (`:1091`)
32. `POST /:id/element/duplicate` (`:1132`)
33. `GET /:id/export/json` (`:1183`)
34. `GET /:id/export/csv` (`:1206`)
35. `GET /:id/export/metadata` (`:1232`)
36. `GET /:id/export/excel` (`:1259`)
37. `GET /:id/submodel/:submodelId/export/csv` (`:1285`)
38. `POST /:id/import/excel` (`:1317`, keep `upload.single('file')` after the auth middleware)

(Listed as 38 — the original count of 37 in §1 undercounted; use this list, not
the summary count, as the source of truth.)

## 6. Test plan (numbered — the implementer implements every row)
Harness: Vitest/Supertest integration style already used under
`tests/integration/` (see `tests/integration/aasx-package-roundtrip.test.ts`
for the existing request-building convention against this router).
| # | Test | Assertion |
|---|---|---|
| T1 | Unauthenticated request to a representative sample covering each HTTP method (`GET /files`, `POST /new`, `PUT /environment/:id`, `PATCH /environment/:id/property`, `DELETE /files/:id`) with no `Authorization` header | Each responds `401` with `code: 'MISSING_TOKEN'`; no file is created/mutated/deleted as a side effect |
| T2 | Same sample with an expired/malformed bearer token | Each responds `401` with `code: 'INVALID_TOKEN'` |
| T3 | Same sample with a valid access token (mint one via the existing test auth helper, if `tests/integration/` has one — otherwise via `server/auth/jwt-utils.ts`'s token-issuing function directly) | Each responds with its normal pre-existing status code and behaves exactly as before this change |
| T4 | Full existing `npm test` suite | No regressions — anything currently green stays green |

## 7. Acceptance criteria (definition of done)
1. All §2 constraints hold; the diff matches §5's route list exactly (38 routes gated, nothing else touched).
2. `npm test` green including T1–T4; `node install.mjs verify . --strict` passes.
3. T1 is the contract-critical test — if an unauthenticated request to any route in §5 does not receive `401`, the whole change has failed regardless of what else passes.

## 8. Knowledge update on completion (part of the change, not an afterthought)
- [ ] `ai/guide/FEATURE_MAP.md` AASX-related rows updated to note auth is now required
- [ ] `ai/analysis/FEATURE_CATALOG.md` amended if it documents AASX routes as unauthenticated
- [ ] `ai/guide/MODULE_MAP.md` row for `server/aasx-routes.ts` still accurate (no stability change expected)
- [ ] `ai/lab/WORKLOG.md` row appended linking this spec, the review, and the commit(s)
- [ ] `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` — add or update the row tracking this item, status `FIXED`
- [ ] This spec's Status → `implemented` (the human flips it after audit)
