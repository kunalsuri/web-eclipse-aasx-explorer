<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# REVIEW: W-003 — Local Git and GitHub Desktop repair

> **Date:** 2026-07-14 · **Spec:** `ai/lab/specs/SPEC_local_git_desktop_repair.md` · **Ledger row:** W-003 · **Provenance:** [inferred]
> **Reviewer:** Codex operational verification · **Verdict:** approve

## Scope reviewed

Repository-local branch/ref state, the local SSL backend setting, preservation
of untracked files, and the exact fetch/pull path that GitHub Desktop reported
as failing. No application source files were changed.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Remote refresh | pass | `git fetch --prune origin` exited 0 using the persisted local setting |
| Main synchronization | pass | `HEAD` and `origin/main` both resolved to `d5ed7c611835f1998867cf0bd5a6a3ca62bc3aed` |
| Branch cleanup | pass | `git branch -vv` listed only `main`; both deleted branches were proven ancestors of `origin/main` before deletion |
| Repository integrity | pass | `git fsck --full --no-reflogs` exited 0; reported only recoverable dangling objects |
| Desktop failure path | pass | `git -c rebase.backend=merge pull --ff --recurse-submodules --progress origin` exited 0 with `Already up to date.` |
| User files preserved | pass | The original untracked `.agents/`, `.claude/settings.local.json`, and `.codex/` paths remain present |

## Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | major | GitHub Desktop logged a missing-object Codex checkpoint ref for this repository | The checkpoint ref now resolves to a valid object; integrity and the Desktop-equivalent pull both pass |
| 2 | major | System Git's configured OpenSSL CA path failed issuer validation in this environment | Persisted the successfully tested repository-local `schannel` backend |
| 3 | minor | GitHub CLI's separately stored token is invalid | Left unchanged because Desktop uses a separate credential path and CLI authentication is outside this repository repair |
| 4 | minor | Strict knowledge verification reports 14 pre-existing missing path claims in the merged guide documents | The W-003 spec and review paths were individually confirmed; guide rewrites are outside this Git repair and prohibited without a dedicated audit |

## Human check

Refresh this repository once in GitHub Desktop and confirm its prior red error
banner clears. Desktop's log also contains errors belonging to other repositories;
those are intentionally not mutated by this repository-scoped repair.
