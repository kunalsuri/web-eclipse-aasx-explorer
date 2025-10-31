/**
 * Package Creation Wizard
 * 
 * Step-by-step wizard for creating new AASX packages from scratch
 * Implements P0-5: Package Creation from Scratch
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, Package } from "lucide-react";
import type { Environment, AssetAdministrationShell, Submodel } from "@/../../shared/aas-v3-types";
import { AssetKind, ModelingKind, ReferenceTypes, KeyTypes } from "@/../../shared/aas-v3-types";

interface PackageCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (environment: Environment) => void;
}

interface WizardData {
  // Package info
  packageName: string;
  packageDescription: string;

  // AAS info
  aasId: string;
  aasIdShort: string;
  aasDescription: string;

  // Asset info
  assetKind: AssetKind;
  globalAssetId: string;
  assetType: string;

  // Submodel info
  includeSubmodel: boolean;
  submodelId: string;
  submodelIdShort: string;
  submodelDescription: string;
  submodelSemanticId: string;
}

export function PackageCreationWizard({
  open,
  onOpenChange,
  onComplete,
}: PackageCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    packageName: "NewPackage",
    packageDescription: "",
    aasId: generateId("aas"),
    aasIdShort: "NewAAS",
    aasDescription: "",
    assetKind: AssetKind.Instance,
    globalAssetId: generateId("asset"),
    assetType: "",
    includeSubmodel: true,
    submodelId: generateId("submodel"),
    submodelIdShort: "NewSubmodel",
    submodelDescription: "",
    submodelSemanticId: "",
  });

  const totalSteps = 4;

  function handleNext(): void {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  }

  function handleBack(): void {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function handleComplete(): void {
    const environment = createEnvironmentFromData(data);
    onComplete(environment);
    handleReset();
  }

  function handleReset(): void {
    setStep(1);
    setData({
      packageName: "NewPackage",
      packageDescription: "",
      aasId: generateId("aas"),
      aasIdShort: "NewAAS",
      aasDescription: "",
      assetKind: AssetKind.Instance,
      globalAssetId: generateId("asset"),
      assetType: "",
      includeSubmodel: true,
      submodelId: generateId("submodel"),
      submodelIdShort: "NewSubmodel",
      submodelDescription: "",
      submodelSemanticId: "",
    });
    onOpenChange(false);
  }

  function updateData(field: keyof WizardData, value: any): void {
    setData({ ...data, [field]: value });
  }

  const canProceed = validateStep(step, data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New AASX Package - Step {step} of {totalSteps}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[400px] py-4">
          {/* Step 1: Package Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Package Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Basic information about the AASX package you're creating.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">
                    Package Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="packageName"
                    value={data.packageName}
                    onChange={(e) => updateData("packageName", e.target.value)}
                    placeholder="MyPackage"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packageDescription">Description</Label>
                  <Textarea
                    id="packageDescription"
                    value={data.packageDescription}
                    onChange={(e) => updateData("packageDescription", e.target.value)}
                    placeholder="Describe the purpose of this package..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Asset Administration Shell */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Asset Administration Shell</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure the main Asset Administration Shell.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aasIdShort">
                      ID Short <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="aasIdShort"
                      value={data.aasIdShort}
                      onChange={(e) => updateData("aasIdShort", e.target.value)}
                      placeholder="MyAAS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aasId">
                      Identifier <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="aasId"
                      value={data.aasId}
                      onChange={(e) => updateData("aasId", e.target.value)}
                      placeholder="https://example.com/aas/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aasDescription">Description</Label>
                  <Textarea
                    id="aasDescription"
                    value={data.aasDescription}
                    onChange={(e) => updateData("aasDescription", e.target.value)}
                    placeholder="Describe this AAS..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Asset Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Asset Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Information about the physical or logical asset.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetKind">
                      Asset Kind <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={data.assetKind}
                      onValueChange={(val) => updateData("assetKind", val as AssetKind)}
                    >
                      <SelectTrigger id="assetKind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AssetKind.Instance}>Instance</SelectItem>
                        <SelectItem value={AssetKind.Type}>Type</SelectItem>
                        <SelectItem value={AssetKind.NotApplicable}>Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="globalAssetId">Global Asset ID</Label>
                    <Input
                      id="globalAssetId"
                      value={data.globalAssetId}
                      onChange={(e) => updateData("globalAssetId", e.target.value)}
                      placeholder="Unique asset identifier"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type</Label>
                  <Input
                    id="assetType"
                    value={data.assetType}
                    onChange={(e) => updateData("assetType", e.target.value)}
                    placeholder="e.g., Motor, Pump, Sensor"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Optional Submodel */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Initial Submodel (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Optionally create an initial submodel for your AAS.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSubmodel"
                    checked={data.includeSubmodel}
                    onChange={(e) => updateData("includeSubmodel", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="includeSubmodel" className="cursor-pointer">
                    Create an initial submodel
                  </Label>
                </div>

                {data.includeSubmodel && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="submodelIdShort">ID Short</Label>
                        <Input
                          id="submodelIdShort"
                          value={data.submodelIdShort}
                          onChange={(e) => updateData("submodelIdShort", e.target.value)}
                          placeholder="MySubmodel"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="submodelId">Identifier</Label>
                        <Input
                          id="submodelId"
                          value={data.submodelId}
                          onChange={(e) => updateData("submodelId", e.target.value)}
                          placeholder="https://example.com/submodel/..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submodelSemanticId">Semantic ID</Label>
                      <Input
                        id="submodelSemanticId"
                        value={data.submodelSemanticId}
                        onChange={(e) => updateData("submodelSemanticId", e.target.value)}
                        placeholder="https://example.com/semantics/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submodelDescription">Description</Label>
                      <Textarea
                        id="submodelDescription"
                        value={data.submodelDescription}
                        onChange={(e) => updateData("submodelDescription", e.target.value)}
                        placeholder="Describe this submodel..."
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <div className="p-4 border rounded-lg bg-muted/50 mt-4">
                  <h4 className="font-semibold mb-3">Package Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Package Name:</dt>
                      <dd className="font-medium">{data.packageName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">AAS:</dt>
                      <dd className="font-medium">{data.aasIdShort}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Asset Kind:</dt>
                      <dd className="font-medium">{data.assetKind}</dd>
                    </div>
                    {data.includeSubmodel && (
                      <div>
                        <dt className="text-muted-foreground">Initial Submodel:</dt>
                        <dd className="font-medium">{data.submodelIdShort}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!canProceed}>
                <Check className="h-4 w-4 mr-1" />
                Create Package
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Validate current step
 */
function validateStep(step: number, data: WizardData): boolean {
  const idShortPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;

  switch (step) {
    case 1:
      return data.packageName.trim() !== "";
    case 2:
      return (
        data.aasIdShort !== "" &&
        idShortPattern.test(data.aasIdShort) &&
        data.aasId !== ""
      );
    case 3:
      return true; // Asset info has defaults
    case 4:
      if (data.includeSubmodel) {
        return (
          data.submodelIdShort !== "" &&
          idShortPattern.test(data.submodelIdShort) &&
          data.submodelId !== ""
        );
      }
      return true;
    default:
      return false;
  }
}

/**
 * Create Environment from wizard data
 */
function createEnvironmentFromData(data: WizardData): Environment {
  const aas: AssetAdministrationShell = {
    id: data.aasId,
    idShort: data.aasIdShort,
    assetInformation: {
      assetKind: data.assetKind,
      globalAssetId: data.globalAssetId || undefined,
      assetType: data.assetType || undefined,
    },
  };

  if (data.aasDescription) {
    aas.description = [{ language: "en", text: data.aasDescription }];
  }

  const environment: Environment = {
    assetAdministrationShells: [aas],
  };

  // Add submodel if requested
  if (data.includeSubmodel) {
    const submodel: Submodel = {
      id: data.submodelId,
      idShort: data.submodelIdShort,
      kind: ModelingKind.Instance,
    };

    if (data.submodelDescription) {
      submodel.description = [{ language: "en", text: data.submodelDescription }];
    }

    if (data.submodelSemanticId) {
      submodel.semanticId = {
        type: ReferenceTypes.ExternalReference,
        keys: [
          {
            type: KeyTypes.GlobalReference,
            value: data.submodelSemanticId,
          },
        ],
      };
    }

    environment.submodels = [submodel];

    // Add reference to submodel in AAS
    aas.submodels = [
      {
        type: ReferenceTypes.ModelReference,
        keys: [
          {
            type: KeyTypes.Submodel,
            value: data.submodelId,
          },
        ],
      },
    ];
  }

  return environment;
}

/**
 * Generate unique ID with timestamp
 */
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `https://example.com/${type}/${timestamp}-${random}`;
}
