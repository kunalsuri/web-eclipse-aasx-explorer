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

  // Additional API routes can be added here
  // prefix all routes with /api

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
