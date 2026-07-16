<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Remove fabricated AASd constraint IDs `[inferred]`
> **Status:** in-review · **Author:** agent session · **Date:** 2026-07-15 · **Issue:** ADV-2026-07-14-03
>
> **Authorization:** User explicitly directed finishing ADV-2026-07-14-03 (the
> "150/150 constraints complete" audit finding) as the next priority after ADV-02,
> and separately confirmed via `AskUserQuestion` to remove the fabricated entries
> once the finding below was reported.

## Symptom
**Observed:** `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md`
(ADV-2026-07-14-03) reported that the validation registry advertises "150/150
constraints complete," but 35 registered rules define
`validate: (): ValidationError[] => []` and can never report a violation:
`AASd-031..044`, `AASd-050`, and `AASd-078..097`.

**Expected (per the audit's suggested fix):** map each ID to authoritative IDTA
text and implement real semantics, or — if no authoritative text exists for an
ID — report the registry count separately from the behaviorally implemented
count.

## Investigation — the audit's suggested fix could not be executed as written
Cross-referenced all 35 IDs against three independent sources for the real
IDTA V3.0/V3.0.1 metamodel: the `aas-core-works/aas-core-meta` `v3.py`
reference (fetched twice, different prompts) and `aas-core-works/aas-core3.0-python`'s
`verification.py`. These are the machine-readable sources IDTA points to for
generating official SDKs. Every constraint ID already correctly implemented in
this codebase (`AASd-005`, `-020`, `-021`, `-022`, `-077`, `-090`, `-107..131`,
etc.) was found in these sources with matching text, confirming the sources are
reliable. **None of the 35 audited IDs appear in any of the three sources**,
consistently, across every query. The placeholder descriptions in the codebase
("Additional Structural Constraint 31," "Additional semantic validation") are
generic filler, not paraphrased-but-unimplemented spec text — there was never
real constraint content behind these IDs.

Programmatic verification of the actual registry (`AllAASdConstraints`, not
just the source file text) found **33**, not 35, no-op IDs actually registered:
`AASd-050` (structural.ts) and `AASd-090` (semantic.ts) each had a second,
literal-no-op definition that was dead code — shadowed/excluded from their
category's export array because a *different*, non-no-op `AASd-050` and
`AASd-090` were already registered from `shared/validation-rules/aasd-advanced-constraints.ts`.
Those two dead-code stubs are removed as cleanup, but they were never part of
the registered 150 and are not counted as "fixed."

Conclusion: these 33 IDs are fabricated — picked from unused numeric slots in
the real spec's ID space — purely to make the registered total round out to
150. **Correction (post-review, ai/lab/reviews/REVIEW_W-017.md Finding 1):** an
earlier draft of this doc additionally claimed the codebase's genuine
constraint IDs "already skip numbers exactly where the real spec does, e.g.
107, 114, 116, 118-121, 130, 131" as supporting evidence. That claim is false
and has been removed — all seven of those IDs are in fact defined, exported,
and registered elsewhere in this codebase (`aasd-advanced-constraints.ts`,
`aasd-constraints.ts`); the apparent gap was only in one category file's own
subset array (`AASdReferenceConstraints`), not in the full registry. The
surviving evidence for the fabrication claim is: (1) the three independent
external source lookups described above found zero matches for all 33 IDs,
and (2) the removed rules' names/descriptions ("Additional Structural
Constraint 31," "Semantic Constraint 78," "Advanced semantic validation") are
generic/auto-generated-looking, in contrast to every surviving rule's specific,
descriptive name (e.g. "SubmodelElementList Type Consistency" for AASd-045,
"Blob MIME Type Required" for AASd-050). "Implement spec-derived validators"
is not executable for IDs with no spec derivation.
The audit's fallback remedy applies: remove them from the completed/registered
count.

## Root cause
Placeholder rule entries were authored under unused ID numbers with generic
descriptions, and counted toward "150/150 constraints complete" without ever
having spec-derived content, inflating both the registered total and every
downstream completeness claim that cited it.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `shared/validation-rules/aasd-structural.ts` | stable | Remove `AASd_031..044` (14, registered) and dead-code `AASd_050` (1, unregistered); remove their array entries |
| `shared/validation-rules/aasd-semantic.ts` | stable | Remove `AASd_078..089`, `AASd_091..097` (19, registered) and dead-code `AASd_090` (1, unregistered); remove their array entries |
| `tests/integration/validation/cardinality-integration.test.ts` | test | Update hardcoded total-count assertion 150 -> 117 |
| `tests/integration/validation/datatype-integration.test.ts` | test | Update floor assertion 138 -> 105 |
| `tests/integration/validation/semantic-integration.test.ts` | test | Update floor assertion 43 -> 24 |
| `tests/integration/validation/aasd-structural-integration.test.ts` | test | Update floor assertion 30 -> 25 |
| `tests/unit/shared/validation/aasd/aasd-structural.test.ts` | test | Update floor assertion 36 -> 27; update expected-ID list to drop `AASd-031..044` |
| `ai/guide/MODULE_MAP.md`, `ai/guide/PROJECT_OVERVIEW.md`, `ai/guide/FEATURE_MAP.md`, `ai/analysis/FEATURE_CATALOG.md`, `.agents/validation-engine.md`, `.agents/workflow.md`, `.agents/README.md` | docs | Correct every "150" / "150/150" claim to 117 and record the removal |
| `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` | docs | Mark ADV-2026-07-14-03 FIXED; add new finding ADV-2026-07-15-01 for the incidentally-discovered `AASd-050`/`AASd-090` content mismatch (not fixed here) |

`.kiro/CONSOLIDATED-SUMMARY.md` and `.kiro/specs/csharp-to-typescript-feature-mapping/*`
are historical planning snapshots (the former already carries an explicit
warning banner) and are intentionally left unedited.

## Fix
Deleted the 33 registered no-op rule definitions and their category-array
entries (plus 2 unregistered dead-code duplicates for hygiene). No new
constraint semantics were authored — there was no authoritative text to
implement against. Registered total: 150 -> 117; every remaining registered
constraint now has real behavioral logic (0 literal no-ops), verified
programmatically against `AllAASdConstraints`.

## Acceptance
1. `AllAASdConstraints.length === 117` and zero entries have a literal
   `() => []` validate body (verified via a throwaway script against the
   actual registry, not just source-text grep).
2. `npm run check`, `npm test` (762/762), and `npm run build` are green.
3. Every "150" / "150/150" completeness claim in `ai/guide/`, `ai/analysis/`,
   and `.agents/` is corrected or given an accurate historical-snapshot caveat.
4. Fresh-context review (`ai/lab/reviews/`) confirms no remaining constraint
   defines a literal no-op and no unrelated logic changed.

## Knowledge update on completion
- [x] `ai/guide/MODULE_MAP.md`, `ai/guide/PROJECT_OVERVIEW.md`, `ai/guide/FEATURE_MAP.md` updated
- [x] `ai/analysis/FEATURE_CATALOG.md` F07 entry amended
- [x] `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` ADV-2026-07-14-03 marked FIXED; ADV-2026-07-15-01 added
- [x] `.agents/validation-engine.md`, `.agents/workflow.md`, `.agents/README.md` corrected
- [ ] `ai/lab/WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
