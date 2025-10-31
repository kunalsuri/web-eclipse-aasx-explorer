/**
 * Create Submodel Dialog Component
 * Dialog for creating new Submodels
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
import { ModelingKind } from '../../../../../shared/aas-v3-types';

interface CreateSubmodelDialogProps {
  onSubmodelCreate: (submodel: any) => Promise<void>;
  trigger?: React.ReactNode;
}

const COMMON_SEMANTIC_IDS = [
  {
    value: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/1',
    label: 'Technical Data',
  },
  {
    value: 'https://admin-shell.io/ZVEI/Documentation/Submodel/1/0',
    label: 'Documentation',
  },
  {
    value: 'https://admin-shell.io/ZVEI/Nameplate/Submodel/1/0',
    label: 'Nameplate',
  },
  {
    value: 'https://admin-shell.io/ZVEI/ContactInformation/Submodel/1/0',
    label: 'Contact Information',
  },
];

export function CreateSubmodelDialog({ onSubmodelCreate, trigger }: CreateSubmodelDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [idShort, setIdShort] = useState('');
  const [id, setId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [semanticId, setSemanticId] = useState('');
  const [modelingKind, setModelingKind] = useState<string>(ModelingKind.Instance);

  // Reset form
  function resetForm() {
    setIdShort('');
    setId('');
    setDescription('');
    setCategory('');
    setSemanticId('');
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

    if (!id.trim()) {
      setError('ID is required');
      return false;
    }

    // Validate ID format (should be IRI)
    try {
      new URL(id);
    } catch {
      setError('ID must be a valid IRI (e.g., https://example.com/submodel/id)');
      return false;
    }

    return true;
  }

  // Build submodel
  function buildSubmodel(): any {
    return {
      idShort,
      id,
      kind: modelingKind,
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
      submodelElements: [],
    };
  }

  // Handle create
  async function handleCreate() {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const submodel = buildSubmodel();
      await onSubmodelCreate(submodel);
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create submodel');
    } finally {
      setIsCreating(false);
    }
  }

  // Auto-generate ID from idShort
  function generateId() {
    if (idShort) {
      const baseUrl = 'https://example.com/submodel';
      const generatedId = `${baseUrl}/${idShort.toLowerCase()}`;
      setId(generatedId);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Submodel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Submodel</DialogTitle>
          <DialogDescription>
            Create a new Submodel in the AAS Environment. Submodels contain structured information
            about an asset.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* idShort */}
            <div className="space-y-2">
              <Label htmlFor="id-short">idShort *</Label>
              <Input
                id="id-short"
                placeholder="e.g., TechnicalData"
                value={idShort}
                onChange={(e) => setIdShort(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Short identifier for the submodel (must start with a letter)
              </p>
            </div>

            {/* ID */}
            <div className="space-y-2">
              <Label htmlFor="id">ID (IRI) *</Label>
              <div className="flex gap-2">
                <Input
                  id="id"
                  placeholder="e.g., https://example.com/submodel/technical-data"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={generateId}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Globally unique identifier (IRI format)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the submodel..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Semantic ID (Common) */}
            <div className="space-y-2">
              <Label htmlFor="semantic-id-common">Semantic ID (Common)</Label>
              <Select value={semanticId} onValueChange={setSemanticId}>
                <SelectTrigger id="semantic-id-common">
                  <SelectValue placeholder="Select a common semantic ID..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {COMMON_SEMANTIC_IDS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a common semantic ID or enter a custom one in Advanced tab
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., CONSTANT, PARAMETER"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional category classification
              </p>
            </div>

            {/* Semantic ID (Custom) */}
            <div className="space-y-2">
              <Label htmlFor="semantic-id-custom">Semantic ID (Custom)</Label>
              <Input
                id="semantic-id-custom"
                placeholder="e.g., https://example.com/semantic-id"
                value={semanticId}
                onChange={(e) => setSemanticId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Custom semantic identifier (IRI or IRDI)
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
              <p className="text-xs text-muted-foreground">
                Instance: Concrete data | Template: Reusable structure
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                After creating the submodel, you can add SubmodelElements to it using the tree view
                context menu.
              </AlertDescription>
            </Alert>
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
            {isCreating ? 'Creating...' : 'Create Submodel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
