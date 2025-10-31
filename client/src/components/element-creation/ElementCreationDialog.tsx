/**
 * Element Creation Dialog
 * 
 * Modal dialog for creating new AAS elements with form-based input.
 * Supports all 14 SubmodelElement types with validation.
 */

import { useState, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
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
import { Switch } from '../ui/switch';
import { PropertyEditorFactory } from '../property-editors/PropertyEditorFactory';
import {
  type SubmodelElementType,
  type ElementFormTemplate,
  type FormField,
  getFormTemplate,
  getAvailableElementTypes,
  validateField,
} from './element-form-templates';

interface ElementCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (element: any) => Promise<void>;
  parentType?: string;
  allowedTypes?: SubmodelElementType[];
}

export function ElementCreationDialog({
  open,
  onOpenChange,
  onSubmit,
  parentType,
  allowedTypes,
}: ElementCreationDialogProps) {
  const [selectedType, setSelectedType] = useState<SubmodelElementType>('Property');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTypes = allowedTypes || getAvailableElementTypes();
  const template = getFormTemplate(selectedType);

  // Handle type change
  const handleTypeChange = useCallback((type: SubmodelElementType) => {
    setSelectedType(type);
    const newTemplate = getFormTemplate(type);
    setFormData(newTemplate.defaults);
    setErrors({});
  }, []);

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of template.fields) {
      const value = formData[field.name];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name] = error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [template, formData]);

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const element = {
        ...template.defaults,
        ...formData,
      };

      await onSubmit(element);
      
      // Reset form
      setFormData(template.defaults);
      setErrors({});
      onOpenChange(false);
    } catch (error: any) {
      setErrors({ _form: error.message || 'Failed to create element' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field
  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? field.defaultValue;
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.helpText}
              className={error ? 'border-destructive' : ''}
            />
            {field.helpText && !error && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.helpText}
              className={error ? 'border-destructive' : ''}
            />
            {field.helpText && !error && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value || field.defaultValue}
              onValueChange={(val) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && !error && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center justify-between space-y-2">
            <div className="space-y-0.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}
            </div>
            <Switch
              id={field.name}
              checked={value ?? field.defaultValue ?? false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
          </div>
        );

      case 'multilang':
      case 'reference':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <PropertyEditorFactory
              value={value}
              onChange={(val) => handleFieldChange(field.name, val)}
              valueType={field.type === 'multilang' ? 'MultiLanguageProperty' : 'Reference'}
              className={error ? 'border-destructive' : ''}
            />
            {field.helpText && !error && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Element
          </DialogTitle>
          <DialogDescription>
            {parentType ? `Add a new element to ${parentType}` : 'Create a new submodel element'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Element Type Selection */}
          <div className="space-y-2">
            <Label>Element Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => {
                  const tmpl = getFormTemplate(type);
                  return (
                    <SelectItem key={type} value={type}>
                      <div>
                        <div className="font-medium">{tmpl.displayName}</div>
                        <div className="text-xs text-muted-foreground">{tmpl.description}</div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {template.fields.map(renderField)}
          </div>

          {/* Form-level Error */}
          {errors._form && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors._form}
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
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Element'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
