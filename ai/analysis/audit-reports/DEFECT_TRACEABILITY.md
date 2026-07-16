<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Defect traceability

> Status: `[inferred]` until human review. Append-only audit index.

## 2026-07-14 — C# to TypeScript parity audit

| ID | Severity | Status | Location | Defect | Root cause | Trace |
|---|---|---|---|---|---|---|
| ADV-2026-07-14-01 | critical | OPEN | `server/aasx-routes.ts:56` | New packages are JSON documents advertised and downloaded as `.aasx` | No OPC/AASX writer; metadata points `path` at the environment sidecar | `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md` |
| ADV-2026-07-14-02 | high | OPEN | `server/aasx-routes.ts:378` | Edits do not change the package returned by Download | Mutation routes write `*-environment.json`; download returns the original uploaded path | `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md` |
| ADV-2026-07-14-03 | high | OPEN | `shared/validation-rules/aasd-semantic.ts:1086` | “150/150 constraints complete” includes 35 validators that always return no diagnostics | Registry-count tests were used as semantic completeness evidence | `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md` |
| ADV-2026-07-14-04 | medium | OPEN | `shared/aas-parser.ts:270` | Supplementary XML and JSON files are silently omitted from parsed package files | Extraction excludes every `.xml` and `.json`, not only the selected environment part and OPC metadata | `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md` |
| ADV-2026-07-14-05 | medium | OPEN | `server/routes.ts:28` | Implemented editor/XML/plugin/IDTA routers are not mounted | Feature files were added without composition-root registration | `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md` |

## 2026-07-15 — Constraint ID/content mismatch (AASd-050, AASd-090)

Confirmed by cross-checking `shared/validation-rules/aasd-advanced-constraints.ts`
against the normative constraint text in IDTA's own
`admin-shell-io/aas-specs-metamodel` repo, file
`documentation/IDTA-01001/modules/ROOT/pages/changelog.adoc` (GitHub code
search over the canonical spec changelog, not a scrape/guess). No separate
narrative audit report was written for this finding; the changelog citation
above and the corrected implementation/tests are the trace.

| ID | Severity | Status | Location | Defect | Root cause | Trace |
|---|---|---|---|---|---|---|
| ADV-2026-07-15-01 | high | FIXED | `shared/validation-rules/aasd-advanced-constraints.ts` (`AASd_050`, `AASd_090`) | Registered constraints `AASd-050` and `AASd-090` implemented content unrelated to their real IDTA AAS V3.0 metamodel text. `AASd-050` checked "Blob must have contentType" instead of the IEC 61360 data-specification-template IRI reference (`HasDataSpecification/embeddedDataSpecifications[].dataSpecification` must resolve to `https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0` when `dataSpecificationContent` is `DataSpecificationIec61360`). `AASd-090` checked "AnnotatedRelationshipElement must have first/second" instead of the DataElement `category` constraint (Referable/category, when set, must be one of `CONSTANT`, `PARAMETER`, `VARIABLE`; default `VARIABLE`) | Constraint IDs were assigned to hand-written validators without checking each ID's real text in the IDTA metamodel changelog; the mislabeled logic (Blob MIME type, RelationshipElement endpoint presence) does not correspond to any real `AASd-*` ID and was dropped rather than re-labeled | `shared/validation-rules/aasd-advanced-constraints.ts` (fix), `tests/unit/shared/validation/aasd/aasd-advanced.test.ts`, `tests/integration/validation/aasd-advanced-integration.test.ts`; commit `f32ebe0` |

