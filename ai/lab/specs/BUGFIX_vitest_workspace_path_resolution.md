<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Vitest workspace path resolution `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** The user explicitly requested an end-to-end codebase repair on
> 2026-07-14 and asked that pending failures be fixed as soon as possible.

## Symptom
**Observed:** `npm test` reports 32 failed suites and zero collected tests. Every
suite fails while loading setup with
`ERR_MODULE_NOT_FOUND: Cannot find module '/@fs/C:/Users/kunal/Documents/GitHub/web-eclipse-aasx-explorer/tests/setup/global-setup.ts'`.

**Expected:** `npm test` resolves setup files and source aliases inside the active
workspace, then collects and executes the repository's Vitest suites regardless of
whether the checkout is reached through its canonical path or a sandbox mapping.

## Reproduction — no fix before this exists and fails
1. Run `npm test` from the repository root in the Codex workspace sandbox.
2. Observe that Vitest starts under `C:/Users/CodexSandboxOffline/.codex/.sandbox/cwd/...`.
3. Observe all 32 test files fail before collection because setup is imported from
   the canonical host path through a Vite `/@fs/` URL.

- Failing regression entry point: `package.json` script `test`, configured by
  `tests/setup/vitest.config.ts`. This command is permanent and must execute the
  complete suite after the repair.

## Root cause
`tests/setup/vitest.config.ts` contains path-bearing configuration resolved partly
from the config module's canonical location. In a mapped/sandboxed workspace, that
location differs from the runner's current workspace. Vite therefore generates
host-path `/@fs/` imports which the sandboxed Node process cannot load.

## Touch list (from MODULE_MAP / FEATURE_MAP gotchas)
| Location | Stability | Change |
|---|---|---|
| `tests/setup/vitest.config.ts` | ours | Anchor setup files and aliases to the active workspace root |
| `ai/guide/FEATURE_MAP.md` | n/a (docs) | Record the path-portability gotcha |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required bugfix ledger row |

No `frozen` or `?` source module is touched.

## Fix sketch
Capture `process.cwd()` as the repository root when Vitest loads the config. Resolve
both `setupFiles` and aliases from that root so every generated import stays in the
same workspace namespace as the executing test process. Do not change worker,
coverage, environment, or suite-selection behavior.

## Acceptance
1. The pre-fix `npm test` reproduction fails before test collection; after the fix,
   setup loads and the repository test files execute.
2. `npm run check`, `npm test`, and `npm run build` are green.
3. `node install.mjs verify . --strict`, or the repository's available equivalent,
   reports no broken AI-knowledge paths.

## Knowledge update on completion
- [x] `MODULE_MAP.md` test-path note added
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
- [x] EVAL not required; the durable trap is captured in the module map
