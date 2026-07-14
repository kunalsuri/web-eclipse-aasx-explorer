<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# BUGFIX: Legacy AASX XML migration `[inferred]`
> **Status:** approved · **Author:** Codex · **Date:** 2026-07-14 · **Issue:** —
>
> **Authorization:** The user explicitly requested that the nine-month translation
> be completed with 100% accuracy and authorized an urgent full-codebase repair.
> This resolves the pending scope decision in
> `docs/2026-07-13-migration-strategy-findings.md` in favor of supporting both the
> V2.0 and V1.0 golden-master fixtures.

## Symptom
**Observed:** All eight committed AASX fixtures report parse success, but
`parseAasxBuffer` returns zero asset administration shells, submodels, and concept
descriptions. The C# reference environments contain real migrated content.

**Expected:** The TypeScript parser discovers the actual AAS environment package
part and migrates legacy AAS V2.0 and V1.0 XML into the same V3 `Environment`
structure as the C# reference implementation.

## Reproduction — no fix before this exists and fails
1. Run `npm run test:integration -- tests/integration/golden-master/aasx-parser.test.ts`.
2. Observe eight count mismatches: TypeScript returns `0/0/0` while the C# golden
   summaries contain non-zero environment counts.
3. Strengthen the permanent regression to compare each complete TypeScript
   environment with `tests/fixtures/golden-master/expected/*.json` and observe it
   fail before implementation.

- Failing test: `tests/integration/golden-master/aasx-parser.test.ts`.

## Root cause
There are two defects in `shared/aas-parser.ts`:

1. `findEnvironmentFile` selects `aasx/aasx-origin`, whose content is literally
   `Intentionally empty.`, as the XML environment before looking for the actual
   `*.aas.xml` OPC part.
2. The XML converter is an explicitly simplified flat-shape stub. It does not
   remove namespace prefixes, unwrap schema containers, or perform the V1/V2 to
   V3 field/reference/model-type migration used by the C# implementation.

## Touch list (from MODULE_MAP / FEATURE_MAP gotchas)
| Location | Stability | Change |
|---|---|---|
| `shared/aas-parser.ts` | stable | Correct AAS package-part discovery and legacy XML-to-V3 migration |
| `shared/aas-xml-migration.ts` | stable parser support | Implement version-aware XML-to-V3 conversion |
| `tests/integration/golden-master/aasx-parser.test.ts` | ours | Compare full migrated environments, not counts alone |
| `ai/guide/FEATURE_MAP.md` | n/a (docs) | Record the legacy migration and golden-master gotcha |
| `ai/lab/WORKLOG.md` | n/a (docs) | Append the required bugfix ledger row |

The stable parser change is explicitly authorized above and remains guarded by the
complete C# differential fixture suite.

## Fix sketch
Reject the OPC origin marker as environment content and select only recognizable
AAS JSON/XML package parts. Parse legacy XML without coercing text values, strip
namespace prefixes, unwrap V1/V2 containers, and map identifiables, referables,
references, supported submodel elements, assets, and IEC 61360 embedded data into
the V3 TypeScript model. Keep supplementary-file extraction unchanged.

## Acceptance
1. The complete environment comparison fails before the fix and passes for all
   eight committed V1/V2 fixtures afterward.
2. `npm run check`, `npm test`, and `npm run build` are green.
3. No golden JSON is read by application/runtime code; it remains test-only input.
4. Strict AI-knowledge path verification is green using the available verifier.

## Knowledge update on completion
- [ ] `FEATURE_MAP.md` gotcha line added (so the next agent knows the trap)
- [ ] `WORKLOG.md` row appended (type `bugfix`, linking this doc + review)
- [ ] EVAL written if the hunt taught something worth keeping
