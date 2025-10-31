import type {
  Environment,
  AssetAdministrationShell,
  Submodel,
  AssetInformation,
  Reference,
} from '@shared/aas-v3-types';
import {
  AssetKind,
  ReferenceTypes,
  KeyTypes,
  ModelingKind,
} from '@shared/aas-v3-types';

/**
 * Create a minimal empty environment
 */
export const createMinimalEnvironment = (): Environment => ({
  assetAdministrationShells: [],
  submodels: [],
  conceptDescriptions: [],
});

/**
 * Create basic asset information
 */
export const createBasicAssetInformation = (
  assetKind: AssetKind = AssetKind.Instance,
  globalAssetId?: string
): AssetInformation => ({
  assetKind,
  globalAssetId,
});

/**
 * Create a basic AAS with minimal required fields
 */
export const createBasicAAS = (
  id: string = 'https://example.com/aas/1',
  idShort: string = 'TestAAS'
): AssetAdministrationShell => ({
  id,
  idShort,
  assetInformation: createBasicAssetInformation(),
});

/**
 * Create a basic submodel with minimal required fields
 */
export const createBasicSubmodel = (
  id: string = 'https://example.com/sm/1',
  idShort: string = 'TestSubmodel'
): Submodel => ({
  id,
  idShort,
  kind: ModelingKind.Instance,
  submodelElements: [],
});

/**
 * Create a model reference to a submodel
 */
export const createSubmodelReference = (submodelId: string): Reference => ({
  type: ReferenceTypes.ModelReference,
  keys: [
    {
      type: KeyTypes.Submodel,
      value: submodelId,
    },
  ],
});

/**
 * Create an environment with a specified number of AAS
 */
export const createEnvironmentWithAAS = (aasCount: number = 1): Environment => {
  const aasArray = Array.from({ length: aasCount }, (_, i) =>
    createBasicAAS(`https://example.com/aas/${i}`, `AAS${i}`)
  );

  return {
    assetAdministrationShells: aasArray,
    submodels: [],
    conceptDescriptions: [],
  };
};

/**
 * Create an environment with a specified number of submodels
 */
export const createEnvironmentWithSubmodels = (
  submodelCount: number = 1
): Environment => {
  const submodels = Array.from({ length: submodelCount }, (_, i) =>
    createBasicSubmodel(`https://example.com/sm/${i}`, `Submodel${i}`)
  );

  return {
    assetAdministrationShells: [],
    submodels,
    conceptDescriptions: [],
  };
};

/**
 * Create a complete environment with AAS and linked submodel
 */
export const createCompleteEnvironment = (): Environment => {
  const aas = createBasicAAS();
  const submodel = createBasicSubmodel();

  // Link submodel to AAS
  aas.submodels = [createSubmodelReference(submodel.id)];

  return {
    assetAdministrationShells: [aas],
    submodels: [submodel],
    conceptDescriptions: [],
  };
};

/**
 * Create an environment with multiple AAS and submodels
 */
export const createLargeEnvironment = (
  aasCount: number = 10,
  submodelsPerAAS: number = 3
): Environment => {
  const aasArray: AssetAdministrationShell[] = [];
  const submodelArray: Submodel[] = [];

  for (let i = 0; i < aasCount; i++) {
    const aas = createBasicAAS(
      `https://example.com/aas/${i}`,
      `AAS${i}`
    );

    const submodelRefs: Reference[] = [];

    for (let j = 0; j < submodelsPerAAS; j++) {
      const submodelId = `https://example.com/sm/${i}-${j}`;
      const submodel = createBasicSubmodel(submodelId, `Submodel${i}_${j}`);
      submodelArray.push(submodel);
      submodelRefs.push(createSubmodelReference(submodelId));
    }

    aas.submodels = submodelRefs;
    aasArray.push(aas);
  }

  return {
    assetAdministrationShells: aasArray,
    submodels: submodelArray,
    conceptDescriptions: [],
  };
};

/**
 * Create an AAS with specific asset information
 */
export const createAASWithAssetInfo = (
  id: string,
  idShort: string,
  assetKind: AssetKind,
  globalAssetId?: string
): AssetAdministrationShell => ({
  id,
  idShort,
  assetInformation: createBasicAssetInformation(assetKind, globalAssetId),
});

/**
 * Create a submodel with semantic ID
 */
export const createSubmodelWithSemanticId = (
  id: string,
  idShort: string,
  semanticId: string
): Submodel => ({
  id,
  idShort,
  kind: ModelingKind.Instance,
  semanticId: {
    type: ReferenceTypes.ExternalReference,
    keys: [
      {
        type: KeyTypes.GlobalReference,
        value: semanticId,
      },
    ],
  },
  submodelElements: [],
});
