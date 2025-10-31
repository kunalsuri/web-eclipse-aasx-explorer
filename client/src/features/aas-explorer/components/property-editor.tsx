/**
 * Property Editor Component
 * Provides inline editing capabilities for AAS property values
 * Supports edit/view mode toggle, validation, and save/cancel operations
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit2,
  Save,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { usePropertyEditor } from '../hooks/use-property-editor';
import { MultiLanguageEditor } from './multi-language-editor';
import type { SubmodelElement } from '../../../../../shared';

export interface PropertyEditorProps {
  readonly element: SubmodelElement | null;
  readonly onSave?: (element: SubmodelElement, newValue: any) => Promise<void>;
  readonly onCancel?: () => void;
  readonly readonly?: boolean;
}

/**
 * PropertyEditor - Main component for editing AAS properties
 * Features:
 * - Edit/View mode toggle
 * - Real-time validation
 * - Save/Cancel operations
 * - Type-specific input rendering
 */
export function PropertyEditor({
  element,
  onSave,
  onCancel,
  readonly = false,
}: PropertyEditorProps) {
  const {
    state,
    startEditing,
    updateValue,
    save,
    cancel,
    canSave,
  } = usePropertyEditor({
    element,
    onSave,
    onCancel,
    validateOnChange: true,
  });

  if (!element) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="text-center py-6 text-muted-foreground">
          <Edit2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a property to edit</p>
        </div>
      </div>
    );
  }

  // Only show editor for editable element types
  const isEditable = 
    (element.modelType === 'Property' && 'value' in element) ||
    (element.modelType === 'MultiLanguageProperty' && 'value' in element);

  if (!isEditable) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="text-center py-6 text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">This element type is not editable</p>
          <Badge variant="outline" className="mt-2">
            {element.modelType}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30 min-h-[280px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Edit Property</span>
        </div>
        <div className="flex items-center gap-2">
          {state.isDirty && (
            <Badge variant="secondary" className="text-xs">
              Modified
            </Badge>
          )}
          {!state.isEditing && !readonly && (
            <Button
              size="sm"
              variant="outline"
              onClick={startEditing}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-4 transition-all duration-200">
        {/* Element Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">ID Short</Label>
            <Badge variant="outline">{element.idShort}</Badge>
          </div>
          {element.modelType === 'Property' && 'valueType' in element && (
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Value Type</Label>
              <Badge variant="secondary">
                {(element as any).valueType}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Value Editor */}
        {state.isEditing ? (
          renderEditMode(element, state, updateValue)
        ) : (
          <ViewMode element={element} value={state.originalValue} />
        )}

        {/* Validation Errors */}
        {state.validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {state.validationErrors.map((error) => (
                  <li key={error} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {state.isEditing && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={save}
              disabled={!canSave}
              className="gap-2"
            >
              {state.isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancel}
              disabled={state.isSaving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render edit mode based on element type
 */
function renderEditMode(
  element: SubmodelElement,
  state: any,
  updateValue: (value: any) => void
) {
  if (element.modelType === 'MultiLanguageProperty') {
    return (
      <MultiLanguageEditor
        value={state.editedValue || []}
        onChange={updateValue}
        disabled={state.isSaving}
        errors={state.validationErrors}
      />
    );
  }

  return (
    <EditMode
      element={element}
      value={state.editedValue}
      onChange={updateValue}
      errors={state.validationErrors}
      isSaving={state.isSaving}
    />
  );
}

/**
 * ViewMode - Display property value in read-only mode
 */
function ViewMode({
  element,
  value,
}: {
  readonly element: SubmodelElement;
  readonly value: any;
}) {
  // Handle MultiLanguageProperty
  if (element.modelType === 'MultiLanguageProperty' && Array.isArray(value)) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Values</Label>
        <div className="space-y-2">
          {value.map((entry: any) => (
            <div key={entry.language} className="p-3 bg-muted/50 rounded-md border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {entry.language}
                </Badge>
              </div>
              <p className="text-sm break-words">{entry.text || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayValue = value !== null && value !== undefined ? String(value) : '—';

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Value</Label>
      <div className="p-3 bg-muted/50 rounded-md border">
        <p className="text-sm font-mono break-words">{displayValue}</p>
      </div>
    </div>
  );
}

/**
 * EditMode - Editable input for property value
 */
function EditMode({
  element,
  value,
  onChange,
  errors,
  isSaving,
}: {
  readonly element: SubmodelElement;
  readonly value: any;
  readonly onChange: (value: any) => void;
  readonly errors: string[];
  readonly isSaving: boolean;
}) {
  const property = element as any;
  const valueType = property.valueType;

  // Render type-specific editor
  return renderTypeSpecificEditor(valueType, value, onChange, isSaving, errors);
}

/**
 * Render the appropriate editor based on value type
 */
function renderTypeSpecificEditor(
  valueType: string,
  value: any,
  onChange: (value: any) => void,
  disabled: boolean,
  errors: string[]
) {
  const hasErrors = errors.length > 0;

  switch (valueType) {
    case 'xs:boolean':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="boolean-value" className="text-sm font-medium">
              Value
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="boolean-value"
                type="checkbox"
                checked={value === true || value === 'true'}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4"
              />
              <span className="text-xs text-muted-foreground">
                {value === true || value === 'true' ? 'true' : 'false'}
              </span>
            </div>
          </div>
        </div>
      );

    case 'xs:int':
    case 'xs:integer':
    case 'xs:long':
    case 'xs:short':
    case 'xs:byte':
    case 'xs:unsignedInt':
    case 'xs:unsignedLong':
    case 'xs:unsignedShort':
    case 'xs:unsignedByte':
      return (
        <div className="space-y-2">
          <Label htmlFor="property-value" className="text-sm font-medium">
            Value
          </Label>
          <Input
            id="property-value"
            type="number"
            step="1"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={hasErrors ? 'border-destructive' : ''}
            placeholder="Enter integer..."
          />
          {hasErrors && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      );

    case 'xs:double':
    case 'xs:float':
    case 'xs:decimal':
      return (
        <div className="space-y-2">
          <Label htmlFor="property-value" className="text-sm font-medium">
            Value
          </Label>
          <Input
            id="property-value"
            type="number"
            step="any"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={hasErrors ? 'border-destructive' : ''}
            placeholder="Enter number..."
          />
          {hasErrors && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      );

    case 'xs:date':
      return (
        <div className="space-y-2">
          <Label htmlFor="property-value" className="text-sm font-medium">
            Value
          </Label>
          <Input
            id="property-value"
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={hasErrors ? 'border-destructive' : ''}
          />
          {hasErrors && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      );

    case 'xs:dateTime':
      return (
        <div className="space-y-2">
          <Label htmlFor="property-value" className="text-sm font-medium">
            Value
          </Label>
          <Input
            id="property-value"
            type="datetime-local"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={hasErrors ? 'border-destructive' : ''}
          />
          {hasErrors && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      );

    case 'xs:time':
      return (
        <div className="space-y-2">
          <Label htmlFor="property-value" className="text-sm font-medium">
            Value
          </Label>
          <Input
            id="property-value"
            type="time"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={hasErrors ? 'border-destructive' : ''}
          />
          {hasErrors && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      );

    case 'xs:string':
    default:
      return (
        <div className="space-y-2">
          <Label htmlFor="property-value" className="text-sm font-medium">
            Value
          </Label>
          <Input
            id="property-value"
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={hasErrors ? 'border-destructive' : ''}
            placeholder="Enter text..."
          />
          {hasErrors && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      );
  }
}
