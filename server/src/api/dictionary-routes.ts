/**
 * Dictionary API Routes
 * RESTful endpoints for dictionary operations (ECLASS, IEC CDD)
 * 
 * Based on C# Import.cs patterns
 */

import { Router, Request, Response } from 'express';
import { dictionaryService } from '../services/dictionary-service';
import { z } from 'zod';
import { DictionarySource } from '../../../shared/dictionary-types';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting: 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all dictionary routes
router.use(limiter);

// Validation schemas
const SearchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  source: z.enum(['eclass', 'ieccdd', 'all']).optional().default('all'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  filters: z.object({
    dataType: z.array(z.string()).optional(),
    unit: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    hasValueList: z.boolean().optional(),
    classificationPath: z.array(z.string()).optional(),
  }).optional(),
  sortBy: z.enum(['relevance', 'name', 'id', 'hierarchicalPosition']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const AutocompleteRequestSchema = z.object({
  query: z.string().min(2).max(200),
  limit: z.number().int().min(1).max(20).optional().default(10),
});

const GetConceptRequestSchema = z.object({
  source: z.enum(['eclass', 'ieccdd']),
  conceptId: z.string().min(1),
});

const ImportConceptRequestSchema = z.object({
  concept: z.any(), // DictionaryConcept
  fileId: z.string().optional(),
});

const ValidateConceptRequestSchema = z.object({
  concept: z.any(), // DictionaryConcept
});

const ClearCacheRequestSchema = z.object({
  source: z.enum(['eclass', 'ieccdd']).optional(),
});

/**
 * GET /api/dictionary/search
 * Search for concepts in dictionaries
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const validated = SearchRequestSchema.parse({
      query: req.query.q,
      source: req.query.source,
      limit: req.query.limit ? Number.parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? Number.parseInt(req.query.offset as string) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    let results;
    const options = {
      limit: validated.limit,
      offset: validated.offset,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
    };

    if (validated.source === 'eclass') {
      results = await dictionaryService.searchECLASS(validated.query, options);
    } else if (validated.source === 'ieccdd') {
      results = await dictionaryService.searchIECCDD(validated.query, options);
    } else {
      results = await dictionaryService.searchAll(validated.query, options);
    }

    res.json({
      success: true,
      data: {
        results,
        query: validated.query,
        source: validated.source,
        total: results.length,
        limit: validated.limit,
        offset: validated.offset,
      },
      message: `Found ${results.length} concepts`,
    });
  } catch (error) {
    console.error('Dictionary search error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search dictionary',
    });
  }
});

/**
 * GET /api/dictionary/autocomplete
 * Get autocomplete suggestions
 */
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const validated = AutocompleteRequestSchema.parse({
      query: req.query.q,
      limit: req.query.limit ? Number.parseInt(req.query.limit as string) : undefined,
    });

    const suggestions = await dictionaryService.getAutocompleteSuggestions(
      validated.query,
      validated.limit
    );

    res.json({
      success: true,
      data: {
        suggestions,
        query: validated.query,
      },
      message: `Found ${suggestions.length} suggestions`,
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get autocomplete suggestions',
    });
  }
});

/**
 * GET /api/dictionary/concept/:source/:conceptId
 * Get a specific concept by ID
 */
router.get('/concept/:source/:conceptId', async (req: Request, res: Response) => {
  try {
    const validated = GetConceptRequestSchema.parse({
      source: req.params.source,
      conceptId: decodeURIComponent(req.params.conceptId),
    });

    const source = validated.source === 'eclass' ? DictionarySource.ECLASS : DictionarySource.IECCDD;
    const concept = await dictionaryService.getConceptById(source, validated.conceptId);

    res.json({
      success: true,
      data: concept,
      message: 'Concept retrieved successfully',
    });
  } catch (error) {
    console.error('Get concept error:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get concept',
    });
  }
});

/**
 * POST /api/dictionary/import
 * Import a concept as ConceptDescription
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const validated = ImportConceptRequestSchema.parse(req.body);

    const conceptDescription = await dictionaryService.importConcept(validated.concept);

    res.json({
      success: true,
      data: conceptDescription,
      message: 'Concept imported successfully',
    });
  } catch (error) {
    console.error('Import concept error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import concept',
    });
  }
});

/**
 * POST /api/dictionary/validate
 * Validate a concept against AAS V3 requirements
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const validated = ValidateConceptRequestSchema.parse(req.body);

    const validationResult = await dictionaryService.validateConcept(validated.concept);

    res.json({
      success: true,
      data: validationResult,
      message: validationResult.isValid ? 'Concept is valid' : 'Concept validation failed',
    });
  } catch (error) {
    console.error('Validate concept error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate concept',
    });
  }
});

/**
 * DELETE /api/dictionary/cache/:source?
 * Clear dictionary cache
 */
router.delete('/cache/:source?', async (req: Request, res: Response) => {
  try {
    const source = req.params.source as 'eclass' | 'ieccdd' | undefined;
    
    if (source) {
      const validated = ClearCacheRequestSchema.parse({ source });
      const dictSource = validated.source === 'eclass' ? DictionarySource.ECLASS : DictionarySource.IECCDD;
      await dictionaryService.clearCache(dictSource);
    } else {
      await dictionaryService.clearCache();
    }

    res.json({
      success: true,
      message: source ? `Cache cleared for ${source}` : 'All cache cleared',
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache',
    });
  }
});

/**
 * GET /api/dictionary/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = await dictionaryService.getCacheStats();

    res.json({
      success: true,
      data: stats,
      message: 'Cache stats retrieved',
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cache stats',
    });
  }
});

export default router;
