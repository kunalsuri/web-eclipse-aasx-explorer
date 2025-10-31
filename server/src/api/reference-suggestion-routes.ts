/**
 * Reference Suggestion API Routes
 * 
 * Provides endpoints for searching and suggesting AAS elements
 * for reference autocomplete functionality.
 */

import { Router, type Request, type Response } from 'express';
import { referenceSuggestionService } from '../services/reference-suggestion-service';
import type { KeyTypes } from '../../../shared/aas-v3-types';

const router = Router();

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

    // Get environment from storage
    const environment = (req as any).environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not loaded' });
    }

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
    console.error('Failed to get suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
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

    // Get environment from storage
    const environment = (req as any).environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not loaded' });
    }

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
    console.error('Failed to get suggestion:', error);
    res.status(500).json({ error: 'Failed to get suggestion' });
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

    // Get environment from storage
    const environment = (req as any).environment;
    if (!environment) {
      return res.status(500).json({ error: 'Environment not loaded' });
    }

    // Get suggestions
    const suggestions = await referenceSuggestionService.getSuggestionsBySemanticId(
      environment,
      semanticId
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Failed to get suggestions by semantic ID:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
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
