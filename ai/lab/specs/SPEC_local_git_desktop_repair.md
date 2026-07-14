<!-- Copyright (c) 2026 Kunal Suri (CEA LIST). All rights reserved. -->
# SPEC: Local Git and GitHub Desktop repair

> **Status:** approved · **Date:** 2026-07-14 · **Issue:** user-requested local repository audit · **Provenance:** [inferred]

## Problem

The local checkout showed merged topic branches after their remote branches had
been deleted, `main` was behind `origin/main`, and GitHub Desktop fetch/pull
operations failed for this repository.

## Scope

- Audit local branches, upstream tracking, repository integrity, and the current
  GitHub Desktop log.
- Preserve all untracked files.
- Refresh and prune remote-tracking refs.
- Fast-forward `main` to `origin/main` without creating a merge commit.
- Delete only local topic branches proven merged into `origin/main`.
- Apply the smallest repository-local transport setting needed for normal Git
  commands to use the Windows certificate store.

Application source, untracked tool files, other local repositories, and GitHub
CLI authentication are out of scope.

## Touch list

| Location | Stability | Change |
|---|---|---|
| Local Git refs and worktree | local metadata | Refresh, fast-forward, and safely prune merged branches |
| Local `.git/config` | local metadata | Set `http.sslBackend=schannel` |
| `ai/lab/` | ours | Record the authorized maintenance and verification evidence |

## Acceptance

1. A normal `git fetch --prune origin` succeeds.
2. `main` and `origin/main` resolve to the same commit.
3. Only `main` remains as a local branch.
4. `git fsck --full --no-reflogs` reports no invalid refs or missing objects.
5. The pull command recorded as failing by GitHub Desktop reports the checkout
   is up to date.
6. Pre-existing untracked files remain untouched.

## Rollback

The SSL override can be removed with
`git config --unset --local http.sslBackend`. Deleted merged branches can be
recreated from commits `c9605a0` and `1efcf0b` if historical local branch names
are ever needed again.
