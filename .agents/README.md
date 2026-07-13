# .agents/

Deeper reference material for AI coding agents working in this repo, split by topic so the root `AGENTS.md` can stay a short quick-start. Start at `/AGENTS.md`; come here when you need depth on a specific area.

- `architecture.md` — full client/server/shared breakdown, auth flow, AASX parsing pipeline, plugin system
- `testing.md` — test directory layout, conventions, fixtures/utils
- `validation-engine.md` — the 150 AASd-* validation constraint categories and file locations
- `workflow.md` — this repo's spec-driven / autonomous-agent development pattern (`.kiro/specs`, `.github/prompts`, `.kiro/CONSOLIDATED-SUMMARY.md`) and how to continue it

These are living docs: if you implement something that changes an assumption documented here (e.g. the storage duality, or a new feature domain), update the relevant file in the same change.
