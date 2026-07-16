<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Mount the safe orphaned routers `[inferred]`
> **Status:** in-review · **Author:** agent session · **Date:** 2026-07-15 · **Issue:** ADV-2026-07-14-05
>
> **Authorization:** User explicitly directed finishing ADV-03 then moving to
> ADV-05 as the next priority. The `AskUserQuestion` prompt asking which of
> three mounting strategies to use failed twice (tool connectivity), so this
> proceeded with the lower-risk, explicitly-flagged recommended option rather
> than block on a broken dialog, per Auto Mode guidance to make the reasonable
> call and let the user redirect if needed.

## Symptom
**Observed:** `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md`
(ADV-2026-07-14-05) reported that `plugin-routes.ts`, `idta-templates-routes.ts`,
`xml-routes.ts`, `reference-routes.ts`, and `api/aasx/update.ts` are
implemented but never imported by `server/routes.ts`, and several client
pages/panels are never composed into `App.tsx`.

**Expected (per the audit's suggested fix):** "choose the canonical feature
paths, mount them deliberately, delete or quarantine superseded paths."

## Investigation — mounting all 5 literally is unsafe
Read each of the 5 unmounted routers and what they touch:
1. `plugin-routes.ts` — self-contained plugin registry API (`pluginRegistry`),
   no filesystem persistence overlap with anything else. Safe.
2. `xml-routes.ts` — stateless: environment/XML travel in the request body,
   response is generated in-memory, no `data/aasx/` writes. Safe regardless
   of AASX package state.
3. `server/src/api/aasx/update.ts` — a second property/element-update surface
   (`updateService`, `elementManager`) with optimistic-locking versions and
   backup restore. Traced its persistence: both `update-service.ts` and
   `element-manager.ts` write only `<id>-environment.json` via
   `AtomicFileWriter`, never calling `AasxPackageService`. Mounting this
   would let edits bypass the real `.aasx` repacking fixed in
   `ai/lab/specs/BUGFIX_remove_fabricated_aasd_constraints.md`'s sibling work
   (W-016, ADV-2026-07-14-02) — i.e. reopen that exact bug through a second,
   uncoordinated code path. **Not mounted.**
4. `reference-routes.ts` — same `referenceSuggestionService` as the
   already-mounted `reference-suggestion-routes.ts`. **Correction (post-review,
   `ai/lab/reviews/REVIEW_W-018.md` Finding 1):** an earlier draft of this doc
   claimed `getEnvironmentFromStorage` was still the
   `// TODO: implement based on your storage` stub W-012 replaced in the other
   file. That claim is false — `getEnvironmentFromStorage` already delegates to
   `loadReferenceEnvironment` (imported from `reference-suggestion-routes.ts`
   itself), added in `d9f947a`, before this session started; only its stale
   comment text (not its behavior) still reads like a stub. The real reason to
   leave it unmounted: it is a genuine duplicate REST surface — different base
   path (`/api/references` vs. `/api/v1/references`), different route shapes
   (`/:id` vs. `/suggestions/:id`, no `by-semantic-id` equivalent on the
   canonical router) — over the same underlying service. Mounting both would
   give the client two inconsistent ways to reach identical functionality with
   no clear canonical choice communicated to callers. **Not mounted.**
5. `idta-templates-routes.ts` — every handler is
   `res.status(501).json({ error: 'Not implemented' })`. Mounting exposes an
   API with zero real behavior. **Not mounted** (the client page
   `idta-templates-page.tsx` is fully built but has no working backend to
   call yet — a separate feature-completion task, not a mounting fix).

Client-side, `client/src/features/aas-explorer/components/aas-explorer-integrated.tsx`
(the "integrated" explorer, vs. the basic tree+property view actually used by
`aas-viewer-page.tsx`), `client/src/components/DocumentShelfPanel.tsx`, and
`client/src/components/TechnicalDataPanel.tsx` are also unreferenced by
anything. None of the three has an established integration point: swapping
`AasViewerPage`'s viewer implementation changes the primary viewing UX, and
the two panels have no semantic-ID-based dispatch hook anywhere in
`property-panel.tsx` to attach to. Wiring these is feature-completion work
requiring a design decision, not a mechanical "add an import" fix — left
out of scope, recorded in `DEFECT_TRACEABILITY.md`.

## Root cause
Feature branches added complete backend routers and/or frontend pages without
a composition-root checklist; some of the unmounted routers are safe
oversights, others are superseded/dangerous duplicates that should stay
unmounted rather than "fixed" by mounting.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `server/routes.ts` | stable | Mount `plugin-routes.ts` at `/api/plugins`, `xml-routes.ts` at `/api/xml`; comment-document why the other 3 are intentionally not mounted |
| `client/src/pages/plugin-manager-page.tsx` | ours (new file) | `AppLayout` + `PluginManager` wrapper, matching the existing page convention (e.g. `dictionary-browser-page.tsx`) |
| `client/src/App.tsx` | ours | Add `/plugins` route |
| `client/src/features/app-shell/config/navigation.ts` | ours | Add "Plugins" nav entry |
| `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md`, `ai/guide/MODULE_MAP.md`, `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` | docs | Record what's mounted, what's quarantined and why, and the still-orphaned client components |

## Fix
Mounted 2 of 5 routers; left 3 unmounted with recorded reasons (2 dangerous/
superseded, 1 genuinely unfinished). Added a full page + route + nav entry
for the Plugin Manager (self-contained, zero coupling risk). Did not touch
the IDTA templates page, the integrated explorer, or the Document
Shelf/Technical Data panels — those need a design decision this pass
explicitly did not make.

## Acceptance
1. `GET /api/plugins` returns `200 {"plugins":[]}` (verified live against a
   running dev server — registry is empty because `pluginLoader.loadAll()` is
   never called anywhere, a separate, undocumented-until-now gap).
2. `POST /api/xml/export` with an empty environment returns `200` and valid
   XML (verified live).
3. `/plugins` is reachable through `App.tsx`'s route table and the nav
   sidebar; `PluginManagerPage` reuses the same `AppLayout` wrapper as every
   other page.
4. `api/aasx/update.ts` and `reference-routes.ts` remain unreachable — verified
   live: unmatched paths under those routers' intended prefixes fall through
   to the Vite SPA shell (200 HTML, not JSON), confirming no router intercepts
   them.
5. `npm run check`, `npm test` (762/762), and `npm run build` are green.
6. Fresh-context review (`ai/lab/reviews/`) confirms the quarantine reasoning
   and that nothing dangerous was mounted.

## Knowledge update on completion
- [x] `ai/analysis/FEATURE_CATALOG.md` mounted-routes table, F10, F13 amended
- [x] `ai/guide/FEATURE_MAP.md` Plugin Manager gotcha amended
- [x] `ai/guide/MODULE_MAP.md` plugin-manager row amended
- [x] `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` ADV-2026-07-14-05 marked PARTIALLY FIXED
- [ ] `ai/lab/WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
