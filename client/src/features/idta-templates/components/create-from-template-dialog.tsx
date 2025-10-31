/**
 * Create From Template Dialog Component
 * Dialog for configuring new package creation from template
 * Implementation will be added in Task 13.3
 */

import type { IdtaTemplate } from '@/../../shared/idta-templates-types';

export interface CreateFromTemplateDialogProps {
  template: IdtaTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (packageId: string) => void;
}

export function CreateFromTemplateDialog(props: CreateFromTemplateDialogProps) {
  if (!props.isOpen) return null;

  return (
    <div>
      <h2>Create Package from {props.template.name}</h2>
      {/* Implementation will be added in Task 13.3 */}
    </div>
  );
}
