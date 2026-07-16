# How this repo is built: spec-driven, autonomous agent development

This project's history is almost entirely AI-agent-driven, using a consistent pattern across many sessions. Follow it rather than starting from scratch on a feature-sized task.

## The pattern

1. **Spec first.** For any non-trivial feature or bugfix, a spec file is created at `ai/lab/specs/<TYPE>_<name>.md` (copy `ai/lab/specs/SPEC_TEMPLATE.md` or `ai/lab/specs/BUGFIX_TEMPLATE.md`), written so it can be implemented without further design decisions. Check `ai/lab/specs/` for an existing one before writing your own plan. (An older generation of specs lived under `.kiro/specs/<feature-name>/` as `requirements.md`/`design.md`/`tasks.md`; that folder was removed 2026-07-16 as superseded — `.kiro/specs/csharp-to-typescript-feature-mapping/` had documented the feature-parity analysis methodology against the C# desktop app (`x-external-proj`), now captured in `ai/analysis/CSHARP_TO_TYPESCRIPT_PARITY_AUDIT_2026-07-14.md`.)
2. **Autonomous execution.** `.github/prompts/autonomus-code-implementation.prompt.md` and related files in `.github/prompts/` are the historical instruction templates used to drive implementation phases. Their operating mode: given finalized requirements/design/tasks, implement completely (no placeholders/partial code), write comprehensive tests, self-review, and only pause for a genuinely missing or contradictory requirement — not for routine confirmation. When a task in this repo matches that shape (spec exists, scope is clear), match that mode rather than checking in after every file.
3. **Tests land with the feature.** Every unit of work recorded in `ai/lab/WORKLOG.md` ships with its tests in the same change — evaluation is not a follow-up step.
4. **Progress is tracked centrally.** `ai/lab/WORKLOG.md` is the append-only ledger of what shipped, when, and under which spec. `ai/lab/ROADMAP.md` holds the Planned/Shipped feature list. `ai/analysis/FEATURE_CATALOG.md` is the current, source-backed per-feature wiring status (Reachable / Partial / Infrastructure-only / Scaffold-only). When you complete a work unit, append a WORKLOG row and update the relevant ROADMAP/FEATURE_CATALOG entries in the same change — don't leave them stale, since they're what the next agent session reads to know what's already done.

## Practical implications for an agent session here

- Before implementing a "big" feature, grep `ai/lab/specs/` for a matching file and read it fully.
- Before claiming something is "missing," check `ai/analysis/FEATURE_CATALOG.md` — it may already be built, or explicitly listed as Partial/Infrastructure-only/Scaffold-only with a reason. It is source-backed, not a self-reported estimate — trust it over any percentage-style claim (the historical `.kiro/CONSOLIDATED-SUMMARY.md` snapshot, removed 2026-07-16, had claimed "78%+ feature parity" and "150/150 validation constraints"; the "150/150" figure included 33 fabricated non-IDTA constraint IDs, removed 2026-07-15 — see `ai/analysis/audit-reports/DEFECT_TRACEABILITY.md` — the real registered count is 117).
- Prefer full, tested implementations over partial ones for anything spec-sized; it's fine to ask when a requirement is genuinely undefined, but the established norm here is to resolve smaller ambiguities yourself and keep going.
- If you finish a unit of work, append its row to `ai/lab/WORKLOG.md` in the same change (see `ai/lab/WORKLOG.md`'s own rules for format).

## Why multiple layers of docs exist

`/AGENTS.md` + `.agents/*.md` (this file included) describe the codebase and conventions in general, for any AI tool. `ai/lab/specs/*`, `ai/lab/WORKLOG.md`, and `ai/lab/ROADMAP.md` are this project's own tracked planning/status artifacts, produced by past agent sessions as part of doing the work — read those for "what's been done and what's next," and this file for "how work here is generally structured."
