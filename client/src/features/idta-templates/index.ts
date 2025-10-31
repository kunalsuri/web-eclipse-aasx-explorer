/**
 * IDTA Templates Feature
 * 
 * This feature provides integration with IDTA (Industrial Digital Twin Association)
 * submodel templates, allowing users to discover, download, and integrate
 * standardized AAS submodel templates.
 */

// Export all public components
export { IdtaTemplatesPage } from './pages/idta-templates-page';

// Export hooks
export { useIdtaTemplates } from './hooks/use-idta-templates';
export { useTemplateDownload } from './hooks/use-template-download';
export { useTemplateSearch } from './hooks/use-template-search';
export { useTemplateViewer } from './hooks/use-template-viewer';
export { useCreateFromTemplate } from './hooks/use-create-from-template';

// Export components
export { TemplateCard } from './components/template-card';
export { TemplateDetailsModal } from './components/template-details-modal';
export { TemplateSearchBar } from './components/template-search-bar';
export { TemplateGrid } from './components/template-grid';
export { DraggableTemplateCard } from './components/draggable-template-card';
export { CreateFromTemplateDialog } from './components/create-from-template-dialog';
export { TemplateViewerBadge } from './components/template-viewer-badge';
