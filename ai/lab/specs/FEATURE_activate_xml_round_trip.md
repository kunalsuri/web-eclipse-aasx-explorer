<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# FEATURE: Activate XML round-trip coverage `[inferred]`
> **Status:** in-review · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** The user's request to finish the long-running translation,
> repair pending functionality, and pursue an accurately runnable codebase.

## Goal
Make the existing AAS V3 XML service serialize and deserialize the environment
structures already named by its disabled test suite, and turn those assertions
into permanent active coverage.

## Scope
- Serialize shells, extensions, submodels, concept descriptions, and the tested
  Property, MultiLanguageProperty, Range, collection, Entity, and Operation forms.
- Parse both default and prefixed AAS V3 namespaces and preserve the tested fields
  through a round trip.
- Expose deserialization and well-formedness validation through the facade used by
  callers.
- Activate the 16 existing XML tests.

## Non-goals
- Claiming full XSD conformance without executing the official AAS XSD suite.
- Legacy V1/V2 XML migration, which is separately guarded by the C# golden masters.
- New element types not exercised by the existing XML service contract.

## Touch list
| Location | Stability | Change |
|---|---|---|
| `server/src/services/xml-serialization-service.ts` | ours | Complete the environment facade and serializers |
| `server/src/services/xml-element-serializer.ts` | ours | Cover the tested nested element types |
| `server/src/services/xml-deserialization-service.ts` | ours | Parse namespace variants and element containers correctly |
| `server/src/services/xml-schema-validator.ts` | ours | Use a real XML parse for well-formedness checks |
| `tests/unit/server/services/xml-serialization-service.test.ts` | ours | Activate and align the existing contract |
| `ai/guide/FEATURE_MAP.md` | n/a (docs) | Replace the skipped-test warning with the verified boundary |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required ledger row |

## Acceptance
1. All 16 XML serialization/round-trip assertions are active and green.
2. Malformed XML is rejected and prefixed/default AAS V3 namespaces are accepted.
3. `npm run check`, `npm test`, and `npm run build` remain green.
4. Documentation says clearly that official XSD conformance is still a separate
   verification task.

## Knowledge update on completion
- [x] `FEATURE_MAP.md` records the active XML contract and XSD boundary
- [x] `FEATURE_CATALOG.md` records the current source/test wiring
- [x] `ROADMAP.md` links this feature while fresh-context review is pending
- [x] `WORKLOG.md` row appended (type `feature`, linking this doc + review)
