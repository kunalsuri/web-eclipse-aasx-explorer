<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Production build/start contract `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** Included in the user's request to make the codebase build
> and run end to end.

## Symptom
**Observed:** `npm run build` builds only the browser application, while
`npm start` tries to execute the nonexistent `dist/index.js`. A leftover
`dist/server.js` can hide the missing server-build step on a developer machine.

**Expected:** A clean production build creates both the browser assets and the
server bundle, and `npm start` launches the server artifact produced by that
build.

## Reproduction — no fix before this exists and fails
1. Run `npm start` after the current build.
2. Observe `MODULE_NOT_FOUND` for `dist/index.js`.
3. Regression: assert that the declared build runner produces the same server
   path consumed by the start script.

- Failing test: `tests/unit/config/production-scripts.test.ts`.

## Root cause
The setup helper scripts contain an esbuild server-bundle step targeting
`dist/server.js`, but the package-level `build` script never invokes it and the
package-level `start` script names a different artifact. Once those paths are
aligned, bundling also exposes a circular dependency: the session manager imports
the server entry point only to read its startup timestamp. Esbuild must then emit
an asynchronous entry initializer inside a synchronous module initializer, which
is invalid JavaScript.
The inherited recipe also bundles CommonJS dependencies such as `exceljs` into
ESM, leaving runtime-only dynamic `require()` calls that Node rejects. Production
dependencies must remain external and load from `node_modules`.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `package.json` | stable | Surgically point build/start at one production contract |
| `scripts/build.mjs` | ours | Build client and server from one cross-platform entry point |
| `server/index.ts` | stable | Stop exporting session-only startup state |
| `server/auth/session-manager.ts` | stable | Own its startup timestamp and remove the entry-point cycle |
| `tests/unit/config/production-scripts.test.ts` | ours | Lock the artifact contract |
| `ai/guide/MODULE_MAP.md` | n/a (docs) | Record the production build entry point |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required bugfix ledger row |

The stable package-script correction is explicitly authorized above.

## Acceptance
1. The regression passes.
2. `npm run build` creates `dist/public/index.html` and `dist/server.js` from a
   clean `dist` directory.
3. `npm start` launches the production server and serves an HTTP response.
4. `npm run check` and `npm test` remain green.

## Knowledge update on completion
- [x] `MODULE_MAP.md` build entry updated
- [x] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
- [x] EVAL not required; the production boundary is captured in the feature map
