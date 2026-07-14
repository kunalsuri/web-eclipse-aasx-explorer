<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# SPEC: F01 package create/open/save/close parity
> **Status:** approved
> **Author:** AI draft · **Date:** 2026-07-14 · **Revision:** 1

This spec is written to be implemented without further design decisions. Its
behavior is derived from the user request, the F01 source inventory, and the C#
package lifecycle in `AdminShellPackageFileBasedEnv.cs`.

## 1. Goal
Create, open, edit, save, download, close, and reopen genuine OPC/ZIP AASX
packages. Saving replaces the environment part while preserving the complete AAS
environment, supplementary bytes and paths, MIME/content types, OPC
relationships, and thumbnails. A failed write leaves the previous package bytes
intact.

## 2. Hard constraints (violating any of these fails the review)
| # | Constraint |
|---|---|
| C1 | `_external_source/` is read-only and remains unchanged; C# is fixture authority, not runtime code. |
| C2 | Use the existing `jszip` dependency; add no new runtime dependency. |
| C3 | Package replacement is transactional: write and validate a sibling temporary file, then atomically replace the target using the repository's Windows-safe rename behavior. |
| C4 | Existing non-environment ZIP entries and OPC relationship documents are byte-preserved on save unless the entry is the environment part that must change. |
| C5 | Supplementary XML and JSON are package parts, never mistaken for or discarded as environment candidates. |
| C6 | Match the license-header practice of neighboring files. |
| C7 | Surgical diffs only; do not implement unrelated editor, plugin, repository, or security features. |

## 3. Scope & glossary
**In:** OPC package discovery/writing, real package creation, persisted environment
edits, download/reopen parity, close semantics at the server request boundary,
differential fixtures/tests, failure safety. **Out:** auxiliary-package UI, recent
paths UI, supplementary-file editing UI, signing/encryption, editor expansion,
plugins, unrelated import/export formats.

- **Environment part** — the AAS JSON or XML OPC part selected through the package
  origin/specification relationship chain; JSON is used for newly created AASX.
- **Supplementary part** — any OPC part related as supplementary content, including
  XML/JSON; its extension does not make it an environment.
- **Preserve relationships** — retain every existing `.rels` entry and its bytes
  for an uploaded package while replacing only the environment payload.
- **Failed write** — serialization, ZIP generation, validation, temporary-file, or
  replacement failure; the pre-save target must remain readable and byte-identical.

## 4. Behaviour (exact)

### 4.1 Package domain
Add a Node-compatible package service that:

1. Opens an AASX buffer, resolves the root origin relationship and origin-to-spec
   relationship, identifies the environment part, parses it with the shared AAS
   parser contracts, and exposes part paths/content types/relationships needed by
   tests.
2. Creates a minimal valid OPC package containing `[Content_Types].xml`, package
   and origin relationships, an origin part, and a JSON environment part.
3. Saves by loading the original ZIP, replacing only the resolved environment
   part with the complete current environment JSON, generating a temporary AASX,
   reopening it to prove the environment is readable, then replacing the target.
4. Never filters ZIP entries by `.json` or `.xml`; relationship traversal decides
   which single entry is the environment.
5. Preserves thumbnails, supplementary bytes and paths, content-type declarations,
   relationship documents, and unrelated OPC parts.

### 4.2 Server integration
- Create writes both the environment sidecar used by existing APIs and a genuine
  `.aasx`; metadata download points to the `.aasx`.
- Upload parses and stores the genuine `.aasx` plus its complete environment.
- Every successful environment mutation persists the new environment into the
  `.aasx` transactionally before returning success. If package persistence fails,
  the environment sidecar and package both remain at their previous state.
- Download returns the current `.aasx` bytes. Close releases request-local package
  resources; no process-global open ZIP handle is retained.

### 4.3 C# differential fixtures
Use the named F01 C# implementation to generate expected package fixtures outside
`_external_source/`, then commit only the deterministic inputs/expected outputs
needed by TypeScript differential tests. The tests compare environment semantics,
part paths, content types, relationship tuples, supplementary bytes, and thumbnail
bytes rather than ZIP container byte ordering.

## 5. Touch list (complete — nothing else changes)
| Layer | Location | Stability (from MODULE_MAP) | Change |
|---|---|---|---|
| domain | `shared/aasx-package.ts` | stable family (new file) | add OPC relationship/content-type discovery and ZIP write logic |
| domain | `shared/aas-parser.ts` | stable | delegate AASX environment selection to relationship-aware discovery |
| backend | `server/src/services/aasx-package-service.ts` | ours (new file) | add transactional filesystem package lifecycle |
| backend | `server/src/services/aas-package-creator.ts` | ours | expose genuine package creation integration |
| backend | `server/aasx-routes.ts` | stable | route create/upload/mutations/download through package service |
| tests | `tests/unit/shared/aasx-package.test.ts` | test (new file) | OPC writer unit regressions |
| tests | `tests/integration/aasx-package-roundtrip.test.ts` | test (new file) | required five round-trip/failure flows |
| fixtures | `tests/fixtures/f01-package-parity/` | test (new files) | C#-derived expected fixtures/manifests |
| knowledge | `ai/guide/FEATURE_MAP.md`, `ai/analysis/FEATURE_CATALOG.md`, `ai/lab/ROADMAP.md`, `ai/lab/WORKLOG.md`, this spec, review file | documentation | inferred completion records only; preserve existing edits |

Stability check: no `frozen` or `?` files are touched. Stable files receive only
narrow package-boundary changes; the package implementation lives in new/ours files.
Human approval recorded from the user on 2026-07-14.

## 6. Test plan
Harness: Vitest, following existing parser and package-creator tests.

| # | Test | Assertion |
|---|---|---|
| T1 | create -> download -> reopen | Download is valid OPC AASX and complete created environment deep-equals reopened environment. |
| T2 | upload -> edit Property -> save -> download -> reopen | Reopened Property has the edited value and all other environment data is unchanged. |
| T3 | upload -> save without edits | Supplementary bytes, part paths, MIME declarations, relationships, and thumbnails equal the input. |
| T4 | XML and JSON supplementaries | Both retain exact bytes and remain supplementary after reopen. |
| T5 | failed write rollback | Injected pre-replace failure leaves package and sidecar byte-identical to their prior versions. |
| T6 | C# differential package manifest | TS part/relationship/content/environment manifest equals the C#-generated expected fixture. |
| T7 | parser golden masters | Existing eight C# environment golden masters remain green. |

## 7. Acceptance criteria (definition of done)
1. All hard constraints hold and all T1-T7 tests pass.
2. `npm run check`, `npm test`, `npm run build`, and
   `node install.mjs verify . --strict` exit zero.
3. Differential package tests generated from the named C# F01 implementation pass.
4. Review reports no unresolved correctness finding; worklog and roadmap link the
   spec and review.

## 8. Knowledge update on completion
- [ ] `ai/guide/FEATURE_MAP.md` updated with package fidelity and failure-safety gotchas `[inferred]`.
- [ ] `ai/analysis/FEATURE_CATALOG.md` F03 package-management entry amended `[inferred]`.
- [ ] `ai/guide/MODULE_MAP.md` remains accurate; no layout row needed for individual files.
- [ ] `ai/lab/WORKLOG.md` row appended linking this spec and review.
- [ ] `ai/lab/ROADMAP.md` F01 row moved to Shipped.
- [ ] Human flips this spec from `draft` to `approved`, and after audit to `implemented`.
