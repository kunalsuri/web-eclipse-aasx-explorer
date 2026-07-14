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

