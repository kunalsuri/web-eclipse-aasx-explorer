# How this repo is built: spec-driven, autonomous agent development

This project's history is almost entirely AI-agent-driven, using a consistent pattern across many sessions. Follow it rather than starting from scratch on a feature-sized task.

## The pattern

1. **Spec first.** For any non-trivial feature, a spec folder is created at `.kiro/specs/<feature-name>/` containing `requirements.md`, `design.md`, and `tasks.md` (sometimes an `analysis-output/` with catalogs/reports for larger audits). Check for an existing one before writing your own plan — e.g. `.kiro/specs/csharp-to-typescript-feature-mapping/` documents the feature-parity analysis methodology against the C# desktop app (`x-external-proj`).
2. **Autonomous execution.** `.github/prompts/autonomus-code-implementation.prompt.md` and related files in `.github/prompts/` are the historical instruction templates used to drive implementation phases. Their operating mode: given finalized requirements/design/tasks, implement completely (no placeholders/partial code), write comprehensive tests, self-review, and only pause for a genuinely missing or contradictory requirement — not for routine confirmation. When a task in this repo matches that shape (spec exists, scope is clear), match that mode rather than checking in after every file.
3. **Tests land with the feature.** Every phase in `.kiro/CONSOLIDATED-SUMMARY.md`'s history includes "Tests Added" alongside "Files Created/Modified" — evaluation is not a follow-up step.
4. **Progress is tracked centrally.** `.kiro/CONSOLIDATED-SUMMARY.md` is the running status document: feature-parity % against the C# app, the 150-constraint validation breakdown, plugin coverage (currently 2/18 plugins implemented — see its "Remaining Gaps" section), and a phased roadmap (`🎯 NEXT STEPS TO 100% PARITY`) with estimated effort per phase. When you complete a phase-sized chunk of work, update its tables — don't leave it stale, since it's what the next agent session reads to know what's already done.

## Practical implications for an agent session here

- Before implementing a "big" feature, grep `.kiro/specs/` for a matching folder and read its `tasks.md`.
- Before claiming something is "missing," check `.kiro/CONSOLIDATED-SUMMARY.md` — it may already be built (this codebase reached 78%+ feature parity and 150/150 validation constraints through exactly this process) or explicitly listed as a known gap with an estimate.
- Prefer full, tested implementations over partial ones for anything spec-sized; it's fine to ask when a requirement is genuinely undefined, but the established norm here is to resolve smaller ambiguities yourself and keep going.
- If you finish a phase, update `.kiro/CONSOLIDATED-SUMMARY.md`'s relevant table(s) in the same change.

## Why two layers of docs exist

`/AGENTS.md` + `.agents/*.md` (this file included) describe the codebase and conventions in general. `.kiro/specs/*` and `.kiro/CONSOLIDATED-SUMMARY.md` are the project's own tracked planning/status artifacts, produced by past agent sessions as part of doing the work — read the latter for "what's been done and what's next," and this file for "how work here is generally structured."
