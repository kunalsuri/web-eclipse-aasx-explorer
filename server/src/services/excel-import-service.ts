/**
 * Excel Import Service
 * 
 * Imports property updates from Excel files with validation.
 */

import ExcelJS from 'exceljs';

export interface ImportResult {
  success: boolean;
  updates?: PropertyUpdate[];
  errors?: ValidationError[];
}

export interface PropertyUpdate {
  path: string[];
  idShort: string;
  value: any;
  valueType?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Excel Import Service
 */
export class ExcelImportService {
  /**
   * Import properties from Excel file
   */
  async importProperties(fileBuffer: Buffer): Promise<ImportResult> {
    try {
      // Read workbook
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);

      // Get Properties sheet
      const propertiesSheet = workbook.getWorksheet('Properties');
      if (!propertiesSheet) {
        return {
          success: false,
          errors: [{ row: 0, field: 'sheet', message: 'Properties sheet not found' }],
        };
      }

      const properties = sheetToJson(propertiesSheet);

      // Validate
      const errors = this.validateImport(properties);
      if (errors.length > 0) {
        return { success: false, errors };
      }
      
      // Map to updates
      const updates = this.mapToAasUpdates(properties);
      
      return { success: true, updates };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [{ row: 0, field: 'file', message: `Failed to parse Excel: ${message}` }],
      };
    }
  }
  
  /**
   * Validate import data
   */
  private validateImport(data: any[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    data.forEach((row, index) => {
      // Required fields
      if (!row.Path) {
        errors.push({ row: index + 2, field: 'Path', message: 'Path is required' });
      }
      
      if (!row.IdShort) {
        errors.push({ row: index + 2, field: 'IdShort', message: 'IdShort is required' });
      }
      
      if (row.Value === undefined || row.Value === null) {
        errors.push({ row: index + 2, field: 'Value', message: 'Value is required' });
      }
      
      // Type validation
      if (row.ValueType && row.Value !== undefined && row.Value !== null) {
        if (!this.isValidType(row.Value, row.ValueType)) {
          errors.push({
            row: index + 2,
            field: 'Value',
            message: `Invalid value type for ${row.ValueType}`,
          });
        }
      }
      
      // Path format validation
      if (row.Path && typeof row.Path === 'string') {
        if (!row.Path.includes(' > ')) {
          errors.push({
            row: index + 2,
            field: 'Path',
            message: 'Path must use " > " separator',
          });
        }
      }
    });
    
    return errors;
  }
  
  /**
   * Validate value type
   */
  private isValidType(value: any, valueType: string): boolean {
    switch (valueType) {
      case 'xs:int':
      case 'xs:integer':
      case 'xs:long':
        return !isNaN(parseInt(value, 10));
      
      case 'xs:double':
      case 'xs:float':
      case 'xs:decimal':
        return !isNaN(parseFloat(value));
      
      case 'xs:boolean':
        return value === true || value === false || value === 'true' || value === 'false';
      
      case 'xs:string':
        return typeof value === 'string';
      
      default:
        return true; // Allow unknown types
    }
  }
  
  /**
   * Map Excel data to AAS updates
   */
  private mapToAasUpdates(data: any[]): PropertyUpdate[] {
    return data.map((row) => ({
      path: row.Path.split(' > '),
      idShort: row.IdShort,
      value: this.parseValue(row.Value, row.ValueType),
      valueType: row.ValueType,
    }));
  }
  
  /**
   * Parse value based on type
   */
  private parseValue(value: any, valueType?: string): any {
    if (!valueType) return value;
    
    switch (valueType) {
      case 'xs:int':
      case 'xs:integer':
      case 'xs:long':
        return parseInt(value, 10);
      
      case 'xs:double':
      case 'xs:float':
      case 'xs:decimal':
        return parseFloat(value);
      
      case 'xs:boolean':
        return value === true || value === 'true';
      
      default:
        return value;
    }
  }
}

/**
 * Convert a worksheet to an array of row objects keyed by the header row,
 * mirroring the shape XLSX.utils.sheet_to_json produced.
 */
function sheetToJson(worksheet: ExcelJS.Worksheet): any[] {
  const rows: any[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values as any[];
    if (rowNumber === 1) {
      headers = values.slice(1).map((v) => String(v ?? ''));
      return;
    }

    const obj: any = {};
    headers.forEach((header, index) => {
      const cellValue = values[index + 1];
      if (cellValue !== undefined && cellValue !== null) {
        obj[header] = cellValue;
      }
    });
    rows.push(obj);
  });

  return rows;
}
