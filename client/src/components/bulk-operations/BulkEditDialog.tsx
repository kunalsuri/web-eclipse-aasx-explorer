/**
 * Bulk Edit Dialog
 * 
 * Dialog for performing bulk edit operations on multiple elements.
 */

import { useState } from 'react';
import { Edit, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { PropertyEditorFactory } from '../property-editors/PropertyEditorFactory';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elements: any[];
  onSubmit: (operation: BulkOperation) => Promise<BulkOperationResult>;
}

export type BulkOperationType = 
  | 'set-category'
  | 'set-semantic-id'
  | 'set-description'
  | 'set-display-name';

export interface BulkOperation {
  type: BulkOperationType;
  value: any;
  elementIds: string[];
}

export interface BulkOperationResult {
  succeeded: number;
  failed: number;
  errors: Array<{ elementId: string; error: string }>;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  elements,
  onSubmit,
}: BulkEditDialogProps) {
  const [operationType, setOperationType] = useState<BulkOperationType>('set-category');
  const [value, setValue] = useState<any>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const operation: BulkOperation = {
        type: operationType,
        value,
        elementIds: elements.map(e => e.id || e.idShort),
      };

      const opResult = await onSubmit(operation);
      setResult(opResult);

      if (opResult.failed === 0) {
        // All succeeded, close dialog
        setTimeout(() => {
          onOpenChange(false);
          setResult(null);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Bulk operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOperationLabel = (type: BulkOperationType): string => {
    switch (type) {
      case 'set-category':
        return 'Set Category';
      case 'set-semantic-id':
        return 'Set Semantic ID';
      case 'set-description':
        return 'Set Description';
      case 'set-display-name':
        return 'Set Display Name';
      default:
        return 'Unknown Operation';
    }
  };

  const getValueEditor = () => {
    switch (operationType) {
      case 'set-category':
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONSTANT">Constant</SelectItem>
              <SelectItem value="PARAMETER">Parameter</SelectItem>
              <SelectItem value="VARIABLE">Variable</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'set-semantic-id':
        return (
          <PropertyEditorFactory
            value={value}
            onChange={setValue}
            valueType="Reference"
          />
        );

      case 'set-description':
      case 'set-display-name':
        return (
          <PropertyEditorFactory
            value={value}
            onChange={setValue}
            valueType="MultiLanguageProperty"
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Bulk Edit
          </DialogTitle>
          <DialogDescription>
            Apply changes to {elements.length} selected element{elements.length === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Operation Type */}
          <div className="space-y-2">
            <Label>Operation</Label>
            <Select
              value={operationType}
              onValueChange={(value) => {
                setOperationType(value as BulkOperationType);
                setValue('');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set-category">Set Category</SelectItem>
                <SelectItem value="set-semantic-id">Set Semantic ID</SelectItem>
                <SelectItem value="set-description">Set Description</SelectItem>
                <SelectItem value="set-display-name">Set Display Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value Editor */}
          <div className="space-y-2">
            <Label>{getOperationLabel(operationType)}</Label>
            {getValueEditor()}
          </div>

          {/* Affected Elements */}
          <div className="space-y-2">
            <Label>Affected Elements ({elements.length})</Label>
            <ScrollArea className="h-32 rounded-md border p-3">
              <div className="space-y-1">
                {elements.map((element, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{element.idShort || element.id}</span>
                    <span className="text-muted-foreground ml-2">({element.modelType})</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-md p-4 ${result.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="text-sm font-medium">
                {result.succeeded} succeeded, {result.failed} failed
              </div>
              {result.errors.length > 0 && (
                <ScrollArea className="h-20 mt-2">
                  <div className="space-y-1">
                    {result.errors.map((err, index) => (
                      <div key={index} className="text-xs text-destructive">
                        {err.elementId}: {err.error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !value}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Applying...' : 'Apply to All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
