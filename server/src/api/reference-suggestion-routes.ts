/**
 * Reference Suggestion API Routes
 * 
 * Provides endpoints for searching and suggesting AAS elements
 * for reference autocomplete functionality.
 */

import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { referenceSuggestionService } from '../services/reference-suggestion-service';
import type { Environment, KeyTypes } from '../../../shared/aas-v3-types';

const router = Router();

export class ReferenceEnvironmentError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 404
  ) {
    super(message);
    this.name = 'ReferenceEnvironmentError';
  }
}

export async function loadReferenceEnvironment(
  req: Pick<Request, 'query' | 'body'>,
  dataDir: string = path.join(process.cwd(), 'data', 'aasx')
): Promise<Environment> {
  const rawFileId = req.query.fileId ?? req.body?.fileId;
  const fileId = Array.isArray(rawFileId) ? rawFileId[0] : rawFileId;

  if (typeof fileId !== 'string' || fileId.trim() === '') {
    throw new ReferenceEnvironmentError('fileId is required', 400);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(fileId)) {
    throw new ReferenceEnvironmentError('fileId contains unsupported characters', 400);
  }

  try {
    const content = await fs.readFile(
      path.join(dataDir, `${fileId}-environment.json`),
      'utf-8'
    );
    return JSON.parse(content) as Environment;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ReferenceEnvironmentError(`Environment not found for ${fileId}`, 404);
    }
    throw error;
  }
}

function sendRouteError(error: unknown, res: Response, fallback: string): void {
  if (error instanceof ReferenceEnvironmentError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(fallback, error);
  res.status(500).json({ error: fallback });
}

/**
 * GET /api/v1/references/suggestions
 * 
 * Search for element suggestions
 * Query params:
 * - q: search query
 * - type: filter by KeyTypes
 * - limit: max results (default 100)
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { q, type, limit } = req.query;

    const environment = await loadReferenceEnvironment(req);

    // Search suggestions
    const suggestions = await referenceSuggestionService.searchElements(
      environment,
      {
        query: q as string | undefined,
        filterType: type as KeyTypes | undefined,
        maxResults: limit ? parseInt(limit as string, 10) : 100,
      }
    );

    res.json({ suggestions });
  } catch (error) {
    sendRouteError(error, res, 'Failed to get suggestions');
  }
});

/**
 * GET /api/v1/references/suggestions/:id
 * 
 * Get suggestion by element ID
 */
router.get('/suggestions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const environment = await loadReferenceEnvironment(req);

    // Get suggestion
    const suggestion = await referenceSuggestionService.getSuggestionById(
      environment,
      id
    );

    if (!suggestion) {
      return res.status(404).json({ error: 'Element not found' });
    }

    res.json(suggestion);
  } catch (error) {
    sendRouteError(error, res, 'Failed to get suggestion');
  }
});

/**
 * POST /api/v1/references/suggestions/by-semantic-id
 * 
 * Get suggestions by semantic ID
 * Body: { semanticId: Reference }
 */
router.post('/suggestions/by-semantic-id', async (req: Request, res: Response) => {
  try {
    const { semanticId } = req.body;

    if (!semanticId) {
      return res.status(400).json({ error: 'semanticId is required' });
    }

    const environment = await loadReferenceEnvironment(req);

    // Get suggestions
    const suggestions = await referenceSuggestionService.getSuggestionsBySemanticId(
      environment,
      semanticId
    );

    res.json({ suggestions });
  } catch (error) {
    sendRouteError(error, res, 'Failed to get suggestions by semantic ID');
  }
});

/**
 * POST /api/v1/references/clear-cache
 * 
 * Clear the suggestion cache
 */
router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    referenceSuggestionService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
