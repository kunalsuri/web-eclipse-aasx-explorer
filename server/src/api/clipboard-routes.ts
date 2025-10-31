/**
 * Clipboard API Routes
 * RESTful endpoints for clipboard operations
 */

import { Router, Request, Response } from 'express';
import { clipboardManager } from '../services/clipboard-manager';
import { z } from 'zod';
import type { SubmodelElement } from '../../../shared/aas-v3-types';

const router = Router();

// Validation schemas
const CopyRequestSchema = z.object({
  element: z.any(), // SubmodelElement
  sourcePackageId: z.string(),
  sourceElementPath: z.array(z.string()),
});

const PasteRequestSchema = z.object({
  targetPackageId: z.string(),
  targetParentPath: z.array(z.string()),
  regenerateIds: z.boolean().optional().default(true),
  updateReferences: z.boolean().optional().default(true),
  preserveSemanticIds: z.boolean().optional().default(true),
});

const DuplicateRequestSchema = z.object({
  element: z.any(), // SubmodelElement
  packageId: z.string(),
  parentPath: z.array(z.string()),
});

/**
 * POST /api/clipboard/copy
 * Copy element to clipboard
 */
router.post('/copy', (req: Request, res: Response) => {
  try {
    const validated = CopyRequestSchema.parse(req.body);
    
    const result = clipboardManager.copy(
      validated.element as SubmodelElement,
      validated.sourcePackageId,
      validated.sourceElementPath
    );

    res.json({
      success: true,
      data: {
        operation: result.operation,
        timestamp: result.timestamp,
        metadata: result.metadata,
      },
      message: 'Element copied to clipboard',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy element',
    });
  }
});

/**
 * POST /api/clipboard/cut
 * Cut element to clipboard
 */
router.post('/cut', (req: Request, res: Response) => {
  try {
    const validated = CopyRequestSchema.parse(req.body);
    
    const result = clipboardManager.cut(
      validated.element as SubmodelElement,
      validated.sourcePackageId,
      validated.sourceElementPath
    );

    res.json({
      success: true,
      data: {
        operation: result.operation,
        timestamp: result.timestamp,
        metadata: result.metadata,
      },
      message: 'Element cut to clipboard',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cut element',
    });
  }
});

/**
 * POST /api/clipboard/paste
 * Paste element from clipboard
 */
router.post('/paste', (req: Request, res: Response) => {
  try {
    const validated = PasteRequestSchema.parse(req.body);
    
    const result = clipboardManager.paste({
      targetPackageId: validated.targetPackageId,
      targetParentPath: validated.targetParentPath,
      regenerateIds: validated.regenerateIds,
      updateReferences: validated.updateReferences,
      preserveSemanticIds: validated.preserveSemanticIds,
    });

    res.json({
      success: true,
      data: {
        element: result.element,
        idMapping: Object.fromEntries(result.idMapping),
        updatedReferences: result.updatedReferences,
        warnings: result.warnings,
      },
      message: 'Element pasted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to paste element',
    });
  }
});

/**
 * GET /api/clipboard
 * Get current clipboard content
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const clipboard = clipboardManager.getClipboard();
    
    if (!clipboard) {
      res.json({
        success: true,
        data: null,
        message: 'Clipboard is empty',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        element: clipboard.element,
        operation: clipboard.operation,
        sourcePackageId: clipboard.sourcePackageId,
        sourceElementPath: clipboard.sourceElementPath,
        timestamp: clipboard.timestamp,
        metadata: clipboard.metadata,
      },
      message: 'Clipboard content retrieved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get clipboard',
    });
  }
});

/**
 * DELETE /api/clipboard
 * Clear clipboard
 */
router.delete('/', (req: Request, res: Response) => {
  try {
    clipboardManager.clear();
    
    res.json({
      success: true,
      message: 'Clipboard cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear clipboard',
    });
  }
});

/**
 * GET /api/clipboard/stats
 * Get clipboard statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = clipboardManager.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Clipboard stats retrieved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get clipboard stats',
    });
  }
});

/**
 * POST /api/clipboard/duplicate
 * Duplicate element (copy + paste in one operation)
 */
router.post('/duplicate', (req: Request, res: Response) => {
  try {
    const validated = DuplicateRequestSchema.parse(req.body);
    
    const result = clipboardManager.duplicate(
      validated.element as SubmodelElement,
      validated.packageId,
      validated.parentPath
    );

    res.json({
      success: true,
      data: {
        element: result.element,
        idMapping: Object.fromEntries(result.idMapping),
        updatedReferences: result.updatedReferences,
        warnings: result.warnings,
      },
      message: 'Element duplicated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate element',
    });
  }
});

export default router;
