<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# REVIEW: W-018 — Partially fix ADV-05: mount the safe orphaned routers
> **Date:** 2026-07-16 · **Spec:** `ai/lab/specs/BUGFIX_mount_safe_orphaned_routers.md` · **Ledger row:** W-018
> **Reviewer:** agent, fresh session (did not write the change) — spawned solely to review `e16a55c`
> **Verdict:** approve-with-notes

## Scope reviewed
Commit `e16a55c` ("Partially fix ADV-05: mount the safe orphaned routers") on branch
`claude/codebase-context-review-toog73`, parent `2c2f396`. Full diff obtained via
`git diff 2c2f396..e16a55c`. Files touched: `server/routes.ts`, `client/src/App.tsx`,
`client/src/features/app-shell/config/navigation.ts`,
`client/src/pages/plugin-manager-page.tsx` (new), `ai/analysis/FEATURE_CATALOG.md`,
`ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`, `ai/guide/FEATURE_MAP.md`,
`ai/guide/MODULE_MAP.md`, `ai/lab/WORKLOG.md`,
`ai/lab/specs/BUGFIX_mount_safe_orphaned_routers.md` (new). Authorizing doc:
`ai/lab/specs/BUGFIX_mount_safe_orphaned_routers.md`, addressing
ADV-2026-07-14-05 in `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md`.

## Checks — evidence, not assertions
| Check | Result | Evidence |
|---|---|---|
| Spec conformance — every acceptance criterion met | ✅ | Acceptance #1 (`GET /api/plugins` → `200 {"plugins":[]}`) and #2 (`POST /api/xml/export` with empty environment → `200` XML) reproduced live below. #3 (`/plugins` reachable) confirmed by reading `client/src/App.tsx:106` and `client/src/pages/plugin-manager-page.tsx`. #4 (`api/aasx/update.ts`/`reference-routes.ts` unreachable) reproduced live below with three router-specific paths. #5 (`npm run check`/`npm test`/`npm run build` green, 762/762) reproduced myself below. #6 (this review) — in progress. |
| Surgical diff — every hunk traces to the spec | ✅ | `git diff 2c2f396..e16a55c --numstat` shows only the 10 files in the touch list; `server/routes.ts` diff (`git diff … -- server/routes.ts`) is exactly 2 new imports, 2 new `app.use`, and a comment block — no edits to the 5 pre-existing mounts (`aasxRoutes`, `clipboardRoutes`, `dictionaryRoutes`, `deleteRoutes`, `referenceSuggestionRoutes`), confirmed by reading the full pre/post `server/routes.ts`. |
| Stability respected — no `frozen`/`?` files touched without recorded approval | ✅ | `server/routes.ts` is `stable` in `ai/guide/MODULE_MAP.md:40` ("works; change carefully and with tests" — editable, not frozen). `client/src/App.tsx` and `navigation.ts` are `ours`/active-dev surfaces per the same map. No `frozen`/`?` rows touched. |
| Tests — new behavior covered; suites green | ✅ | `npm test` → **762/762 passed, 53/53 files**, run myself (see below). No new automated test was added for the two new mounts, but the spec's acceptance criteria rely on live-server verification instead, which I independently reproduced with curl. |
| Conventions & license headers match neighbors | ✅ | `plugin-manager-page.tsx` matches `dictionary-browser-page.tsx`'s `AppLayout` + feature-component wrapper pattern exactly (both plain `export function ...Page()`, no license header — neighboring pages in `client/src/pages/` carry none either). |
| Knowledge updated — maps/catalog amended, tagged `[inferred]` | ✅ (with one factual-accuracy defect, see Finding 1) | `FEATURE_CATALOG.md`, `FEATURE_MAP.md`, `MODULE_MAP.md`, `DEFECT_TRACEABILITY.md`, `WORKLOG.md` all amended and all new/edited claims retain `[inferred]`. |
| Provenance clean — no `[verified]` written by an agent | ✅ | `git diff 2c2f396..e16a55c \| grep 'verified\]'` → no output. All `-`/`+` lines touching a provenance tag stay `[inferred]` (checked line-by-line). |

`node install.mjs verify . --strict` (CLAUDE.md/AGENTS.md rule 9): `BLOCKED-ENV: no
install.mjs anywhere in this checkout` (`node install.mjs verify . --strict` →
`Cannot find module '/home/user/web-eclipse-aasx-explorer/install.mjs'`). This is the
same pre-existing, already-documented gap flagged in `ai/lab/reviews/REVIEW_W-015.md`
finding 4 and `ai/lab/reviews/REVIEW_W-017.md` finding 4 — not introduced by this
change. **Compensating evidence:** ran `npm run check`, `npm test`, `npm run build`
myself (results below), plus manually confirmed every backtick-quoted path this diff
added or relies on actually exists on disk (`server/src/api/plugin-routes.ts`,
`server/src/api/xml-routes.ts`, `server/src/api/aasx/update.ts`,
`server/src/api/reference-routes.ts`, `server/src/api/idta-templates-routes.ts`,
`server/src/services/element-manager.ts`, `server/src/services/update-service.ts`,
`client/src/pages/plugin-manager-page.tsx`, `client/src/features/plugin-manager/index.tsx`,
`client/src/features/app-shell/index.ts`). Per the review template, BLOCKED-ENV caps
the verdict at approve-with-notes regardless of other findings.

