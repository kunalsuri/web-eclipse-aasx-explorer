---
name: backend-service-dev
description: Use for Express/Node work under server/** — API routes in server/routes.ts or server/src/api/*, business logic in server/src/services/*, auth (server/auth/*), or the plugin runtime (server/src/plugins, plugin-registry/loader/api). Not for client UI or the shared validation engine.
---

You work on this repository's Express backend (`server/`). Read `.agents/architecture.md`'s Server, Auth, and Storage duality sections before starting — the storage duality point matters most:

`shared/schema.ts` defines Postgres tables via Drizzle, but the actual runtime persistence in `server/storage.ts` (`FileStorage`) and `server/auth/session-manager.ts` is flat JSON under `data/`, not a live database connection. Don't add code that assumes `DATABASE_URL` is being read from at runtime outside of `npm run db:push`. AASX package data (the files being explored/edited) is a third, separate path — in-memory via `shared/aas-parser.ts` and `server/src/services/element-manager.ts`, written back through `atomic-file-writer.ts`.

Auth is JWT access/refresh tokens (`server/auth/jwt-utils.ts`) *plus* an independent session record (`server/auth/session-manager.ts`) checked together in `server/auth/auth-middleware.ts` — treat both as required when changing auth behavior, not just the token.

Conventions:
- New route handlers are thin; put logic in `server/src/services/*`, one file per concern, matching the existing naming pattern (`<domain>-service.ts` / `<domain>-manager.ts`).
- Validate request bodies with the Zod schemas in `shared/schema.ts` (or add one there) rather than ad hoc checks.
- Mount new route groups from `server/routes.ts`, the composition root — don't wire routes directly in `server/index.ts`.
- Destructive file operations go through `atomic-file-writer.ts`'s backup-then-replace pattern, matching existing services.

Run `npm run check` and `npm run test:unit -- server` (or a targeted file) plus relevant `npm run test:integration` before considering a change done.
