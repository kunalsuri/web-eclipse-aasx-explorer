import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyPanel } from '../property-panel';
import type { Property, Submodel, AssetAdministrationShell } from '../../../../../../shared';

describe('PropertyPanel', () => {
  it('renders empty state when no node is provided', () => {
    render(<PropertyPanel node={null} />);
    expect(screen.getByText(/select a node from the tree/i)).toBeInTheDocument();
  });

  it('renders property element correctly', () => {
    const propertyNode = {
      id: 'prop-1',
      label: 'Temperature',
      type: 'submodelElement' as const,
      data: {
        modelType: 'Property',
        idShort: 'Temperature',
        valueType: 'xs:double',
        value: '25.5',
      } as Property,
    };

    render(<PropertyPanel node={propertyNode} />);
    expect(screen.getAllByText('Temperature').length).toBeGreaterThan(0);
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getAllByText('25.5').length).toBeGreaterThan(0);
  });

  it('renders submodel element correctly', () => {
    const submodelNode = {
      id: 'sm-1',
      label: 'Technical Data',
      type: 'submodel' as const,
      data: {
        id: 'https://example.com/submodel/1',
        idShort: 'TechnicalData',
        kind: 'Instance',
        modelType: 'Submodel',
        submodelElements: [],
      } as Submodel,
    };

    render(<PropertyPanel node={submodelNode} />);
    expect(screen.getByText('Technical Data')).toBeInTheDocument();
    expect(screen.getByText('submodel')).toBeInTheDocument();
  });

  it('renders AAS element correctly', () => {
    const aasNode = {
      id: 'aas-1',
      label: 'My AAS',
      type: 'aas' as const,
      data: {
        id: 'https://example.com/aas/1',
        idShort: 'MyAAS',
        assetInformation: {
          assetKind: 'Instance',
          globalAssetId: 'https://example.com/asset/1',
        },
        submodels: [],
      } as AssetAdministrationShell,
    };

    render(<PropertyPanel node={aasNode} />);
    expect(screen.getByText('My AAS')).toBeInTheDocument();
    expect(screen.getByText('aas')).toBeInTheDocument();
  });

  it('renders tabs for properties and metadata', () => {
    const propertyNode = {
      id: 'prop-1',
      label: 'Temperature',
      type: 'submodelElement' as const,
      data: {
        modelType: 'Property',
        idShort: 'Temperature',
        valueType: 'xs:double',
        value: '25.5',
        category: 'PARAMETER',
        description: [
          { language: 'en', text: 'Temperature sensor reading' },
        ],
      } as Property,
    };

    render(<PropertyPanel node={propertyNode} />);
    expect(screen.getByRole('tab', { name: /properties/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /metadata/i })).toBeInTheDocument();
  });

  it('renders multi-language property correctly', () => {
    const mlpNode = {
      id: 'mlp-1',
      label: 'Description',
      type: 'submodelElement' as const,
      data: {
        modelType: 'MultiLanguageProperty',
        idShort: 'Description',
        value: [
          { language: 'en', text: 'English description' },
          { language: 'de', text: 'Deutsche Beschreibung' },
        ],
      },
    };

    render(<PropertyPanel node={mlpNode} />);
    expect(screen.getAllByText('Description').length).toBeGreaterThan(0);
    expect(screen.getByText('MultiLanguageProperty')).toBeInTheDocument();
    expect(screen.getAllByText('English description').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Deutsche Beschreibung').length).toBeGreaterThan(0);
  });

  it('renders range element correctly', () => {
    const rangeNode = {
      id: 'range-1',
      label: 'Temperature Range',
      type: 'submodelElement' as const,
      data: {
        modelType: 'Range',
        idShort: 'TemperatureRange',
        valueType: 'xs:double',
        min: '0',
        max: '100',
      },
    };

    render(<PropertyPanel node={rangeNode} />);
    expect(screen.getByText('Temperature Range')).toBeInTheDocument();
    expect(screen.getByText('Range')).toBeInTheDocument();
  });

  it('renders collection element correctly', () => {
    const collectionNode = {
      id: 'coll-1',
      label: 'Parameters',
      type: 'submodelElement' as const,
      data: {
        modelType: 'SubmodelElementCollection',
        idShort: 'Parameters',
        value: [
          {
            modelType: 'Property',
            idShort: 'Param1',
            valueType: 'xs:string',
            value: 'Value1',
          },
        ],
      },
    };

    render(<PropertyPanel node={collectionNode} />);
    expect(screen.getAllByText('Parameters').length).toBeGreaterThan(0);
    expect(screen.getByText('SubmodelElementCollection')).toBeInTheDocument();
    expect(screen.getByText('Elements')).toBeInTheDocument();
  });
});
