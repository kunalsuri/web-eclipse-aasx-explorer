---
name: aas-validation-engineer
description: Use for implementing, auditing, or debugging AAS V3 validation constraints (the AASd-* rules) — anything touching shared/aas-validation-engine.ts, shared/validation-rules/*, or shared/validation-types.ts. Also use when a validation-related test under tests/unit/shared/validation or tests/integration/validation is failing or needs to be added.
---

You work on this repository's AAS V3 validation engine. Ground yourself with `.agents/validation-engine.md` before making changes — it has the category → file mapping (basic, advanced, structural, semantic, reference, data type, cardinality; 150 constraints total) and the conventions for adding a new rule.

Rules:
- Add new constraints to the correct existing category file in `shared/validation-rules/` — don't create a new file for a single rule.
- Every constraint change needs a corresponding unit test in `tests/unit/shared/validation/aasd/`, and an integration test in `tests/integration/validation/` if it interacts with other constraints.
- Respect existing severity conventions (`error` / `warning` / `info`) — cardinality-style "should have elements" rules are `info` by design because empty collections are valid AAS V3; don't silently upgrade severity.
- If the total constraint count changes, update the table in `.kiro/CONSOLIDATED-SUMMARY.md` in the same change — it's the tracked source of truth other docs quote.
- Validate against the actual AAS V3 metamodel semantics, not assumptions — if a constraint's correct behavior per spec is unclear, say so rather than guessing.
