<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Work ledger — web-eclipse-aasx-explorer

The repo's **episodic memory of work**: one row per unit of work (feature added,
bug fixed, refactor, process change), linking the spec that authorized it, the
decisions behind it, the review that checked it, the evaluation that scored it,
and the commits that shipped it. The maps in `ai/guide/` say what the repo *is*;
this ledger says *what was done to it, when, and under which contract*.

## Rules

- **Append-only.** New work gets a new row with the next `W-<n>` ID. Never delete
  or renumber rows; a rolled-back change gets Status `rolled-back`, not removal.
- **One row per unit of work** — the same unit the spec describes. A row without
  a spec link is a process violation, not a shortcut.
- **Backtick every artifact path, written from the repo root** (e.g.
  ai/lab/specs/SPEC_x.md, backticked). `verify` checks backticked paths against
  the file tree, so a row whose artifacts vanished fails CI instead of rotting
  silently. Use `—` for artifacts that genuinely don't apply (e.g. no ADR was
  needed).
- **Agents append rows tagged `[inferred]`** like everything else in `ai/`;
  the human flips them to `[verified]` when auditing. Never flip it yourself.
- **Status vocabulary:** `specced` → `in-progress` → `in-review` → `shipped`
  (or `rolled-back` / `dropped`; suffix ` (blocked-env)` when verification could
  not run in the working environment).
- **Type vocabulary:** `feature` · `bugfix` · `refactor` · `docs` · `process`.

## Ledger

<!-- Example row (copy, replace the angle-bracket fields, backtick real paths
     written from the repo root). The example ID W-000 is reserved for this
     comment — real rows start at W-001:
| W-000 | 2026-01-15 | feature | Short title | ai/lab/specs/SPEC_<name>.md | ai/lab/decisions/ADR_<n>-<t>.md | ai/lab/reviews/REVIEW_W-000.md | ai/lab/evaluations/EVAL_<name>.md | <commit/PR> | FEATURE_MAP row | shipped | [inferred] |
-->

