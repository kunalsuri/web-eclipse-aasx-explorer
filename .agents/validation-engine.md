# AAS V3 Validation Engine

`shared/aas-validation-engine.ts` runs a fixed set of 150 constraints (all implemented — 100% coverage as of the last audit in `.kiro/CONSOLIDATED-SUMMARY.md`) over a parsed `Environment`. Constraints are aggregated in `shared/validation-rules/index.ts` (`AllAASdConstraints`) from seven category files, each independently testable:

| Category | Count | File |
|---|---|---|
| Basic | 11 | `shared/validation-rules/aasd-constraints.ts` |
| Advanced | 11 | `shared/validation-rules/aasd-advanced-constraints.ts` |
| Structural | 36 | `shared/validation-rules/aasd-structural.ts` |
| Semantic | 43 | `shared/validation-rules/aasd-semantic.ts` |
| Reference | 25 | `shared/validation-rules/aasd-reference.ts` |
| Data Type | 12 | `shared/validation-rules/aasd-datatype.ts` |
| Cardinality | 7 | `shared/validation-rules/aasd-cardinality.ts` |

Each rule has a `category` field; use `getConstraintsByCategory(category)` / `getConstraintById(id)` (both exported from `validation-rules/index.ts`) rather than filtering `AllAASdConstraints` manually.

## Adding or changing a constraint

1. Add the rule to the relevant category file (matching the `ValidationRule` shape from `shared/validation-types.ts`), not a new file — categories are meaningful groupings, not arbitrary splits.
2. Add unit tests under `tests/unit/shared/validation/aasd/` for the specific rule, and integration tests under `tests/integration/validation/` if it interacts with other rules.
3. Update the constraint count/table in `.kiro/CONSOLIDATED-SUMMARY.md` if the total changes — that file is the tracked source of truth for "how many constraints are implemented," and other docs (including this one) quote it.

## Severity

Constraints can be `error`, `warning`, or `info`. Cardinality rules (e.g. "Collection should have elements") are deliberately `info`-only: empty collections are valid AAS V3, so these are hints, not failures — don't upgrade their severity without a spec reason.

## UI surface

Validation results reach the user via `client/src/features/aas-explorer/components/validation-panel.tsx` and `validation-report-dialog.tsx`, grouped by severity, with click-to-navigate to the offending element and inline icons on tree nodes.
