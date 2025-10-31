/**
 * CSV Export Service
 * 
 * Exports AAS Submodel data to CSV format with flattened structure.
 */

import Papa from 'papaparse';
import type { Submodel, SubmodelElement, Property, MultiLanguageProperty } from '../../../shared/aas-v3-types';

export interface CsvExportOptions {
  delimiter?: ',' | ';' | '\t';
  includeHeaders?: boolean;
  encoding?: 'utf-8' | 'utf-16';
}

/**
 * CSV Export Service
 */
export class CsvExportService {
  /**
   * Export submodel to CSV
   */
  exportSubmodel(submodel: Submodel, options: CsvExportOptions = {}): string {
    const rows = this.flattenSubmodel(submodel);
    
    return Papa.unparse(rows, {
      header: options.includeHeaders !== false,
      delimiter: options.delimiter || ',',
      newline: '\n',
      quotes: true,
    });
  }
  
  /**
   * Export multiple submodels to CSV
   */
  exportSubmodels(submodels: Submodel[], options: CsvExportOptions = {}): string {
    const allRows: any[] = [];
    
    submodels.forEach((sm) => {
      const rows = this.flattenSubmodel(sm);
      allRows.push(...rows);
    });
    
    return Papa.unparse(allRows, {
      header: options.includeHeaders !== false,
      delimiter: options.delimiter || ',',
      newline: '\n',
      quotes: true,
    });
  }
  
  /**
   * Flatten submodel to rows
   */
  private flattenSubmodel(submodel: Submodel): any[] {
    const rows: any[] = [];
    
    const traverse = (element: SubmodelElement, path: string[]) => {
      const currentPath = [...path, element.idShort];
      
      if (element.modelType === 'Property') {
        const prop = element as Property;
        rows.push({
          SubmodelId: submodel.id,
          SubmodelIdShort: submodel.idShort || '',
          Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
          IdShort: prop.idShort,
          Type: 'Property',
          ValueType: prop.valueType,
          Value: prop.value || '',
          Category: prop.category || '',
          Description: prop.description?.[0]?.text || '',
          SemanticId: prop.semanticId?.keys?.[0]?.value || '',
        });
      } else if (element.modelType === 'MultiLanguageProperty') {
        const mlProp = element as MultiLanguageProperty;
        
        // Export first language value
        rows.push({
          SubmodelId: submodel.id,
          SubmodelIdShort: submodel.idShort || '',
          Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
          IdShort: mlProp.idShort,
          Type: 'MultiLanguageProperty',
          ValueType: 'string',
          Value: mlProp.value?.[0]?.text || '',
          Language: mlProp.value?.[0]?.language || '',
          Category: mlProp.category || '',
          Description: mlProp.description?.[0]?.text || '',
          SemanticId: mlProp.semanticId?.keys?.[0]?.value || '',
        });
      } else if (element.modelType === 'SubmodelElementCollection') {
        // Recurse into collection
        const collection = element as any;
        if (collection.value && Array.isArray(collection.value)) {
          collection.value.forEach((child: SubmodelElement) => {
            traverse(child, currentPath.filter((p): p is string => p !== undefined));
          });
        }
      } else if (element.modelType === 'SubmodelElementList') {
        // Recurse into list
        const list = element as any;
        if (list.value && Array.isArray(list.value)) {
          list.value.forEach((child: SubmodelElement) => {
            traverse(child, currentPath.filter((p): p is string => p !== undefined));
          });
        }
      } else {
        // Other element types
        rows.push({
          SubmodelId: submodel.id,
          SubmodelIdShort: submodel.idShort || '',
          Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
          IdShort: element.idShort,
          Type: element.modelType,
          ValueType: '',
          Value: '',
          Category: (element as any).category || '',
          Description: element.description?.[0]?.text || '',
          SemanticId: element.semanticId?.keys?.[0]?.value || '',
        });
      }
    };
    
    // Traverse all elements
    submodel.submodelElements?.forEach((el) => {
      traverse(el, [submodel.idShort].filter((p): p is string => p !== undefined));
    });
    
    return rows;
  }
}
