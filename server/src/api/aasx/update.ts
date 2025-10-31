/**
 * AASX Update Endpoints
 * Handles property and element updates with validation
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { updateService } from '../../services/update-service';
import { elementManager } from '../../services/element-manager';
import { ValidationError } from '../../services/update-service';
import { NotFoundError } from '../../services/element-finder';
import type { ElementPath } from '../../services/element-finder';
import type { SubmodelElement, LangStringTextType } from '../../../../shared/aas-v3-types';

const router = Router();

// Validation schemas
const PropertyUpdateSchema = z.object({
  value: z.any(),
  expectedVersion: z.number().optional(),
});

const ElementUpdateSchema = z.object({
  updates: z.record(z.any()),
  expectedVersion: z.number().optional(),
});

const MultiLanguageUpdateSchema = z.object({
  value: z.array(z.object({
    language: z.string(),
    text: z.string(),
  })),
  expectedVersion: z.number().optional(),
});

const AddElementSchema = z.object({
  element: z.any(),
  position: z.number().optional(),
});

const ReorderSchema = z.object({
  newOrder: z.array(z.string()),
});

const ElementPathSchema = z.array(z.object({
  type: z.enum(['aas', 'submodel', 'element', 'conceptDescription']),
  id: z.string(),
}));


/**
 * PATCH /api/aasx/:id/property
 * Update a property value by path
 */
router.patch('/:id/property', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { elementPath, ...updateData } = req.body;
    const validated = PropertyUpdateSchema.parse(updateData);
    const path = ElementPathSchema.parse(elementPath) as ElementPath[];

    // Check for version conflict
    if (validated.expectedVersion) {
      const hasConflict = await updateService.hasConflict(id, validated.expectedVersion);
      if (hasConflict) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'File has been modified by another user',
          },
        });
      }
    }

    const userId = (req as any).user?.id || 'anonymous';
    const result = await updateService.updatePropertyValue(
      id,
      path,
      validated.value,
      userId
    );

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: {
        element: result.element,
        version: result.version,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          errors: error.errors,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update property',
      },
    });
  }
});

/**
 * PATCH /api/aasx/:id/element
 * Update an element (multiple properties)
 */
router.patch('/:id/element', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { elementPath, ...updateData } = req.body;
    const validated = ElementUpdateSchema.parse(updateData);
    const path = ElementPathSchema.parse(elementPath) as ElementPath[];

    // Check for version conflict
    if (validated.expectedVersion) {
      const hasConflict = await updateService.hasConflict(id, validated.expectedVersion);
      if (hasConflict) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'File has been modified by another user',
          },
        });
      }
    }

    const userId = (req as any).user?.id || 'anonymous';
    const result = await updateService.updateElement(
      id,
      path,
      validated.updates,
      userId
    );

    res.json({
      success: true,
      message: 'Element updated successfully',
      data: {
        element: result.element,
        version: result.version,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          errors: error.errors,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update element',
      },
    });
  }
});

/**
 * PATCH /api/aasx/:id/multi-language
 * Update multi-language property
 */
router.patch('/:id/multi-language', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { elementPath, ...updateData } = req.body;
    const validated = MultiLanguageUpdateSchema.parse(updateData);
    const path = ElementPathSchema.parse(elementPath) as ElementPath[];

    const userId = (req as any).user?.id || 'anonymous';
    const result = await updateService.updateMultiLanguageProperty(
      id,
      path,
      validated.value as LangStringTextType[],
      userId
    );

    res.json({
      success: true,
      message: 'Multi-language property updated successfully',
      data: {
        element: result.element,
        version: result.version,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          errors: error.errors,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update multi-language property',
      },
    });
  }
});

/**
 * POST /api/aasx/:id/element/add
 * Add a new element to a container
 */
router.post('/:id/element/add', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parentPath, ...addData } = req.body;
    const validated = AddElementSchema.parse(addData);
    const path = ElementPathSchema.parse(parentPath) as ElementPath[];

    const userId = (req as any).user?.id || 'anonymous';
    const result = await elementManager.addElement(
      id,
      path,
      validated.element as SubmodelElement,
      validated.position,
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Element added successfully',
      data: {
        element: result.element,
        index: result.index,
        version: result.version,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          errors: error.errors,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_FAILED',
        message: error instanceof Error ? error.message : 'Failed to add element',
      },
    });
  }
});

/**
 * DELETE /api/aasx/:id/element
 * Remove an element from its container
 */
router.delete('/:id/element', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { elementPath } = req.body;
    const path = ElementPathSchema.parse(elementPath) as ElementPath[];

    const userId = (req as any).user?.id || 'anonymous';
    const result = await elementManager.removeElement(id, path, userId);

    res.json({
      success: true,
      message: 'Element removed successfully',
      data: {
        removedElement: result.removedElement,
        version: result.version,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to remove element',
      },
    });
  }
});

/**
 * PATCH /api/aasx/:id/element/reorder
 * Reorder elements within a container
 */
router.patch('/:id/element/reorder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parentPath, ...reorderData } = req.body;
    const validated = ReorderSchema.parse(reorderData);
    const path = ElementPathSchema.parse(parentPath) as ElementPath[];

    const userId = (req as any).user?.id || 'anonymous';
    const result = await elementManager.reorderElements(
      id,
      path,
      validated.newOrder,
      userId
    );

    res.json({
      success: true,
      message: 'Elements reordered successfully',
      data: {
        newOrder: result.newOrder,
        version: result.version,
        timestamp: result.timestamp,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          errors: error.errors,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'REORDER_FAILED',
        message: error instanceof Error ? error.message : 'Failed to reorder elements',
      },
    });
  }
});

/**
 * GET /api/aasx/:id/version
 * Get current file version for optimistic locking
 */
router.get('/:id/version', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = await updateService.getFileVersion(id);

    res.json({
      success: true,
      data: {
        version,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VERSION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get version',
      },
    });
  }
});

/**
 * POST /api/aasx/:id/restore
 * Restore from most recent backup
 */
router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await updateService.restoreFromBackup(id);

    res.json({
      success: true,
      message: 'File restored from backup successfully',
      data: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RESTORE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to restore from backup',
      },
    });
  }
});

export default router;
