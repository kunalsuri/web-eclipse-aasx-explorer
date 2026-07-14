<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Restore create-admin command `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** Included in the user's request to repair documented pending
> failures and make repository commands executable.

## Symptom
**Observed:** `npm run create-admin` fails with `ERR_MODULE_NOT_FOUND` because
`scripts/create-admin-user.ts` does not exist.

**Expected:** The command validates administrator details, hashes the password,
rejects duplicate usernames/emails, persists the user through the repository's
storage abstraction, and assigns the `admin` role.

## Reproduction — no fix before this exists and fails
1. Run `npm run create-admin` and observe the missing-module error.
2. Permanent regression: import the script API with an in-memory storage double
   and require a hashed, persisted administrator.

- Failing test: `tests/unit/scripts/create-admin-user.test.ts`.

## Root cause
The package script survived a prior migration, but its TypeScript implementation
was never carried into this repository.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `scripts/create-admin-user.ts` | ours | Restore a testable environment-driven CLI |
| `tests/unit/scripts/create-admin-user.test.ts` | ours | Cover success and duplicate rejection |
| `ai/guide/MODULE_MAP.md` | n/a (docs) | Replace the broken-reference warning |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required bugfix ledger row |

## Acceptance
1. The regression passes.
2. An invocation without required environment variables fails with actionable
   usage text and does not alter `data/users.json`.
3. `npm run check`, `npm test`, and `npm run build` remain green.

## Knowledge update on completion
- [x] `MODULE_MAP.md` script entry updated
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
- [x] EVAL not required; the command contract is captured in the maps and tests
