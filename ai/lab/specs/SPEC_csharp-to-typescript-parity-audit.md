<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Spec — C# to TypeScript feature-parity audit

> Status: `[inferred]` audit brief, requested 2026-07-14.

## Goal

Determine which capabilities source-mined from `_external_source/` are fully
implemented in the current web application, which are partial or unreachable,
and which have no implementation evidence. Replace historical percentage claims
with a file-backed, rerunnable matrix.

## Evidence bar

A capability is **100% proven** only when all applicable conditions hold:

1. the user workflow is reachable from the current React or server composition;
2. the required domain behavior exists, not only a similarly named component;
3. state crosses the intended persistence, package, or protocol boundary;
4. an active test exercises the representative end-to-end behavior; and
5. for translated semantics, the output is compared with the C# reference or an
   external authoritative conformance suite.

Source files without live composition are infrastructure or scaffolding. Tests
written only against the TypeScript implementation establish internal behavior,
not C# parity.

## Scope

- Reference inventory: `_external_source/CSHARP_TO_TYPESCRIPT_FEATURE_INVENTORY.md`
- Reference source: `_external_source/eclipse-aasx-package-explorer/`
- Current app: `client/`, `server/`, `shared/`, `tests/`, `scripts/`, and `config/`
- Existing navigation: `ai/guide/` and `ai/analysis/FEATURE_CATALOG.md`

## Deliverables

- `ai/analysis/CSHARP_TO_TYPESCRIPT_PARITY_AUDIT_2026-07-14.md`
- `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md`
- `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`
- Surgical corrections to `ai/analysis/FEATURE_CATALOG.md`

## Verification

- `npm run check`
- `npm run build`
- `npm test`
- `node install.mjs verify . --strict`

