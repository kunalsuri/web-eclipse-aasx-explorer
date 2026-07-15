import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupProfile } from "./profile";
import { setupJWTAuthRoutes } from "./auth/jwt-auth-routes";
import { sessionManager } from "./auth/session-manager";
import { handleLogSubmission, handleLogRetrieval } from "./logging-endpoint";
import aasxRoutes from "./aasx-routes";
import clipboardRoutes from "./src/api/clipboard-routes";
import dictionaryRoutes from "./src/api/dictionary-routes";
import deleteRoutes from "./src/api/delete-routes";
import referenceSuggestionRoutes from "./src/api/reference-suggestion-routes";
import pluginRoutes from "./src/api/plugin-routes";
import xmlRoutes from "./src/api/xml-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure session manager is ready
  await sessionManager.ready();

  // Setup JWT-based authentication routes
  setupJWTAuthRoutes(app);

  // Setup profile routes
  setupProfile(app);

  // Setup logging endpoints for browser log persistence
  app.post('/api/logs', handleLogSubmission);
  app.get('/api/logs', handleLogRetrieval);

  // Setup AASX file management routes
  app.use('/api/aasx', aasxRoutes);

  // Setup clipboard routes
  app.use('/api/clipboard', clipboardRoutes);

  // Setup dictionary routes
  app.use('/api/dictionary', dictionaryRoutes);

  // Setup delete operation routes
  app.use('/api/v1', deleteRoutes);

  // Setup reference suggestion routes
  app.use('/api/v1/references', referenceSuggestionRoutes);

  // Setup plugin management routes
  app.use('/api/plugins', pluginRoutes);

  // Setup XML import/export routes (stateless: environment/XML travel in the
  // request body, no data/aasx/ persistence - safe to mount independently of
  // the AASX package routes)
  app.use('/api/xml', xmlRoutes);

  // Additional API routes can be added here
  // prefix all routes with /api
  //
  // NOT mounted, intentionally (ADV-2026-07-14-05, see
  // ai/analysis/audit-reports/DEFECT_TRACEABILITY.md):
  // - server/src/api/aasx/update.ts: a second property/element-update surface
  //   that persists only to the JSON sidecar via element-manager.ts/
  //   update-service.ts, bypassing AasxPackageService. Mounting it would
  //   reopen the ADV-02 bug (edits lost on download) through a second,
  //   uncoordinated code path.
  // - server/src/api/reference-routes.ts: duplicates
  //   src/api/reference-suggestion-routes.ts (already mounted above) with a
  //   stale, never-implemented environment-loading path that
  //   reference-suggestion-routes.ts was specifically bug-fixed to replace.
  // - server/src/api/idta-templates-routes.ts: every handler returns
  //   `501 Not Implemented`; mounting it would expose a stub API with no
  //   real behavior.

  // Start session cleanup interval
  startSessionCleanup();

  const httpServer = createServer(app);
  return httpServer;
}

/**
 * Start periodic session cleanup
 */
function startSessionCleanup(): void {
  setInterval(async () => {
    try {
      await sessionManager.cleanupSessions();
      console.log('Expired sessions cleaned up');
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }, 60 * 60 * 1000); // Every hour
}
