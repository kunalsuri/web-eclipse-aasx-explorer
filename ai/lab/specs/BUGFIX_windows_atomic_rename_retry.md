<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Windows atomic rename retry `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** Included in the user's explicit request to repair every
> currently failing codebase blocker and make the application reliably runnable.

## Symptom
**Observed:** A full `npm test` run intermittently fails in
`ElementManager > Performance > should reorder elements in < 200ms` with Windows
`EPERM` while renaming a completed temporary JSON file over the destination. The
same test passes immediately in isolation.

**Expected:** A brief Windows file-system lock does not make an otherwise complete
atomic write fail. Persistent or unrelated file-system errors still surface.

## Reproduction — no fix before this exists and fails
1. Full-suite evidence: run `npm test` and observe `fs.rename` fail with `EPERM`
   from `server/src/services/atomic-file-writer.ts:28`.
2. Permanent deterministic regression: mock the first `fs.rename` call to throw
   `EPERM`, allow the second call to use the real file system, and require the write
   to complete with the requested content.

- Failing test: `tests/unit/server/services/atomic-file-writer.test.ts`.

## Root cause
`AtomicFileWriter.writeFile` attempts its atomic rename exactly once. Windows can
temporarily deny replacement while a scanner, indexer, or reader holds the target;
Node reports this as `EPERM`. The temp file remains valid and can be renamed safely
after a short delay, but the implementation deletes it and fails immediately.

## Touch list (from MODULE_MAP / FEATURE_MAP gotchas)
| Location | Stability | Change |
|---|---|---|
| `server/src/services/atomic-file-writer.ts` | stable | Retry only transient rename errors with a bounded delay |
| `tests/unit/server/services/atomic-file-writer.test.ts` | ours | Deterministic transient-`EPERM` regression |
| `ai/guide/FEATURE_MAP.md` | n/a (docs) | Record the Windows atomic-write gotcha |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required bugfix ledger row |

The stable persistence helper change is explicitly authorized above.

## Fix sketch
Keep the same temp-file-and-rename algorithm. Retry `EPERM`, `EBUSY`, and
`ENOTEMPTY` a small fixed number of times with short exponential backoff. Do not
unlink the destination or weaken atomic replacement. Preserve existing cleanup and
error propagation after retries are exhausted.

## Acceptance
1. The injected one-time `EPERM` test fails before the fix and passes afterward.
2. The existing element/update service suites remain green.
3. `npm run check`, `npm test`, and `npm run build` are green.

## Knowledge update on completion
- [x] `FEATURE_MAP.md` gotcha line added
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
- [x] EVAL not required; the durable trap is captured in the feature map
