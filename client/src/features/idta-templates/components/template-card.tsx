/**
 * Template Card Component
 * Displays individual template information in card format
 * Implementation will be added in Task 5.1
 */

import type { IdtaTemplate } from '@/../../shared/idta-templates-types';

export interface TemplateCardProps {
  template: IdtaTemplate;
  isDownloaded: boolean;
  isDownloading: boolean;
  onDownload: (templateId: string) => void;
  onViewDetails: (template: IdtaTemplate) => void;
  draggable?: boolean;
}

export function TemplateCard(props: TemplateCardProps) {
  return (
    <div>
      <h3>{props.template.name}</h3>
      {/* Implementation will be added in Task 5.1 */}
    </div>
  );
}
