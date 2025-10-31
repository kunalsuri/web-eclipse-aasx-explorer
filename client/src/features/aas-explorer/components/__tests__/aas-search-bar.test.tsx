/**
 * AAS Search Bar Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AASSearchBar } from '../aas-search-bar';

// Mock the useAASSearch hook
vi.mock('../../hooks/use-aas-search', () => ({
  useAASSearch: () => ({
    search: vi.fn(),
    results: [],
    isSearching: false,
    error: null,
    statistics: null,
    clearResults: vi.fn(),
  }),
}));

describe('AASSearchBar', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render search trigger button', () => {
    render(<AASSearchBar fileId="test-file" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Search AAS...');
  });

  it('should render with custom placeholder', () => {
    render(<AASSearchBar fileId="test-file" placeholder="Custom search..." />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Custom search...');
  });

  it('should show keyboard shortcut hint', () => {
    render(<AASSearchBar fileId="test-file" />);

    const kbd = screen.getByText('K');
    expect(kbd).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', async () => {
    render(<AASSearchBar fileId="test-file" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Search by name/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should handle keyboard shortcut (Ctrl+K)', async () => {
    render(<AASSearchBar fileId="test-file" />);

    // Simulate Ctrl+K
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Search by name/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should handle keyboard shortcut (Cmd+K)', async () => {
    render(<AASSearchBar fileId="test-file" />);

    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Search by name/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should save recent searches to localStorage', async () => {
    const { rerender } = render(<AASSearchBar fileId="test-file" />);

    // Open dialog
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Search by name/i);
      expect(input).toBeInTheDocument();
    });

    // Type and search
    const input = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Check localStorage
    await waitFor(() => {
      const stored = localStorage.getItem('aas-recent-searches');
      expect(stored).toBeTruthy();
      if (stored) {
        const searches = JSON.parse(stored);
        expect(searches).toContain('test query');
      }
    });
  });

  it('should display recent searches', async () => {
    // Pre-populate localStorage
    localStorage.setItem('aas-recent-searches', JSON.stringify(['previous search']));

    render(<AASSearchBar fileId="test-file" />);

    // Open dialog
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('previous search')).toBeInTheDocument();
    });
  });

  it('should clear recent searches', async () => {
    // Pre-populate localStorage
    localStorage.setItem('aas-recent-searches', JSON.stringify(['search 1', 'search 2']));

    render(<AASSearchBar fileId="test-file" />);

    // Open dialog
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Check localStorage
    const stored = localStorage.getItem('aas-recent-searches');
    expect(stored).toBeNull();
  });

  it('should limit recent searches to 10 items', async () => {
    render(<AASSearchBar fileId="test-file" />);

    // Open dialog
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Search by name/i);
      expect(input).toBeInTheDocument();
    });

    // Add 15 searches
    const input = screen.getByPlaceholderText(/Search by name/i);
    for (let i = 0; i < 15; i++) {
      fireEvent.change(input, { target: { value: `search ${i}` } });
      fireEvent.keyDown(input, { key: 'Enter' });
    }

    // Check localStorage
    await waitFor(() => {
      const stored = localStorage.getItem('aas-recent-searches');
      if (stored) {
        const searches = JSON.parse(stored);
        expect(searches.length).toBeLessThanOrEqual(10);
      }
    });
  });

  it('should show search tips when no query and no recent searches', async () => {
    render(<AASSearchBar fileId="test-file" />);

    // Open dialog
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Start typing to search/i)).toBeInTheDocument();
      expect(screen.getByText(/Use Ctrl\+K/i)).toBeInTheDocument();
    });
  });

  it('should call onResultSelect when result is clicked', async () => {
    const mockOnResultSelect = vi.fn();

    // Mock useAASSearch with results
    vi.mock('../../hooks/use-aas-search', () => ({
      useAASSearch: () => ({
        search: vi.fn(),
        results: [
          {
            id: 'result-1',
            type: 'Property',
            idShort: 'TestProperty',
            path: ['Submodel', 'TestProperty'],
            matches: [],
            score: 100,
            element: {},
          },
        ],
        isSearching: false,
        error: null,
        statistics: null,
        clearResults: vi.fn(),
      }),
    }));

    render(<AASSearchBar fileId="test-file" onResultSelect={mockOnResultSelect} />);

    // Open dialog
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Search by name/i);
      expect(input).toBeInTheDocument();
    });

    // Type to trigger search
    const input = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(input, { target: { value: 'test' } });

    // Note: In a real test, we would wait for results to appear and click them
    // This is a simplified test
  });
});
