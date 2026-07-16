# IDTA Templates Feature

This feature provides integration with IDTA (Industrial Digital Twin Association) submodel templates, allowing users to discover, download, and integrate standardized AAS submodel templates.

## Directory Structure

```
idta-templates/
├── components/           # React components
│   ├── template-card.tsx
│   ├── template-details-modal.tsx
│   ├── template-search-bar.tsx
│   ├── template-grid.tsx
│   ├── draggable-template-card.tsx
│   ├── create-from-template-dialog.tsx
│   └── template-viewer-badge.tsx
├── hooks/               # Custom React hooks
│   ├── use-idta-templates.ts
│   ├── use-template-download.ts
│   ├── use-template-search.ts
│   ├── use-template-viewer.ts
│   └── use-create-from-template.ts
├── pages/               # Page components
│   └── idta-templates-page.tsx
├── index.ts            # Public exports
└── README.md           # This file
```

## Backend Structure

```
server/src/
├── api/
│   └── idta-templates-routes.ts    # Express routes
└── services/
    ├── idta-repository-service.ts   # GitHub API integration
    ├── template-cache-service.ts    # Caching logic
    ├── template-download-service.ts # Download management
    └── template-instance-service.ts # Package creation
```

## Shared Types

All shared types are defined in `shared/idta-templates-types.ts` and can be imported by both frontend and backend.

## Implementation Status

This is the initial project structure created in Task 1. All files contain stub implementations that will be filled in during subsequent tasks.

### Task Mapping

- **Task 1**: Project structure and type definitions ✓ (Current)
- **Task 2**: Backend services layer (2.1-2.4)
- **Task 3**: Backend API endpoints (3.1-3.6)
- **Task 4**: Frontend hooks and utilities (4.1-4.4)
- **Task 5**: Core UI components (5.1-5.5)
- **Task 6**: Main IDTA Templates page (6.1-6.3)
- **Task 7**: Drag-and-drop functionality (7.1-7.4)
- **Task 8**: Navigation and integration (8.1-8.4)
- **Task 9**: Template update notifications (9.1-9.3)
- **Task 10**: Error handling and offline support (10.1-10.3)
- **Task 11**: Performance optimizations (11.1-11.4)
- **Task 12**: Template viewing in AAS Viewer (12.1-12.6)
- **Task 13**: Package creation from templates (13.1-13.6)
- **Task 14**: Documentation and deployment (14.1-14.3)

## Key Features

1. **Template Discovery**: Browse and search IDTA submodel templates
2. **Template Download**: Download templates for offline use
3. **Template Preview**: View template structure in AAS Viewer
4. **Package Creation**: Create new packages from templates
5. **Drag-and-Drop**: Integrate templates into existing packages
6. **Offline Support**: Work with cached templates when offline
7. **Update Notifications**: Get notified of template updates

## Development Guidelines

- Follow the established feature-driven architecture pattern
- Use TypeScript strict mode
- Implement comprehensive error handling
- Write tests for all new functionality
- Ensure accessibility compliance
- Follow the design system (shadcn/ui + Tailwind)
- Keep components modular and reusable

## References

No requirements/design/tasks docs were ever created for this feature under the
current spec convention. See `ai/analysis/FEATURE_CATALOG.md` F14 for its
current (scaffold-only) status.
