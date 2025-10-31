/**
 * Draggable Template Card Component
 * Wrapper for TemplateCard with drag-and-drop functionality
 * Implementation will be added in Task 7.1
 */

import type { IdtaTemplate } from '@/../../shared/idta-templates-types';
import { TemplateCard, type TemplateCardProps } from './template-card';

export interface DraggableTemplateCardProps extends TemplateCardProps {
  onDragStart: (template: IdtaTemplate) => void;
  onDragEnd: () => void;
}

export function DraggableTemplateCard(props: DraggableTemplateCardProps) {
  return (
    <div>
      <TemplateCard {...props} />
      {/* Drag-and-drop implementation will be added in Task 7.1 */}
    </div>
  );
}