| ID | Date | Type | Title | Spec | ADRs | Review | Eval | Commits / PR | Knowledge updated | Status | Provenance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| W-001 | 2026-07-14 | process | `/cold-start` — draft ai/guide/ knowledge layer + diagrams | — | — | — | — | uncommitted (working tree) | `ai/guide/MODULE_MAP.md`, `ai/guide/ARCHITECTURE.md`, `ai/guide/CONVENTIONS.md`, `ai/guide/PROJECT_OVERVIEW.md`, `ai/guide/FEATURE_MAP.md`, `ai/analysis/diagrams/package-deps.mmd`, `ai/analysis/diagrams/domain-core.mmd`, `ai/analysis/diagrams/seam.mmd` | in-review | [inferred] |
| W-002 | 2026-07-14 | docs | `/create-feature-catalog` — source-backed implemented-feature inventory | — | — | — | — | uncommitted (working tree) | `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md` | in-review | [inferred] |
| W-003 | 2026-07-14 | process | Audit and repair local Git/GitHub Desktop state | `ai/lab/specs/SPEC_local_git_desktop_repair.md` | — | `ai/lab/reviews/REVIEW_W-003.md` | — | local-only Git metadata; no commit | `ai/lab/specs/SPEC_local_git_desktop_repair.md`, `ai/lab/reviews/REVIEW_W-003.md` | shipped | [inferred] |
| W-004 | 2026-07-14 | bugfix | Make Vitest paths portable across mapped workspaces | `ai/lab/specs/BUGFIX_vitest_workspace_path_resolution.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `86c32d7` | `ai/guide/MODULE_MAP.md` | in-review | [inferred] |
| W-005 | 2026-07-14 | bugfix | Complete legacy V1/V2 AASX XML migration against C# goldens | `ai/lab/specs/BUGFIX_legacy_aasx_xml_migration.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `86c32d7` | `ai/guide/MODULE_MAP.md`, `ai/guide/FEATURE_MAP.md`, `ai/analysis/FEATURE_CATALOG.md`, `docs/2026-07-13-migration-strategy-findings.md`, `docs/2026-07-13-confidence-assessment-and-verification-methodology.md`, `.kiro/CONSOLIDATED-SUMMARY.md` | in-review | [inferred] |
| W-006 | 2026-07-14 | bugfix | Retry transient Windows atomic rename failures | `ai/lab/specs/BUGFIX_windows_atomic_rename_retry.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/guide/FEATURE_MAP.md` | in-review | [inferred] |
| W-007 | 2026-07-14 | bugfix | Restore production build/start contract | `ai/lab/specs/BUGFIX_production_build_start_contract.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/guide/MODULE_MAP.md`, `ai/guide/FEATURE_MAP.md` | in-review | [inferred] |
| W-008 | 2026-07-14 | bugfix | Restore create-admin command | `ai/lab/specs/BUGFIX_restore_create_admin_command.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/guide/MODULE_MAP.md`, `ai/guide/FEATURE_MAP.md` | in-review | [inferred] |
| W-009 | 2026-07-14 | feature | Activate AAS V3 XML structural round-trip coverage | `ai/lab/specs/FEATURE_activate_xml_round_trip.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md`, `ai/lab/ROADMAP.md` | in-review | [inferred] |
| W-010 | 2026-07-14 | feature | Activate property editing and undo/redo workflows | `ai/lab/specs/FEATURE_activate_editing_workflows.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md`, `ai/lab/ROADMAP.md` | in-review | [inferred] |
| W-011 | 2026-07-14 | bugfix | Repair MultiLanguageProperty validation and latest-backup restore | `ai/lab/specs/BUGFIX_update_service_skipped_contracts.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md` | in-review | [inferred] |
| W-012 | 2026-07-14 | bugfix | Load parsed environments for reference suggestions | `ai/lab/specs/BUGFIX_reference_suggestion_environment_loading.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `d9f947a` | `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md` | in-review | [inferred] |
| W-013 | 2026-07-14 | bugfix | Activate colocated client suites and initial property validation | `ai/lab/specs/BUGFIX_activate_colocated_client_tests.md` | — | `ai/lab/reviews/REVIEW_RECOVERY_2026-07-14_PENDING.md` | — | `b846d9c` | `ai/analysis/FEATURE_CATALOG.md`, `tests/setup/vitest.config.ts` | in-review | [inferred] |
| W-014 | 2026-07-14 | docs | Source-backed C# to TypeScript feature-parity and adversarial audit | `ai/lab/specs/SPEC_csharp-to-typescript-parity-audit.md` | — | — | — | uncommitted (working tree) | `ai/analysis/CSHARP_TO_TYPESCRIPT_PARITY_AUDIT_2026-07-14.md`, `ai/analysis/FEATURE_CATALOG.md`, `ai/analysis/audit-reports/ADVERSARIAL_AUDIT_2026-07-14.md`, `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`, `ai/guide/MODULE_MAP.md` | in-review | [inferred] |
| W-015 | 2026-07-14 | feature | Retroactive log: genuine OPC/ZIP AASX package writer; fixed ADV-01 and ADV-04; started ADV-02 (property/whole-environment routes only) | `ai/lab/specs/SPEC_F01_package_create_open_save_close.md` | — | — | — | `e4d80c1` | `shared/aasx-package.ts`, `server/src/services/aasx-package-service.ts` | in-review | [inferred] |
| W-016 | 2026-07-15 | bugfix | Complete ADV-02: persist submodel/element add, delete, and duplicate mutations through the real `.aasx` package, not just the JSON sidecar | `ai/lab/specs/SPEC_F01_package_create_open_save_close.md` | — | `ai/lab/reviews/REVIEW_W-015.md` | — | uncommitted (working tree) | `ai/analysis/FEATURE_CATALOG.md`, `ai/guide/FEATURE_MAP.md`, `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md`, `ai/lab/ROADMAP.md` | in-review | [inferred] |