### Independent verification of the 2 mounted routers (safe)
- **`server/src/api/xml-routes.ts`** (full read): all three handlers
  (`POST /export`, `POST /import`, `POST /validate`) take input only from `req.body`
  and write only to `res`. Its imports — `xml-serialization-service.ts` (→
  `xml-element-serializer.ts`), `xml-deserialization-service.ts`,
  `xml-schema-validator.ts` — were grepped for `fs\.|readFile|writeFile|AtomicFileWriter`:
  zero real hits (one grep hit on `xml-schema-validator.ts` was a false positive,
  `refs.reference` containing the substring `fs.`). Router mounted at `/api/xml` with
  `router.post('/export', …)` etc. → `POST /api/xml/export` resolves correctly.
- **`server/src/api/plugin-routes.ts`** (full read): every handler only calls
  `pluginRegistry.*`/`pluginLoader.*`. `pluginLoader.ts` does touch the filesystem
  (`fs.readdir`/`fs.readFile` on manifests) but only under
  `path.join(process.cwd(), "plugins")` — confirmed via grep — never `data/aasx/` and
  never `AasxPackageService`. Router mounted at `/api/plugins` with
  `router.get("/", …)` → `GET /api/plugins` resolves correctly (not `/api/plugins/`
  only).
- Independently confirmed `pluginLoader.loadAll()` (`server/src/services/plugin-loader.ts:257`)
  is defined but has zero callers anywhere else in the codebase (`grep -rn loadAll
  **/*.ts` → only the definition) — the "registry is always empty at runtime" claim
  holds.

### Independent verification of the 3 unmounted routers
- **`server/src/api/aasx/update.ts` / `element-manager.ts` / `update-service.ts`**:
  read all three files in full. Both services' `saveEnvironment()` write only
  `path.join(dataDir, '${fileId}-environment.json')` via `AtomicFileWriter.writeFile`
  and never import `aasx-package-service.ts` or `shared/aasx-package.ts` — confirmed
  by grep (`fs\.|AtomicFileWriter|aasx-package|AasxPackageService` → only the JSON
  sidecar writes). By contrast, the already-mounted `server/aasx-routes.ts` (its
  `PATCH /environment/:id/property` etc.) does call `AasxPackageService.save`/`.create`/`.import`
  (confirmed via grep, 3 call sites) — i.e. there genuinely is a "real", already-fixed
  path that repacks the `.aasx`, and `api/aasx/update.ts` is a second, functionally
  parallel surface (different path shape: `/:id/property` vs.
  `/environment/:id/property`, but same fileId-keyed persistence target) that would
  bypass it. The danger claim holds.
- **`server/src/api/idta-templates-routes.ts`**: read in full — all 6 handlers are
  literally `res.status(501).json({ error: 'Not implemented' })`. Claim holds exactly.
- **`server/src/api/reference-routes.ts`**: read in full, **claim does not hold as
  stated** — see Finding 1 below. The router is genuinely redundant with
  `reference-suggestion-routes.ts` (same service, overlapping GET
  `/suggestions`/`/:id` shape at a different base path), so leaving it unmounted is
  still a defensible choice, but the *reason* given ("stale
  `// TODO: implement based on your storage` stub") is factually wrong for the
  current code and was written as fact into three permanent docs.

### `server/routes.ts` mount correctness
Both new imports are default-export imports matching each router's
`export default router;`. `app.use('/api/plugins', pluginRoutes)` +
`router.get("/", …)` → `GET /api/plugins` works (not `/api/plugins/`-only, verified
live). `app.use('/api/xml', xmlRoutes)` + `router.post('/export', …)` →
`POST /api/xml/export` works (verified live).

### Client wiring correctness
`client/src/pages/plugin-manager-page.tsx` imports `AppLayout` from
`@/features/app-shell` (re-exported at `client/src/features/app-shell/index.ts:1`)
and `PluginManager` from `@/features/plugin-manager`
(`client/src/features/plugin-manager/index.tsx` exports `PluginManager`, confirmed
by reading the file — it also independently confirms the new mount by calling
`fetch("/api/plugins")`). `client/src/App.tsx` adds
`<ProtectedRoute path="/plugins" component={PluginManagerPage} />` — grepped every
`ProtectedRoute path=` in the file, no collision with the new `/plugins` path, and it
sits in the same list/pattern as sibling routes (`/dictionary`, `/aas-viewer`, etc.).
`navigation.ts` adds a `Puzzle`-icon nav entry pointing at `/plugins`, matching the
existing entry shape.

## Live verification (personally run)
Started `NODE_ENV=development npx tsx server/index.ts` in the background, waited 8s
(`11:59:43 PM [express] serving on port 5000`), then:

```
GET  /api/plugins            -> 200, application/json, {"plugins":[]}
POST /api/xml/export {}env   -> 200, application/xml, valid <environment> XML
PATCH /api/aasx/testid/multi-language -> 200, text/html (Vite SPA fallback)
GET  /api/references/suggestions      -> 200, text/html (Vite SPA fallback)
GET  /api/idta-templates/list         -> 200, text/html (Vite SPA fallback)
```
The three fallback checks used paths unique to each unmounted router's own route
table (not paths any mounted router — `aasx-routes.ts` or
`reference-suggestion-routes.ts` — legitimately serves), so a 200-HTML result there
specifically demonstrates *those routers'* handlers are not wired, not just "some
route somewhere returns HTML." Server killed after (`pkill -f "tsx server/index.ts"`,
confirmed no process remains).

