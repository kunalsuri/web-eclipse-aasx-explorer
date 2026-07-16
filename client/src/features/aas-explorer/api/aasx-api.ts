/**
 * AASX API Client
 * Functions for interacting with AASX backend API
 */

import type { Environment, SubmodelElement } from '../../../../../shared';
import { authenticatedFetch } from '@/features/auth/utils/jwt-auth-utils';

/**
 * Update a property value in the environment
 */
export async function updatePropertyValue(
  fileId: string,
  propertyPath: string,
  value: any
): Promise<void> {
  const response = await authenticatedFetch(`/api/aasx/environment/${fileId}/property`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      propertyPath,
      value,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update property');
  }

  return response.json();
}

/**
 * Update entire environment
 */
export async function updateEnvironment(
  fileId: string,
  environment: Environment
): Promise<void> {
  const response = await authenticatedFetch(`/api/aasx/environment/${fileId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ environment }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update environment');
  }

  return response.json();
}

/**
 * Find property path in environment
 * Returns the path string like "submodels[0].submodelElements[2].value"
 */
export function findPropertyPath(
  environment: Environment,
  element: SubmodelElement
): string | null {
  // Search through submodels
  for (let smIndex = 0; smIndex < (environment.submodels?.length || 0); smIndex++) {
    const submodel = environment.submodels![smIndex];
    
    // Search through submodel elements
    for (let elIndex = 0; elIndex < (submodel.submodelElements?.length || 0); elIndex++) {
      const el = submodel.submodelElements![elIndex];
      
      if (el.idShort === element.idShort) {
        return `submodels[${smIndex}].submodelElements[${elIndex}].value`;
      }
    }
  }
  
  return null;
}
