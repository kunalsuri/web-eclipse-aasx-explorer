/**
 * DELETE API Routes
 * 
 * Endpoints for deleting AAS elements
 */

import { Router, type Request, type Response } from 'express';
import { ElementManager } from '../services/element-manager';
import { NotFoundError, type ElementPath } from '../services/element-finder';

const router = Router();
const elementManager = new ElementManager();

/**
 * DELETE /api/v1/shells/:shellId
 * Delete an Asset Administration Shell
 */
router.delete('/shells/:shellId', async (req: Request, res: Response) => {
  try {
    const { shellId } = req.params;
    const { force } = req.query;
    const fileId = (req as any).fileId || 'default';
    const userId = (req as any).user?.id || 'anonymous';

    // Check for dependencies
    const dependencies = await elementManager.findShellDependencies(fileId, shellId);
    if (dependencies.length > 0 && force !== 'true') {
      return res.status(409).json({
        error: 'Shell has dependencies',
        message: 'Cannot delete shell with existing dependencies. Use force=true to override.',
        dependencies: dependencies.map(d => ({
          type: d.type,
          count: d.count,
          ids: d.ids
        }))
      });
    }

    // Delete shell
    await elementManager.deleteShell(fileId, shellId, userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting shell:', error);
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: 'Shell not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete shell', details: error.message });
  }
});

/**
 * DELETE /api/v1/submodels/:submodelId
 * Delete a Submodel
 */
router.delete('/submodels/:submodelId', async (req: Request, res: Response) => {
  try {
    const { submodelId } = req.params;
    const fileId = (req as any).fileId || 'default';
    const userId = (req as any).user?.id || 'anonymous';

    // Delete submodel (automatically removes references from shells)
    await elementManager.deleteSubmodel(fileId, submodelId, userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting submodel:', error);
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: 'Submodel not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete submodel', details: error.message });
  }
});

/**
 * DELETE /api/v1/submodels/:submodelId/submodel-elements/:idShortPath
 * Delete a SubmodelElement
 */
router.delete('/submodels/:submodelId/submodel-elements/:idShortPath', async (req: Request, res: Response) => {
  try {
    const { submodelId, idShortPath } = req.params;
    const fileId = (req as any).fileId || 'default';
    const userId = (req as any).user?.id || 'anonymous';

    // Parse idShort path
    const pathSegments: ElementPath[] = idShortPath.split('.').map(segment => ({
      type: 'element' as const,
      id: segment
    }));

    // Add submodel to path
    const fullPath: ElementPath[] = [
      { type: 'submodel' as const, id: submodelId },
      ...pathSegments
    ];

    // Delete element
    await elementManager.removeElement(fileId, fullPath, userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting element:', error);
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: 'Element not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete element', details: error.message });
  }
});

export default router;
