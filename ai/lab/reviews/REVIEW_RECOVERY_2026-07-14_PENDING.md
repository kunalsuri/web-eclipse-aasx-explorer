<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Review handoff: 2026-07-14 recovery changes `[inferred]`

> **Status:** pending fresh-context review · **Author of changes:** Codex
>
> This is a review request, not a verdict. The repository review workflow requires
> a reviewer that did not author the implementation.

## Scope

- `ai/lab/specs/BUGFIX_vitest_workspace_path_resolution.md`
- `ai/lab/specs/BUGFIX_legacy_aasx_xml_migration.md`
- `ai/lab/specs/BUGFIX_windows_atomic_rename_retry.md`
- `ai/lab/specs/BUGFIX_production_build_start_contract.md`
- `ai/lab/specs/BUGFIX_restore_create_admin_command.md`
- `ai/lab/specs/FEATURE_activate_xml_round_trip.md`
- `ai/lab/specs/FEATURE_activate_editing_workflows.md`
- `ai/lab/specs/BUGFIX_update_service_skipped_contracts.md`
- `ai/lab/specs/BUGFIX_reference_suggestion_environment_loading.md`
- `ai/lab/specs/BUGFIX_activate_colocated_client_tests.md`

## Evidence available to the fresh reviewer

- `npm run check`: pass.
- `npm test`: 610 passed, 0 failed, 0 skipped.
- `npm run build`: pass; emits `dist/public/index.html` and `dist/server.js`.
- `node --check dist/server.js`: pass.
- Production smoke: `npm start` served `/` at HTTP 200 on 127.0.0.1:5000.
- Golden master: all eight complete legacy environments deep-equal the C# output.

## Required review focus

1. Legacy V1/V2 migration semantics and intentionally lossy fields.
2. Atomic rename retry classification and cleanup behavior.
3. Production bundle externalization and session startup-state ownership.
4. Admin creation validation, duplicate handling, promotion, and rollback.
5. XML namespace/round-trip boundaries and the explicit lack of official-XSD proof.
6. MultiLanguageProperty validation recursion and latest-backup selection.
7. Activated property editing and undo/redo integration contracts.
8. Reference `fileId` validation, environment loading, and route error mapping.
9. Colocated test collection and initial property-value validation lifecycle.
9. Commit `86c32d7` also changed `data/sessions.json`; determine whether that
   runtime session record must be removed in a follow-up commit and whether any
   active credentials need rotation. Do not rewrite published history casually.
