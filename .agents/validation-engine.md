# AAS V3 Validation Engine

`shared/aas-validation-engine.ts` runs a fixed set of 117 constraints over a
parsed `Environment`, and every registered constraint now has real behavioral
logic — no no-op placeholders remain (see ADV-2026-07-14-03 in
`ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`: 33 fabricated IDs that did
not correspond to any real IDTA constraint — AASd-031..044, AASd-078..089,
AASd-091..097 — were removed on 2026-07-15; the codebase previously registered
150 IDs, of which those 33 always returned no diagnostics). "117 registered"
is not the same claim as "117/117 of the official IDTA spec" — the spec has
additional constraint IDs (some deliberately unimplemented, some deprecated;
see the gaps in the reference-constraint ID list) that this engine does not
cover. Constraints are aggregated in `shared/validation-rules/index.ts`
(`AllAASdConstraints`) from seven category files, each independently testable:

| Category | Count | File |
|---|---|---|
| Basic | 11 | `shared/validation-rules/aasd-constraints.ts` |
| Advanced | 11 | `shared/validation-rules/aasd-advanced-constraints.ts` |
| Structural | 27 | `shared/validation-rules/aasd-structural.ts` |
| Semantic | 24 | `shared/validation-rules/aasd-semantic.ts` |
| Reference | 25 | `shared/validation-rules/aasd-reference.ts` |
| Data Type | 12 | `shared/validation-rules/aasd-datatype.ts` |
| Cardinality | 7 | `shared/validation-rules/aasd-cardinality.ts` |

Each rule has a `category` field; use `getConstraintsByCategory(category)` / `getConstraintById(id)` (both exported from `validation-rules/index.ts`) rather than filtering `AllAASdConstraints` manually.

## Adding or changing a constraint

1. Add the rule to the relevant category file (matching the `ValidationRule` shape from `shared/validation-types.ts`), not a new file — categories are meaningful groupings, not arbitrary splits.
2. Add unit tests under `tests/unit/shared/validation/aasd/` for the specific rule, and integration tests under `tests/integration/validation/` if it interacts with other rules.
3. Update the constraint count/table in this file and `ai/analysis/FEATURE_CATALOG.md` if the total changes. `.kiro/CONSOLIDATED-SUMMARY.md` is a historical planning snapshot (see its warning banner) and is no longer the tracked source of truth.

## Severity

Constraints can be `error`, `warning`, or `info`. Cardinality rules (e.g. "Collection should have elements") are deliberately `info`-only: empty collections are valid AAS V3, so these are hints, not failures — don't upgrade their severity without a spec reason.

## UI surface

Validation results reach the user via `client/src/features/aas-explorer/components/validation-panel.tsx` and `validation-report-dialog.tsx`, grouped by severity, with click-to-navigate to the offending element and inline icons on tree nodes.
