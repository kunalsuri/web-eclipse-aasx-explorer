/**
 * Excel Export Service
 * 
 * Exports AAS Environment data to Excel format with multiple sheets.
 * Supports multi-language properties and metadata.
 */

import ExcelJS from 'exceljs';
import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  SubmodelElement,
  Property,
  MultiLanguageProperty,
} from '../../../shared/aas-v3-types';

export interface ExcelExportOptions {
  includeMetadata?: boolean;
  multiLanguage?: boolean;
  template?: 'flat' | 'hierarchical';
}

/**
 * Excel Export Service
 */
export class ExcelExportService {
  /**
   * Export entire environment to Excel
   */
  async exportEnvironment(env: Environment, options: ExcelExportOptions = {}): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Asset Administration Shells
    addSheet(workbook, 'Shells', this.extractShells(env));

    // Sheet 2: Submodels
    addSheet(workbook, 'Submodels', this.extractSubmodels(env));

    // Sheet 3: Properties
    addSheet(workbook, 'Properties', this.extractProperties(env, options));

    // Sheet 4: Metadata (optional)
    if (options.includeMetadata) {
      addSheet(workbook, 'Metadata', this.extractMetadata(env));
    }

    // Generate binary
    const binary = await workbook.xlsx.writeBuffer();
    return Buffer.from(binary);
  }
  
  /**
   * Extract shells data
   */
  private extractShells(env: Environment): any[] {
    return env.assetAdministrationShells?.map((shell) => ({
      ID: shell.id,
      IdShort: shell.idShort,
      AssetKind: shell.assetInformation?.assetKind,
      GlobalAssetId: shell.assetInformation?.globalAssetId,
      Description: shell.description?.[0]?.text || '',
      SubmodelCount: shell.submodels?.length || 0,
    })) || [];
  }
  
  /**
   * Extract submodels data
   */
  private extractSubmodels(env: Environment): any[] {
    return env.submodels?.map((sm) => ({
      ID: sm.id,
      IdShort: sm.idShort,
      SemanticId: sm.semanticId?.keys?.[0]?.value || '',
      Kind: sm.kind,
      Description: sm.description?.[0]?.text || '',
      ElementCount: sm.submodelElements?.length || 0,
    })) || [];
  }
  
  /**
   * Extract properties data
   */
  private extractProperties(env: Environment, options: ExcelExportOptions): any[] {
    const properties: any[] = [];
    
    env.submodels?.forEach((sm) => {
      this.traverseElements(
        sm.submodelElements || [],
        [sm.idShort].filter((p): p is string => p !== undefined),
        properties,
        options
      );
    });
    
    return properties;
  }
  
  /**
   * Traverse elements recursively
   */
  private traverseElements(
    elements: SubmodelElement[],
    path: string[],
    result: any[],
    options: ExcelExportOptions
  ): void {
    elements.forEach((el) => {
      const currentPath = [...path, el.idShort];
      
      if (el.modelType === 'Property') {
        const prop = el as Property;
        result.push({
          Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
          IdShort: prop.idShort,
          Type: 'Property',
          ValueType: prop.valueType,
          Value: prop.value || '',
          Category: prop.category || '',
          Description: prop.description?.[0]?.text || '',
          SemanticId: prop.semanticId?.keys?.[0]?.value || '',
        });
      } else if (el.modelType === 'MultiLanguageProperty') {
        const mlProp = el as MultiLanguageProperty;
        
        if (options.multiLanguage) {
          // Export each language as separate row
          mlProp.value?.forEach((langString) => {
            result.push({
              Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
              IdShort: mlProp.idShort,
              Type: 'MultiLanguageProperty',
              Language: langString.language,
              Value: langString.text,
              Category: mlProp.category || '',
              Description: mlProp.description?.[0]?.text || '',
              SemanticId: mlProp.semanticId?.keys?.[0]?.value || '',
            });
          });
        } else {
          // Export only first language
          result.push({
            Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
            IdShort: mlProp.idShort,
            Type: 'MultiLanguageProperty',
            Value: mlProp.value?.[0]?.text || '',
            Category: mlProp.category || '',
            Description: mlProp.description?.[0]?.text || '',
            SemanticId: mlProp.semanticId?.keys?.[0]?.value || '',
          });
        }
      } else if (el.modelType === 'SubmodelElementCollection') {
        // Recurse into collection
        this.traverseElements(
          (el as any).value || [],
          currentPath.filter((p): p is string => p !== undefined),
          result,
          options
        );
      } else if (el.modelType === 'SubmodelElementList') {
        // Recurse into list
        this.traverseElements(
          (el as any).value || [],
          currentPath.filter((p): p is string => p !== undefined),
          result,
          options
        );
      } else {
        // Other element types
        result.push({
          Path: currentPath.filter((p): p is string => p !== undefined).join(' > '),
          IdShort: el.idShort,
          Type: el.modelType,
          Value: '',
          Category: (el as any).category || '',
          Description: el.description?.[0]?.text || '',
          SemanticId: el.semanticId?.keys?.[0]?.value || '',
        });
      }
    });
  }
  
  /**
   * Extract metadata
   */
  private extractMetadata(env: Environment): any[] {
    return [
      {
        Property: 'Export Date',
        Value: new Date().toISOString(),
      },
      {
        Property: 'AAS Count',
        Value: env.assetAdministrationShells?.length || 0,
      },
      {
        Property: 'Submodel Count',
        Value: env.submodels?.length || 0,
      },
      {
        Property: 'Concept Description Count',
        Value: env.conceptDescriptions?.length || 0,
      },
    ];
  }
}

/**
 * Append a worksheet built from an array of flat row objects, mirroring
 * what XLSX.utils.json_to_sheet + book_append_sheet produced: one column
 * per key found across the rows, one row per array entry.
 */
function addSheet(workbook: ExcelJS.Workbook, name: string, data: any[]): void {
  const worksheet = workbook.addWorksheet(name);
  if (data.length === 0) {
    return;
  }

  const headerSet = new Set<string>();
  data.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  worksheet.columns = headers.map((header) => ({ header, key: header }));
  worksheet.addRows(data);
}
