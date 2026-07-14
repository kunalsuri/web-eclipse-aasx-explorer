<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Adversarial audit — 2026-07-14

> Status: `[inferred]` until human review. Scope: defects that materially distort
> C# feature-parity or current product-capability claims. No source fixes were made.

## ADV-2026-07-14-01 — New packages are not AASX packages

- **Severity/status:** critical / OPEN
- **Location:** `server/aasx-routes.ts:56-90`
- **Issue:** `POST /api/aasx/new` writes an environment JSON file and stores that
  JSON path as `FileMetadata.path`, while naming the entry `<name>.aasx`.
  `GET /api/aasx/download/:id` sends `FileMetadata.path` under the `.aasx` name.
- **Concrete failure:** create a package in the manager, then click Download. The
  payload is JSON, not a ZIP/OPC package, so an AASX reader cannot open it.
- **Root cause:** `AasPackageCreator` creates an in-memory `Environment`; no package
  writer creates `[Content_Types].xml`, relationships, an environment part, or ZIP
  bytes. Presentation metadata substitutes for package serialization.
- **Trace:** source-traced from the create endpoint's `envPath`, metadata `path`,
  and the download endpoint's `res.download(file.path, file.originalName)`.
- **Suggested fix:** introduce one OPC-aware package service that creates valid AASX
  bytes and make the metadata path reference that artifact. Add create-download-
  reopen tests in both TS and C#.

`server/aasx-routes.ts:56 — new package metadata points at environment JSON — downloaded .aasx is not a ZIP/OPC package — create packages through an OPC-aware writer`

## ADV-2026-07-14-02 — Save/edit state diverges from downloaded package state

- **Severity/status:** high / OPEN
- **Location:** `server/aasx-routes.ts:378-453`, `server/aasx-routes.ts:975-1155`
- **Issue:** property, whole-environment, submodel, element, delete, and duplicate
  routes mutate only `data/aasx/<id>-environment.json`. The uploaded AASX referenced
  by metadata is never updated.
- **Concrete failure:** upload and parse an AASX, change a Property, download the
  package, and reopen it. The downloaded package contains the pre-edit value even
  though the viewer displays the edited sidecar value.
- **Root cause:** read-model extraction and package write ownership were split, but
  the system presents sidecar mutation as package editing.
- **Trace:** all mutation endpoints resolve `<id>-environment.json`; the download
  endpoint resolves the unrelated metadata `path` created at upload time.
- **Suggested fix:** make mutations transactional package operations or explicitly
  label the sidecar as a draft and add a real Save/Save As repackaging action.

`server/aasx-routes.ts:378 — edits persist only to a sidecar — download/reopen loses the user's changes — repack the environment into the owned AASX artifact`

## ADV-2026-07-14-03 — Thirty-five advertised AASd validators are no-ops

- **Severity/status:** high / OPEN
- **Location:** `shared/validation-rules/aasd-structural.ts:1379`,
  `shared/validation-rules/aasd-semantic.ts:1086`,
  `tests/unit/shared/validation/aasd/constraint-count.test.ts:1`
- **Issue:** 35 registered rules define `validate: (): ValidationError[] => []`:
  AASd-031..044, AASd-050, and AASd-078..097. The count test asserts totals and
  unique IDs, not behavior. Repository prose nevertheless reports 150/150 complete.
- **Concrete failure:** any model violating one of those intended constraints
  receives no diagnostic because those functions cannot emit one.
- **Root cause:** placeholder IDs were counted as implemented constraint semantics.
- **Trace:** a deterministic source scan counted 35 exact no-op validators; the full
  test suite still passed 755/755, demonstrating the current tests do not reject
  these placeholders.
- **Suggested fix:** map each ID to authoritative IDTA text, add a failing positive
  fixture and a valid negative fixture, then implement it. Until then, report the
  registry count separately from the behaviorally implemented count.

`shared/validation-rules/aasd-semantic.ts:1086 — 35 registered constraints cannot report violations — invalid models can pass advertised checks — implement spec-derived validators or remove them from the completed count`

## ADV-2026-07-14-04 — Parser drops supplementary XML and JSON package parts

- **Severity/status:** medium / OPEN
- **Location:** `shared/aas-parser.ts:270-303`
- **Issue:** `extractSupplementaryFiles` excludes all paths ending in `.xml` or
  `.json`, rather than excluding only the discovered AAS environment and OPC
  metadata parts.
- **Concrete failure:** a synthetic AASX containing `files/manual.xml`,
  `files/config.json`, and `files/readme.txt` parsed successfully, but
  `package.files` contained only `files/readme.txt`.
- **Root cause:** file extension was used as a proxy for package-part ownership.
- **Trace/repro:** executed with local JSZip and `parseAasxBuffer`; observed output
  was exactly `["files/readme.txt"]`.
- **Suggested fix:** exclude the selected environment part and known OPC control
  parts by normalized path/relationship type, not every XML/JSON part. Add package
  fixtures with supplementary structured files and byte-equality assertions.

`shared/aas-parser.ts:276 — all XML/JSON parts are filtered out — structured supplementary documents disappear from parsed packages — filter only the selected environment and OPC metadata parts`

## ADV-2026-07-14-05 — Feature implementations are orphaned from live composition

- **Severity/status:** medium / OPEN
- **Location:** `server/routes.ts:28-40`, `client/src/App.tsx:98-109`
- **Issue:** `plugin-routes.ts`, `idta-templates-routes.ts`, `xml-routes.ts`,
  `reference-routes.ts`, and `api/aasx/update.ts` are not mounted. The integrated
  explorer, plugin manager, IDTA page, export dialogs, Document Shelf, and Technical
  Data panels are not imported by the live route/page composition.
- **Concrete failure:** unit and integration tests can pass against these modules,
  while users cannot invoke the feature through the running app. Client calls aimed
  at unmounted update routes receive 404 responses.
- **Root cause:** implementation and reachability were tracked independently; no
  composition/E2E gate fails when a feature module becomes orphaned.
- **Trace:** import and route searches found definitions only, with no composition-
  root imports beyond their own index files.
- **Suggested fix:** choose the canonical feature paths, mount them deliberately,
  delete or quarantine superseded paths, and add route-manifest plus browser smoke
  tests for every advertised capability.

`server/routes.ts:28 — substantial routers and UI modules are unmounted — tested modules are unavailable to users — mount the canonical paths and verify them through app-level tests`

## Summary

Five findings: one critical, two high, and two medium. The top three are the invalid
new-package artifact, edits that do not survive package download/reopen, and 35
no-op validators counted as complete constraints.