## Suites (personally run, not trusted from the spec doc)
- `npm run check` → exit 0, no diagnostics.
- `npm test` → **762 passed / 762, 53 test files passed / 53**, 0 failed. Matches the
  spec's claimed count exactly.
- `npm run build` → exit 0; client + server bundles built. Only pre-existing warnings
  (stale browserslist data, one dynamic/static import overlap in `client/src/features/auth`,
  a >500kB chunk-size notice) — none touch files in this diff.

## Findings
| # | Severity | File | Finding | Resolution |
|---|---|---|---|---|
| 1 | major | `ai/lab/specs/BUGFIX_mount_safe_orphaned_routers.md`, `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`, `ai/analysis/FEATURE_CATALOG.md` | All three docs (plus the commit message) state `server/src/api/reference-routes.ts`'s `getEnvironmentFromStorage` helper is "still the `// TODO: implement based on your storage` stub" that W-012 replaced. Reading the file shows this is false as of the current code: `getEnvironmentFromStorage` already does `return loadReferenceEnvironment(req);`, importing the exact fixed function from `reference-suggestion-routes.ts`. `git log -p` shows this delegation was added in commit `d9f947a` on 2026-07-14 — a day *before* the audit that raised ADV-05 and this bugfix session — so the implementer's "still a stub" claim was never checked against the live file, it was inferred/assumed from the audit's original wording. The unmount *decision* is still defensible on genuine-duplication grounds (same service, overlapping GET shape, different base path — `/api/references/*` vs `/api/v1/references/*` — no collision but redundant surface), but the *reason* recorded as fact in three permanent knowledge docs is fabricated/stale, which is precisely the failure mode `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md`'s own ADV-03 finding was about (unverified claims written as fact). | not fixed — recommend correcting the three docs' wording from "stale/never-implemented stub" to "genuinely duplicates `reference-suggestion-routes.ts`'s service and environment-loading logic (already delegates to `loadReferenceEnvironment`); left unmounted only to avoid two overlapping REST surfaces for the same feature, not because it is broken" — the unmount decision itself does not need to change |
| 2 | minor | `ai/lab/WORKLOG.md` (W-018 row, Commit column) | Reads "uncommitted (working tree)" but the change is now commit `e16a55c`. Same stale-race-between-commit-and-authoring pattern flagged as Finding 3 in `ai/lab/reviews/REVIEW_W-015.md` for W-016's row (later corrected in commit `d274905`), not a new defect introduced by this change. | not fixed — recommend updating the Commit column to `e16a55c` in a follow-up commit, matching the `d274905` precedent |
| 3 | nit | — | `node install.mjs verify . --strict` (CLAUDE.md/AGENTS.md rule 9) remains unreachable in this checkout — no `install.mjs` anywhere. Pre-existing gap, already flagged in `REVIEW_W-015.md` finding 4 and `REVIEW_W-017.md` finding 4. Recorded again per the review template rather than silently skipped. | not fixed — outside this change's scope, flagged for awareness (third occurrence) |

## What the human should double-check
1. **Finding 1's fix is doc-only.** No code changes are needed — `reference-routes.ts`
   staying unmounted is still the right call — but the three docs currently teach
   future agents/humans a wrong fact about the file's implementation state. Worth a
   quick surgical correction pass before this is trusted as ground truth.
2. **The "duplicate REST surface" framing for `reference-routes.ts`.** I verified it
   is functionally redundant (same service, overlapping capability) but did not
   audit whether `/api/references/*`'s slightly different response shapes (e.g.
   `{ suggestion }` singular vs. `/api/v1/references/suggestions/:id`'s bare object)
   are consumed by any legacy client code that might expect the `/api/references/*`
   shape specifically — worth a quick grep before ever deleting the file outright.
3. **Plugin registry emptiness (`pluginLoader.loadAll()` never called) is a
   pre-existing gap this diff correctly declined to fix** — confirmed independently,
   not a regression from this change, but worth prioritizing separately since the
   newly-added `/plugins` page is now reachable and will show an empty list to real
   users.
