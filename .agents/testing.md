# Testing

Tests are centralized under `tests/`, not colocated with source (despite some feature folders also having local `__tests__/` directories for component-level tests — both patterns exist in the codebase; when adding new tests, prefer the centralized `tests/` layout).

```
tests/
├── setup/          # vitest config + global setup (client & server)
├── fixtures/        # reusable AAS environments, elements, validation test data
├── utils/           # test helpers, custom assertions
├── unit/
│   ├── client/       # components, hooks, stores, utilities
│   ├── server/       # services, API handlers, auth
│   └── shared/        # validation, search, types
├── integration/
│   ├── ui/
│   └── validation/    # validation rule combinations
└── e2e/               # planned, not yet populated
```

Real config: `npm test` / `vitest` reads `tests/setup/vitest.config.ts` (root `vitest.config.ts` just re-exports it). Coverage threshold is configured at 80%.

## Running tests

```bash
npm test                                  # everything
npm run test:unit                          # tests/unit only
npm run test:integration                   # tests/integration only
npm test -- path/to/file.test.ts           # single file
npm test -- --grep "validation"            # by name
npm run test:coverage
```

## Convention: AAA pattern

```typescript
it('should perform operation successfully', async () => {
  // Arrange: set up test data and mocks
  const input = createTestInput();

  // Act
  const result = doTheThing(input);

  // Assert
  expect(result).toBe(expected);
});
```

## When implementing a feature

Add tests alongside the implementation in the same change, in the matching `tests/unit/{client,server,shared}` or `tests/integration/*` subdirectory — this repo's established convention (see `.agents/workflow.md`) is that a feature isn't done until it has evaluation/test coverage checked in with it, not added later.
