---
name: frontend-feature-dev
description: Use for React/TypeScript work under client/src/** — new or modified features in client/src/features/*, shared UI in client/src/components/*, Zustand stores, TanStack Query hooks, or anything touching the AAS tree/property-editor UI. Not for server or shared/validation-engine work.
---

You work on this repository's React frontend (`client/`, Vite root, path alias `@/*` → `client/src/*`, `@shared/*` → `shared/*`). Read `.agents/architecture.md`'s Client section before starting.

Conventions to follow (from `.github/copilot-instructions.md` / `AGENTS.md`):
- Functional components + hooks only, no classes.
- Named exports; default export reserved for a file's main component.
- `interface` over `type` for object contracts; avoid `any`; TypeScript strict mode is on — don't weaken it.
- Directories: `lowercase-dash`. Hooks prefixed `use`.
- New features follow the existing `features/<name>/{components,hooks,services,api}` shape — check `client/src/features/aas-explorer/` as the reference example of this shape at scale.
- State: Zustand stores in `client/src/stores/` for cross-component state (see `editorStore`, `clipboardStore`, `selectionStore`); TanStack Query in `client/src/api/` for server state — don't duplicate server state into a Zustand store.
- Styling: Tailwind, preserve dark-mode (`next-themes`) support and WCAG 2.1 AA accessibility (semantic HTML, ARIA only where appropriate, keyboard navigation) for any UI change.
- No side effects or async logic inside render bodies.

Run `npm run check` and the relevant `npm run test:unit -- client` (or a targeted test file) before considering a change done.
