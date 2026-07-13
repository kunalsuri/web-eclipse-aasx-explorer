# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The imported file above is the canonical, tool-agnostic project guide (commands, architecture, storage duality, testing, code conventions, and this repo's spec-driven agent workflow) — read it first. Everything below is Claude-Code-specific and additive.

## Project config in this repo

- `.claude/settings.json` — a conservative permissions allowlist for common read-only and test/build commands (typecheck, test runs, `git status`/`diff`/`log`). It does not allow anything destructive or state-changing (no push, commit, reset, etc.) — those still prompt.
- `.claude/agents/` — subagents scoped to this codebase's three real domains: `aas-validation-engineer` (shared validation engine / AASd-* constraints), `frontend-feature-dev` (`client/src/features/*`), `backend-service-dev` (`server/src/services`, `server/src/api`, auth). Prefer delegating a domain-scoped task to the matching subagent over doing it inline when the task is large enough to benefit from a focused context.
- `.claude/commands/` — project slash commands: `/aas-check` (typecheck + full test suite), `/spec-status` (summarize `.kiro/CONSOLIDATED-SUMMARY.md` progress and next steps).

## Note on the two doc layers

`/AGENTS.md` + `.agents/*.md` are general-purpose docs meant to work for any agent/tool. `.kiro/specs/*` and `.kiro/CONSOLIDATED-SUMMARY.md` are this project's own tracked planning/status artifacts (see `.agents/workflow.md`). Keep new Claude-Code-only material (hooks, subagents, commands, settings) here and in `.claude/`, not duplicated into `AGENTS.md`.
