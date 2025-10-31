/**
 * Template Grid Component
 * Responsive grid layout for template cards
 * Implementation will be added in Task 5.4
 */

import type { IdtaTemplate } from '@/../../shared/idta-templates-types';

export interface TemplateGridProps {
  templates: IdtaTemplate[];
  isLoading: boolean;
  onTemplateSelect: (template: IdtaTemplate) => void;
  onDownload: (templateId: string) => void;
}

export function TemplateGrid(props: TemplateGridProps) {
  if (props.isLoading) {
    return <div>Loading...</div>;
  }

  if (props.templates.length === 0) {
    return <div>No templates found</div>;
  }

  return (
    <div>
      {/* Implementation will be added in Task 5.4 */}
      <p>{props.templates.length} templates</p>
    </div>
  );
}
