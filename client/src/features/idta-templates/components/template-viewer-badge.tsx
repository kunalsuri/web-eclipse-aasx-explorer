/**
 * Template Viewer Badge Component
 * Badge displayed in AAS Viewer when viewing a template
 * Implementation will be added in Task 12.4
 */

import type { TemplateInfo } from '@/../../shared/idta-templates-types';

export interface TemplateViewerBadgeProps {
  templateInfo: TemplateInfo;
  onCreatePackage: () => void;
}

export function TemplateViewerBadge(props: TemplateViewerBadgeProps) {
  return (
    <div>
      <span>Template Preview: {props.templateInfo.name}</span>
      <button onClick={props.onCreatePackage}>
        Create Package from Template
      </button>
      {/* Implementation will be added in Task 12.4 */}
    </div>
  );
}
