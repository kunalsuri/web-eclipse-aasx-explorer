<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# Feature roadmap — web-eclipse-aasx-explorer

> The single living feature roadmap, and the **cousin of `ai/lab/WORKLOG.md`**.
> Two sections: **Planned** (spec-grade entries so an agent can implement a feature
> cold) and **Shipped** (thin pointer rows).
>
> **Lifecycle of one feature:** born in **Planned** → when work starts, its detail
> migrates into `ai/lab/specs/SPEC_<id>.md` → when it ships, its row moves to
> **Shipped**, cross-linking its spec, its `ai/lab/WORKLOG.md` row(s), and its PR —
> by **feature ID**, never by copying fields. WORKLOG is *per-work-unit*; this file
> is *per-feature*. Everything here is `[inferred]` until a human audits it.

## How to use this file (the linking protocol)

1. Pick ONE feature from **Planned**. Draft its spec (copy
   `ai/lab/specs/SPEC_TEMPLATE.md` to `ai/lab/specs/SPEC_<id>.md`) and put the spec
   path in the Planned row's **Spec** cell.
2. Implement it via `/add-feature` (features) — the loop ends by moving the row here.
3. **On ship:** move the row from Planned to Shipped; append a `ai/lab/WORKLOG.md`
   row citing the feature ID; fill the Shipped row's **Spec**, **WORKLOG**, and
   **PR** cells. Backtick the **Spec** path so `verify --strict` checks it (the
   WORKLOG cell holds a row ID like `W-001`, which `verify` does not treat as a path).
4. Forward-looking or illustrative detail (example paths, not-yet-created files) can
   be fenced with `verify-ignore` markers so it is not treated as a broken claim.

## Planned

| ID | Feature | Priority | Effort | Depends on | Spec | Status |
|---|---|---|---|---|---|---|
| F10-XML | AAS V3 XML structural round-trip contract | P1 | M | F10 import/export infrastructure | `ai/lab/specs/FEATURE_activate_xml_round_trip.md` | in progress `[inferred]` |
| F05-EDIT | Property editing and undo/redo workflow coverage | P1 | S | F05/F06 editing infrastructure | `ai/lab/specs/FEATURE_activate_editing_workflows.md` | in progress `[inferred]` |
<!-- Example row (delete once you add real ones):
| F1 | Short feature name | P1 | M | — | `ai/lab/specs/SPEC_<id>.md` | idea |
-->

Status values: `idea` → `spec drafted` → `in progress` → `shipped` (or `dropped`).

## Shipped

| ID | Feature | Spec | WORKLOG | PR | Shipped |
|---|---|---|---|---|---|
| F01 | AAS package create/open/save/close parity (genuine OPC/ZIP `.aasx`, transactional save across all mutation routes) | `ai/lab/specs/SPEC_F01_package_create_open_save_close.md` | `W-015`, `W-016` | — | 2026-07-15 |
<!-- Example row (delete once you ship something):
| F1 | Short feature name | `ai/lab/specs/SPEC_<id>.md` | `W-<n>` | #<pr> | <date> |
-->
