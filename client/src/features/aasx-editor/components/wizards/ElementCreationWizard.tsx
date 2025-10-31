/**
 * Element Creation Wizard
 * 
 * Step-by-step wizard for creating new SubmodelElements
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { AasSubmodelElements } from "@/../../shared/aas-v3-types";

interface ElementCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (element: any) => void;
  parentType?: string;
}

const ELEMENT_TYPES = [
  { value: AasSubmodelElements.Property, label: "Property", description: "Single-value data element" },
  { value: AasSubmodelElements.MultiLanguageProperty, label: "Multi-Language Property", description: "Text in multiple languages" },
  { value: AasSubmodelElements.Range, label: "Range", description: "Min/max value range" },
  { value: AasSubmodelElements.ReferenceElement, label: "Reference Element", description: "Reference to another element" },
  { value: AasSubmodelElements.SubmodelElementCollection, label: "Collection", description: "Group of elements" },
  { value: AasSubmodelElements.SubmodelElementList, label: "List", description: "Ordered list of same-type elements" },
  { value: AasSubmodelElements.File, label: "File", description: "Reference to a file" },
  { value: AasSubmodelElements.Blob, label: "Blob", description: "Binary data" },
];

interface WizardData {
  modelType: AasSubmodelElements | "";
  idShort: string;
  description: string;
  semanticId: string;
  category: string;
}

export function ElementCreationWizard({
  open,
  onOpenChange,
  onComplete,
  parentType,
}: ElementCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    modelType: "",
    idShort: "",
    description: "",
    semanticId: "",
    category: "",
  });

  const totalSteps = 3;

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
    const element = createElementFromData(data);
    onComplete(element);
    handleReset();
  }

  function handleReset(): void {
    setStep(1);
    setData({
      modelType: "",
      idShort: "",
      description: "",
      semanticId: "",
      category: "",
    });
    onOpenChange(false);
  }

  function updateData(field: keyof WizardData, value: string): void {
    setData({ ...data, [field]: value });
  }

  const canProceed = validateStep(step, data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Element - Step {step} of {totalSteps}</DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px] py-4">
          {/* Step 1: Element Type Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Element Type</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the type of SubmodelElement you want to create.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ELEMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className={`
                      p-4 border-2 rounded-lg text-left transition-all
                      hover:border-primary hover:bg-accent
                      ${data.modelType === type.value ? "border-primary bg-accent" : "border-border"}
                    `}
                    onClick={() => updateData("modelType", type.value)}
                  >
                    <div className="font-semibold mb-1">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide basic information for the new element.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idShort">
                    ID Short <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="idShort"
                    value={data.idShort}
                    onChange={(e) => updateData("idShort", e.target.value)}
                    placeholder="e.g., MyProperty"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Must start with a letter and contain only letters, numbers, and underscores.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={data.category}
                    onChange={(e) => updateData("category", e.target.value)}
                    placeholder="e.g., PARAMETER, CONSTANT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => updateData("description", e.target.value)}
                    placeholder="Enter a description for this element..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Semantic Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Semantic Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Optional semantic information for interoperability.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="semanticId">Semantic ID</Label>
                  <Input
                    id="semanticId"
                    value={data.semanticId}
                    onChange={(e) => updateData("semanticId", e.target.value)}
                    placeholder="e.g., https://example.com/semantics/temperature"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional reference to a concept description or semantic definition.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Type:</dt>
                      <dd className="font-medium">{ELEMENT_TYPES.find(t => t.value === data.modelType)?.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">ID Short:</dt>
                      <dd className="font-medium">{data.idShort}</dd>
                    </div>
                    {data.category && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Category:</dt>
                        <dd className="font-medium">{data.category}</dd>
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
                Create Element
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
  switch (step) {
    case 1:
      return data.modelType !== "";
    case 2:
      // Validate idShort pattern (AASd-002)
      const idShortPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      return data.idShort !== "" && idShortPattern.test(data.idShort);
    case 3:
      return true; // Semantic info is optional
    default:
      return false;
  }
}

/**
 * Create element from wizard data
 */
function createElementFromData(data: WizardData): any {
  const baseElement: any = {
    modelType: data.modelType,
    idShort: data.idShort,
  };

  if (data.category) {
    baseElement.category = data.category;
  }

  if (data.description) {
    baseElement.description = [{ language: "en", text: data.description }];
  }

  if (data.semanticId) {
    baseElement.semanticId = {
      type: "ExternalReference",
      keys: [
        {
          type: "GlobalReference",
          value: data.semanticId,
        },
      ],
    };
  }

  // Add type-specific default values
  switch (data.modelType) {
    case AasSubmodelElements.Property:
      baseElement.valueType = "xs:string";
      baseElement.value = "";
      break;
    case AasSubmodelElements.MultiLanguageProperty:
      baseElement.value = [{ language: "en", text: "" }];
      break;
    case AasSubmodelElements.Range:
      baseElement.valueType = "xs:double";
      baseElement.min = "0";
      baseElement.max = "100";
      break;
    case AasSubmodelElements.ReferenceElement:
      baseElement.value = {
        type: "ModelReference",
        keys: [],
      };
      break;
    case AasSubmodelElements.SubmodelElementCollection:
      baseElement.value = [];
      break;
    case AasSubmodelElements.SubmodelElementList:
      baseElement.typeValueListElement = "Property";
      baseElement.value = [];
      break;
    case AasSubmodelElements.File:
      baseElement.contentType = "application/octet-stream";
      baseElement.value = "";
      break;
    case AasSubmodelElements.Blob:
      baseElement.contentType = "application/octet-stream";
      baseElement.value = "";
      break;
  }

  return baseElement;
}
