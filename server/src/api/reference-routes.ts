/**
 * Reference API Routes
 * 
 * Endpoints for reference autocomplete and suggestions
 */

import { Router, type Request, type Response } from 'express';
import { referenceSuggestionService } from '../services/reference-suggestion-service';
import type { KeyTypes } from '../../../shared/aas-v3-types';

const router = Router();

/**
 * GET /api/references/suggestions
 * Search for reference suggestions
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { query, filterType, maxResults } = req.query;

    // Get environment from storage (you'll need to implement this based on your storage)
    const environment = await getEnvironmentFromStorage(req);

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    const suggestions = await referenceSuggestionService.searchElements(
      environment,
      {
        query: query as string | undefined,
        filterType: filterType as KeyTypes | undefined,
        maxResults: maxResults ? parseInt(maxResults as string) : undefined,
      }
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Error searching references:', error);
    res.status(500).json({ error: 'Failed to search references' });
  }
});

/**
 * GET /api/references/by-semantic-id
 * Get suggestions by semantic ID
 */
router.get('/by-semantic-id', async (req: Request, res: Response) => {
  try {
    const { semanticId } = req.query;

    if (!semanticId) {
      return res.status(400).json({ error: 'semanticId is required' });
    }

    const environment = await getEnvironmentFromStorage(req);

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    // Parse semantic ID from query string
    const parsedSemanticId = JSON.parse(semanticId as string);

    const suggestions = await referenceSuggestionService.getSuggestionsBySemanticId(
      environment,
      parsedSemanticId
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions by semantic ID:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * GET /api/references/:id
 * Get suggestion by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const environment = await getEnvironmentFromStorage(req);

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    const suggestion = await referenceSuggestionService.getSuggestionById(
      environment,
      id
    );

    if (!suggestion) {
      return res.status(404).json({ error: 'Reference not found' });
    }

    res.json({ suggestion });
  } catch (error) {
    console.error('Error getting reference:', error);
    res.status(500).json({ error: 'Failed to get reference' });
  }
});

/**
 * POST /api/references/clear-cache
 * Clear the reference suggestion cache
 */
router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    referenceSuggestionService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * Helper function to get environment from storage
 * This should be implemented based on your storage mechanism
 */
async function getEnvironmentFromStorage(req: Request): Promise<any> {
  // TODO: Implement based on your storage mechanism
  // For now, return a mock or throw an error
  throw new Error('getEnvironmentFromStorage not implemented');
}

export default router;
