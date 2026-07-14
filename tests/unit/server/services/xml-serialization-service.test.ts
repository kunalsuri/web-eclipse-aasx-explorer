/**
 * XML Serialization Service Tests
 * 
 * Comprehensive test suite for AAS V3.0 XML serialization/deserialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { XMLSerializationService } from '../../../../server/src/services/xml-serialization-service';
import {
  AasSubmodelElements,
  AssetKind,
  DataTypeDefXsd,
  EntityType,
  type Environment,
  type Property,
  type MultiLanguageProperty,
  type Range,
  type SubmodelElementCollection,
  type Entity,
  type Operation,
} from '../../../../shared/aas-v3-types';

describe('XMLSerializationService', () => {
  let service: XMLSerializationService;

  beforeEach(() => {
    service = new XMLSerializationService();
  });

  // ==========================================================================
  // Core Serialization Tests
  // ==========================================================================

  describe('Extension Serialization', () => {
    it('should serialize Extension with all fields', async () => {
      const environment: Environment = {
        assetAdministrationShells: [{
          id: 'test-aas',
          assetInformation: {
            assetKind: AssetKind.Instance,
          },
          extensions: [{
            name: 'TestExtension',
            valueType: DataTypeDefXsd.String,
            value: 'TestValue',
          }],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<extension>');
      expect(xml).toContain('<name>TestExtension</name>');
      expect(xml).toContain('<valueType>xs:string</valueType>');
      expect(xml).toContain('<value>TestValue</value>');
    });

    it('should deserialize Extension correctly', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <aas:environment xmlns:aas="https://admin-shell.io/aas/3/0">
          <aas:assetAdministrationShells>
            <aas:assetAdministrationShell>
              <aas:id>test-aas</aas:id>
              <aas:assetInformation>
                <aas:assetKind>Instance</aas:assetKind>
              </aas:assetInformation>
              <aas:extensions>
                <aas:extension>
                  <aas:name>TestExtension</aas:name>
                  <aas:valueType>xs:string</aas:valueType>
                  <aas:value>TestValue</aas:value>
                </aas:extension>
              </aas:extensions>
            </aas:assetAdministrationShell>
          </aas:assetAdministrationShells>
        </aas:environment>`;

      const environment = await service.deserializeEnvironment(xml);
      expect(environment.assetAdministrationShells).toBeDefined();
      expect(environment.assetAdministrationShells![0].extensions).toBeDefined();
      expect(environment.assetAdministrationShells![0].extensions![0].name).toBe('TestExtension');
    });
  });

  describe('Property Serialization', () => {
    it('should serialize Property with value', async () => {
      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [{
            modelType: AasSubmodelElements.Property,
            idShort: 'TestProperty',
            valueType: DataTypeDefXsd.String,
            value: 'TestValue',
          } as Property],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<property>');
      expect(xml).toContain('<idShort>TestProperty</idShort>');
      expect(xml).toContain('<valueType>xs:string</valueType>');
      expect(xml).toContain('<value>TestValue</value>');
    });

    it('should handle Property round-trip serialization', async () => {
      const original: Property = {
        modelType: AasSubmodelElements.Property,
        idShort: 'Temperature',
        valueType: DataTypeDefXsd.Double,
        value: '25.5',
        category: 'PARAMETER',
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [original],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      const deserialized = await service.deserializeEnvironment(xml);

      const prop = deserialized.submodels![0].submodelElements![0] as Property;
      expect(prop.modelType).toBe(AasSubmodelElements.Property);
      expect(prop.idShort).toBe('Temperature');
      expect(prop.valueType).toBe('xs:double');
      expect(prop.value).toBe('25.5');
      expect(prop.category).toBe('PARAMETER');
    });
  });

  describe('MultiLanguageProperty Serialization', () => {
    it('should serialize MultiLanguageProperty', async () => {
      const mlp: MultiLanguageProperty = {
        modelType: AasSubmodelElements.MultiLanguageProperty,
        idShort: 'Description',
        value: [
          { language: 'en', text: 'English description' },
          { language: 'de', text: 'Deutsche Beschreibung' },
        ],
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [mlp],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<multiLanguageProperty>');
      expect(xml).toContain('English description');
      expect(xml).toContain('Deutsche Beschreibung');
    });
  });

  describe('Range Serialization', () => {
    it('should serialize Range with min and max', async () => {
      const range: Range = {
        modelType: AasSubmodelElements.Range,
        idShort: 'TemperatureRange',
        valueType: DataTypeDefXsd.Double,
        min: '0',
        max: '100',
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [range],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<range>');
      expect(xml).toContain('<min>0</min>');
      expect(xml).toContain('<max>100</max>');
    });
  });

  describe('SubmodelElementCollection Serialization', () => {
    it('should serialize nested SubmodelElementCollection', async () => {
      const collection: SubmodelElementCollection = {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: 'Parameters',
        value: [
          {
            modelType: AasSubmodelElements.Property,
            idShort: 'Param1',
            valueType: DataTypeDefXsd.String,
            value: 'Value1',
          } as Property,
          {
            modelType: AasSubmodelElements.Property,
            idShort: 'Param2',
            valueType: DataTypeDefXsd.Int,
            value: '42',
          } as Property,
        ],
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [collection],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<submodelElementCollection>');
      expect(xml).toContain('Param1');
      expect(xml).toContain('Param2');
    });

    it('should handle recursive collections', async () => {
      const nestedCollection: SubmodelElementCollection = {
        modelType: AasSubmodelElements.SubmodelElementCollection,
        idShort: 'OuterCollection',
        value: [
          {
            modelType: AasSubmodelElements.SubmodelElementCollection,
            idShort: 'InnerCollection',
            value: [
              {
                modelType: AasSubmodelElements.Property,
                idShort: 'NestedProp',
                valueType: DataTypeDefXsd.String,
                value: 'NestedValue',
              } as Property,
            ],
          } as SubmodelElementCollection,
        ],
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [nestedCollection],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      const deserialized = await service.deserializeEnvironment(xml);

      const outer = deserialized.submodels![0].submodelElements![0] as SubmodelElementCollection;
      expect(outer.idShort).toBe('OuterCollection');
      const inner = outer.value![0] as SubmodelElementCollection;
      expect(inner.idShort).toBe('InnerCollection');
      const prop = inner.value![0] as Property;
      expect(prop.idShort).toBe('NestedProp');
    });
  });

  describe('Entity Serialization', () => {
    it('should serialize Entity with statements', async () => {
      const entity: Entity = {
        modelType: AasSubmodelElements.Entity,
        idShort: 'Component',
        entityType: EntityType.CoManagedEntity,
        statements: [
          {
            modelType: AasSubmodelElements.Property,
            idShort: 'SerialNumber',
            valueType: DataTypeDefXsd.String,
            value: 'SN-12345',
          } as Property,
        ],
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [entity],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<entity>');
      expect(xml).toContain('<entityType>CoManagedEntity</entityType>');
      expect(xml).toContain('SerialNumber');
    });
  });

  describe('Operation Serialization', () => {
    it('should serialize Operation with variables', async () => {
      const operation: Operation = {
        modelType: AasSubmodelElements.Operation,
        idShort: 'Calculate',
        inputVariables: [
          {
            value: {
              modelType: AasSubmodelElements.Property,
              idShort: 'InputParam',
              valueType: DataTypeDefXsd.Double,
            } as Property,
          },
        ],
        outputVariables: [
          {
            value: {
              modelType: AasSubmodelElements.Property,
              idShort: 'Result',
              valueType: DataTypeDefXsd.Double,
            } as Property,
          },
        ],
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [operation],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<operation>');
      expect(xml).toContain('<inputVariables>');
      expect(xml).toContain('<outputVariables>');
      expect(xml).toContain('InputParam');
      expect(xml).toContain('Result');
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty Environment', async () => {
      const environment: Environment = {};
      const xml = await service.serializeEnvironment(environment);
      expect(xml).toContain('<environment');
    });

    it('should handle Environment with empty arrays', async () => {
      const environment: Environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      };
      const xml = await service.serializeEnvironment(environment);
      const deserialized = await service.deserializeEnvironment(xml);
      expect(deserialized).toBeDefined();
    });

    it('should handle Property with undefined optional fields', async () => {
      const prop: Property = {
        modelType: AasSubmodelElements.Property,
        valueType: DataTypeDefXsd.String,
      };

      const environment: Environment = {
        submodels: [{
          id: 'test-submodel',
          submodelElements: [prop],
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      const deserialized = await service.deserializeEnvironment(xml);
      expect(deserialized.submodels![0].submodelElements).toHaveLength(1);
    });
  });

  describe('Validation', () => {
    it('should validate well-formed XML', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <aas:environment xmlns:aas="https://admin-shell.io/aas/3/0">
        </aas:environment>`;

      const result = await service.validateXml(xml);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect malformed XML', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <aas:environment xmlns:aas="https://admin-shell.io/aas/3/0">
          <unclosed-tag>
        </aas:environment>`;

      const result = await service.validateXml(xml);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Complete Environment Round-Trip', () => {
    it('should handle complex Environment with all element types', async () => {
      const environment: Environment = {
        assetAdministrationShells: [{
          id: 'test-aas',
          idShort: 'TestAAS',
          assetInformation: {
            assetKind: AssetKind.Instance,
            globalAssetId: 'urn:example:asset:123',
          },
        }],
        submodels: [{
          id: 'test-submodel',
          idShort: 'TestSubmodel',
          submodelElements: [
            {
              modelType: AasSubmodelElements.Property,
              idShort: 'Prop1',
              valueType: DataTypeDefXsd.String,
              value: 'Value1',
            } as Property,
            {
              modelType: AasSubmodelElements.Range,
              idShort: 'Range1',
              valueType: DataTypeDefXsd.Double,
              min: '0',
              max: '100',
            } as Range,
          ],
        }],
        conceptDescriptions: [{
          id: 'test-cd',
          idShort: 'TestCD',
        }],
      };

      const xml = await service.serializeEnvironment(environment);
      const deserialized = await service.deserializeEnvironment(xml);

      // Verify structure
      expect(deserialized.assetAdministrationShells).toHaveLength(1);
      expect(deserialized.submodels).toHaveLength(1);
      expect(deserialized.conceptDescriptions).toHaveLength(1);

      // Verify AAS
      expect(deserialized.assetAdministrationShells![0].id).toBe('test-aas');
      expect(deserialized.assetAdministrationShells![0].assetInformation.assetKind).toBe('Instance');

      // Verify Submodel
      expect(deserialized.submodels![0].id).toBe('test-submodel');
      expect(deserialized.submodels![0].submodelElements).toHaveLength(2);

      // Verify SubmodelElements
      const prop = deserialized.submodels![0].submodelElements![0] as Property;
      expect(prop.modelType).toBe(AasSubmodelElements.Property);
      expect(prop.idShort).toBe('Prop1');

      const range = deserialized.submodels![0].submodelElements![1] as Range;
      expect(range.modelType).toBe(AasSubmodelElements.Range);
      expect(range.idShort).toBe('Range1');
    });
  });
});
