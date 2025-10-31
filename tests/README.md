# Test Suite Documentation

This directory contains all automated tests for the Eclipse AASX Web application.

## Directory Structure

```
/tests/
├── setup/          # Test configuration and setup files
├── fixtures/       # Reusable test data and fixtures
├── utils/          # Test utilities and helpers
├── unit/           # Unit tests (isolated component/function tests)
├── integration/    # Integration tests (multi-component workflows)
└── e2e/            # End-to-end tests (complete user workflows)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --grep "validation"
```

## Test Organization

Tests are organized by type and domain:

- **Unit Tests** (`/tests/unit/`): Test individual functions/components in isolation
  - `client/`: UI components, hooks, stores, utilities
  - `server/`: Services, API handlers, authentication
  - `shared/`: Validation, search, types

- **Integration Tests** (`/tests/integration/`): Test interactions between components
  - `api/`: API endpoint workflows
  - `ui/`: UI component workflows
  - `services/`: Service layer interactions
  - `validation/`: Validation rule combinations

- **E2E Tests** (`/tests/e2e/`): Test complete user workflows (future)

## Writing Tests

### Test Structure (AAA Pattern)

```typescript
it('should perform operation successfully', async () => {
  // Arrange: Set up test data and mocks
  const input = createTestInput();
  const mockDependency = vi.fn().mockResolvedValue(expectedResult);
  
  // Act: Execute the operation
  const result = await service.performOperation(input);
  
  // Assert: Verify the outcome
  expect(result).toEqual(expectedResult);
  expect(mockDependency).toHaveBeenCalledWith(input);
});
```

### Using Fixtures

```typescript
import { createBasicAAS, createBasicSubmodel } from '@tests/fixtures/aas-environments';

it('should validate AAS', () => {
  const aas = createBasicAAS('test-id');
  const result = validate(aas);
  expect(result.isValid).toBe(true);
});
```

### Using Test Utilities

```typescript
import { createTestFile, cleanupTestFile } from '@tests/utils/test-helpers';
import { expectNoValidationErrors } from '@tests/utils/assertions';

it('should process file', async () => {
  const filePath = await createTestFile('test-id', environment);
  
  const result = await processFile(filePath);
  expectNoValidationErrors(result);
  
  await cleanupTestFile('test-id');
});
```

## Test Conventions

1. **Descriptive Names**: Test names should clearly describe what is being tested and the expected outcome
   - Good: `should reject duplicate idShort when adding element to submodel`
   - Bad: `should fail`

2. **One Concept Per Test**: Each test should verify one specific behavior

3. **Independent Tests**: Tests should not depend on execution order or shared state

4. **Use Data-Driven Tests**: Use `it.each()` for testing multiple scenarios with similar logic

5. **Mock External Dependencies Only**: Mock external APIs, file system, network calls, but test real business logic

## Coverage Requirements

- Business logic: 80%+ coverage
- Services: 80%+ coverage
- Utilities: 80%+ coverage
- Components: 75%+ coverage

## Troubleshooting

### Tests Failing After Changes

1. Run tests in watch mode to see failures immediately
2. Check if imports need updating
3. Verify fixtures and mocks are set up correctly
4. Check for test interdependencies

### Slow Test Execution

1. Minimize file I/O operations
2. Use `beforeAll` for expensive setup
3. Mock external dependencies
4. Run tests in parallel (default)

### Coverage Not Meeting Thresholds

1. Run coverage report: `npm run test:coverage`
2. Open HTML report: `open coverage/index.html`
3. Identify uncovered lines
4. Add tests for critical paths first

## Contributing

When adding new features:

1. Write tests alongside implementation
2. Follow existing test patterns
3. Use shared fixtures and utilities
4. Ensure tests are fast and isolated
5. Update this documentation if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [AAS Specification](https://www.plattform-i40.de/IP/Redaktion/EN/Standardartikel/specification-administrationshell.html)
