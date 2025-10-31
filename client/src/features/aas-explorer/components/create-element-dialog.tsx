/**
 * Create Element Dialog Component
 * Dialog for creating new AAS elements (Submodels and SubmodelElements)
 */

import { useState } from 'react';
import { Plus, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AasSubmodelElements, DataTypeDefXsd, ModelingKind } from '../../../../../shared/aas-v3-types';

interface CreateElementDialogProps {
  parentType: 'environment' | 'submodel' | 'collection';
  parentId?: string;
  onElementCreate: (element: any) => Promise<void>;
  trigger?: React.ReactNode;
}

const ELEMENT_TYPES = [
  { value: AasSubmodelElements.Property, label: 'Property', description: 'Single value property' },
  {
    value: AasSubmodelElements.MultiLanguageProperty,
    label: 'Multi-Language Property',
    description: 'Property with multiple language values',
  },
  { value: AasSubmodelElements.Range, label: 'Range', description: 'Value range with min/max' },
  {
    value: AasSubmodelElements.ReferenceElement,
    label: 'Reference Element',
    description: 'Reference to another element',
  },
  { value: AasSubmodelElements.File, label: 'File', description: 'File reference' },
  { value: AasSubmodelElements.Blob, label: 'Blob', description: 'Binary data' },
  {
    value: AasSubmodelElements.SubmodelElementCollection,
    label: 'Collection',
    description: 'Collection of elements',
  },
  {
    value: AasSubmodelElements.SubmodelElementList,
    label: 'List',
    description: 'Ordered list of elements',
  },
];

const DATA_TYPES = [
  { value: DataTypeDefXsd.String, label: 'String' },
  { value: DataTypeDefXsd.Integer, label: 'Integer' },
  { value: DataTypeDefXsd.Double, label: 'Double' },
  { value: DataTypeDefXsd.Boolean, label: 'Boolean' },
  { value: DataTypeDefXsd.Date, label: 'Date' },
  { value: DataTypeDefXsd.DateTime, label: 'DateTime' },
];

export function CreateElementDialog({
  parentType,
  parentId,
  onElementCreate,
  trigger,
}: CreateElementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [elementType, setElementType] = useState<string>(AasSubmodelElements.Property);
  const [idShort, setIdShort] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [semanticId, setSemanticId] = useState('');
  const [valueType, setValueType] = useState<string>(DataTypeDefXsd.String);
  const [value, setValue] = useState('');
  const [modelingKind, setModelingKind] = useState<string>(ModelingKind.Instance);

  // Reset form
  function resetForm() {
    setElementType(AasSubmodelElements.Property);
    setIdShort('');
    setDescription('');
    setCategory('');
    setSemanticId('');
    setValueType(DataTypeDefXsd.String);
    setValue('');
    setModelingKind(ModelingKind.Instance);
    setError(null);
  }

  // Validate form
  function validateForm(): boolean {
    if (!idShort.trim()) {
      setError('idShort is required');
      return false;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(idShort)) {
      setError('idShort must start with a letter and contain only letters, numbers, and underscores');
      return false;
    }

    return true;
  }

  // Build element based on type
  function buildElement(): any {
    const baseElement = {
      idShort,
      modelType: elementType,
      category: category || undefined,
      description: description
        ? [
            {
              language: 'en',
              text: description,
            },
          ]
        : undefined,
      semanticId: semanticId
        ? {
            type: 'ModelReference',
            keys: [
              {
                type: 'GlobalReference',
                value: semanticId,
              },
            ],
          }
        : undefined,
    };

    // Add type-specific properties
    switch (elementType) {
      case AasSubmodelElements.Property:
        return {
          ...baseElement,
          valueType,
          value: value || undefined,
        };

      case AasSubmodelElements.MultiLanguageProperty:
        return {
          ...baseElement,
          value: value
            ? [
                {
                  language: 'en',
                  text: value,
                },
              ]
            : undefined,
        };

      case AasSubmodelElements.Range:
        return {
          ...baseElement,
          valueType,
          min: undefined,
          max: undefined,
        };

      case AasSubmodelElements.File:
        return {
          ...baseElement,
          contentType: 'application/octet-stream',
          value: value || undefined,
        };

      case AasSubmodelElements.Blob:
        return {
          ...baseElement,
          contentType: 'application/octet-stream',
          value: value || undefined,
        };

      case AasSubmodelElements.SubmodelElementCollection:
        return {
          ...baseElement,
          value: [],
        };

      case AasSubmodelElements.SubmodelElementList:
        return {
          ...baseElement,
          orderRelevant: true,
          semanticIdListElement: undefined,
          typeValueListElement: AasSubmodelElements.Property,
          valueTypeListElement: DataTypeDefXsd.String,
          value: [],
        };

      case AasSubmodelElements.ReferenceElement:
        return {
          ...baseElement,
          value: undefined,
        };

      default:
        return baseElement;
    }
  }

  // Handle create
  async function handleCreate() {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const element = buildElement();
      await onElementCreate(element);
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create element');
    } finally {
      setIsCreating(false);
    }
  }

  // Get selected element type info
  const selectedType = ELEMENT_TYPES.find((t) => t.value === elementType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Element
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Element</DialogTitle>
          <DialogDescription>
            Create a new {parentType === 'environment' ? 'Submodel' : 'SubmodelElement'} in the AAS
            structure.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Element Type */}
            <div className="space-y-2">
              <Label htmlFor="element-type">Element Type *</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger id="element-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ELEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{selectedType.description}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* idShort */}
            <div className="space-y-2">
              <Label htmlFor="id-short">idShort *</Label>
              <Input
                id="id-short"
                placeholder="e.g., MaxSpeed"
                value={idShort}
                onChange={(e) => setIdShort(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must start with a letter and contain only letters, numbers, and underscores
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the element..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Value Type (for Property and Range) */}
            {(elementType === AasSubmodelElements.Property ||
              elementType === AasSubmodelElements.Range) && (
              <div className="space-y-2">
                <Label htmlFor="value-type">Value Type</Label>
                <Select value={valueType} onValueChange={setValueType}>
                  <SelectTrigger id="value-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Initial Value */}
            {(elementType === AasSubmodelElements.Property ||
              elementType === AasSubmodelElements.MultiLanguageProperty ||
              elementType === AasSubmodelElements.File ||
              elementType === AasSubmodelElements.Blob) && (
              <div className="space-y-2">
                <Label htmlFor="value">Initial Value</Label>
                <Input
                  id="value"
                  placeholder="Enter initial value..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., PARAMETER, VARIABLE"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional category classification (e.g., PARAMETER, VARIABLE, CONSTANT)
              </p>
            </div>

            {/* Semantic ID */}
            <div className="space-y-2">
              <Label htmlFor="semantic-id">Semantic ID</Label>
              <Input
                id="semantic-id"
                placeholder="e.g., https://example.com/semantic-id"
                value={semanticId}
                onChange={(e) => setSemanticId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional semantic identifier (IRI or IRDI)
              </p>
            </div>

            {/* Modeling Kind */}
            <div className="space-y-2">
              <Label htmlFor="modeling-kind">Modeling Kind</Label>
              <Select value={modelingKind} onValueChange={setModelingKind}>
                <SelectTrigger id="modeling-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ModelingKind.Instance}>Instance</SelectItem>
                  <SelectItem value={ModelingKind.Template}>Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Element'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
