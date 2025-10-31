/**
 * XML Import/Export API Routes
 * 
 * Endpoints for XML serialization and deserialization
 */

import { Router, type Request, type Response } from 'express';
import { xmlSerializationService } from '../services/xml-serialization-service';
import { xmlDeserializationService } from '../services/xml-deserialization-service';
import { schemaValidator, ValidationMode } from '../services/xml-schema-validator';

const router = Router();

/**
 * POST /api/xml/export
 * Export environment to XML
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { environment, options } = req.body;

    if (!environment) {
      return res.status(400).json({ error: 'Environment is required' });
    }

    // Serialize to XML
    const xml = await xmlSerializationService.serializeEnvironment(environment);

    // Set headers for download
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="environment.xml"');

    res.send(xml);
  } catch (error: any) {
    console.error('Error exporting XML:', error);
    res.status(500).json({ error: 'Failed to export XML', details: error.message });
  }
});

/**
 * POST /api/xml/import
 * Import environment from XML
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { xml, validationMode } = req.body;

    if (!xml) {
      return res.status(400).json({ error: 'XML content is required' });
    }

    // Set validation mode
    if (validationMode) {
      schemaValidator.setMode(validationMode as ValidationMode);
    }

    // Validate XML
    const format = { version: '3.0', type: 'AAS' as const };
    const validation = await schemaValidator.validate(xml, format);

    if (!validation.isValid && schemaValidator.getMode() === ValidationMode.STRICT) {
      return res.status(400).json({
        error: 'XML validation failed',
        validation,
      });
    }

    // Parse XML
    const result = await xmlDeserializationService.parseEnvironment(xml);

    if (result.errors.length > 0 && schemaValidator.getMode() === ValidationMode.STRICT) {
      return res.status(400).json({
        error: 'XML parsing failed',
        result,
      });
    }

    res.json({
      environment: result.data,
      warnings: result.warnings,
      errors: result.errors,
      validation,
    });
  } catch (error: any) {
    console.error('Error importing XML:', error);
    res.status(500).json({ error: 'Failed to import XML', details: error.message });
  }
});

/**
 * POST /api/xml/validate
 * Validate XML without importing
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { xml, validationMode } = req.body;

    if (!xml) {
      return res.status(400).json({ error: 'XML content is required' });
    }

    // Set validation mode
    if (validationMode) {
      schemaValidator.setMode(validationMode as ValidationMode);
    }

    // Validate XML
    const format = { version: '3.0', type: 'AAS' as const };
    const validation = await schemaValidator.validate(xml, format);

    res.json({ validation });
  } catch (error: any) {
    console.error('Error validating XML:', error);
    res.status(500).json({ error: 'Failed to validate XML', details: error.message });
  }
});

export default router;
