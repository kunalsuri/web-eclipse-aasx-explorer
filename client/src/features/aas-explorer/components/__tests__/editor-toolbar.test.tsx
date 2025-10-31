/**
 * Editor Toolbar Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditorToolbar } from '../editor-toolbar';
import * as useUndoRedoModule from '../../hooks/use-undo-redo';

// Mock the useUndoRedo hook
vi.mock('../../hooks/use-undo-redo');

describe('EditorToolbar', () => {
  const mockUndo = vi.fn();
  const mockRedo = vi.fn();
  const mockClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: false,
      canRedo: false,
      undoDescription: undefined,
      redoDescription: undefined,
      historySize: 0,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });
  });

  it('should render undo and redo buttons', () => {
    render(<EditorToolbar />);

    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('should disable undo button when canUndo is false', () => {
    render(<EditorToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeDisabled();
  });

  it('should enable undo button when canUndo is true', () => {
    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: true,
      canRedo: false,
      undoDescription: 'Update property',
      redoDescription: undefined,
      historySize: 1,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).not.toBeDisabled();
  });

  it('should call undo when undo button is clicked', async () => {
    mockUndo.mockResolvedValue(undefined);

    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: true,
      canRedo: false,
      undoDescription: 'Update property',
      redoDescription: undefined,
      historySize: 1,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(mockUndo).toHaveBeenCalled();
    });
  });

  it('should disable redo button when canRedo is false', () => {
    render(<EditorToolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).toBeDisabled();
  });

  it('should enable redo button when canRedo is true', () => {
    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: false,
      canRedo: true,
      undoDescription: undefined,
      redoDescription: 'Update property',
      historySize: 0,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).not.toBeDisabled();
  });

  it('should call redo when redo button is clicked', async () => {
    mockRedo.mockResolvedValue(undefined);

    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: false,
      canRedo: true,
      undoDescription: undefined,
      redoDescription: 'Update property',
      historySize: 0,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(mockRedo).toHaveBeenCalled();
    });
  });

  it('should show clear button when showClearButton is true', () => {
    render(<EditorToolbar showClearButton={true} />);

    expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument();
  });

  it('should not show clear button by default', () => {
    render(<EditorToolbar />);

    expect(screen.queryByRole('button', { name: /clear history/i })).not.toBeInTheDocument();
  });

  it('should call clear when clear button is clicked', () => {
    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: true,
      canRedo: false,
      undoDescription: 'Update property',
      redoDescription: undefined,
      historySize: 1,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar showClearButton={true} />);

    const clearButton = screen.getByRole('button', { name: /clear history/i });
    fireEvent.click(clearButton);

    expect(mockClear).toHaveBeenCalled();
  });

  it('should call onClearHistory callback when clear is clicked', () => {
    const onClearHistory = vi.fn();

    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: true,
      canRedo: false,
      undoDescription: 'Update property',
      redoDescription: undefined,
      historySize: 1,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar showClearButton={true} onClearHistory={onClearHistory} />);

    const clearButton = screen.getByRole('button', { name: /clear history/i });
    fireEvent.click(clearButton);

    expect(onClearHistory).toHaveBeenCalled();
  });

  it('should handle undo errors gracefully', async () => {
    const mockError = new Error('Undo failed');
    mockUndo.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: true,
      canRedo: false,
      undoDescription: 'Update property',
      redoDescription: undefined,
      historySize: 1,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Undo failed:', mockError);
    });

    consoleSpy.mockRestore();
  });

  it('should handle redo errors gracefully', async () => {
    const mockError = new Error('Redo failed');
    mockRedo.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: false,
      canRedo: true,
      undoDescription: undefined,
      redoDescription: 'Update property',
      historySize: 0,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Redo failed:', mockError);
    });

    consoleSpy.mockRestore();
  });

  it('should prevent multiple simultaneous undo operations', async () => {
    mockUndo.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    vi.mocked(useUndoRedoModule.useUndoRedo).mockReturnValue({
      canUndo: true,
      canRedo: false,
      undoDescription: 'Update property',
      redoDescription: undefined,
      historySize: 1,
      undo: mockUndo,
      redo: mockRedo,
      clear: mockClear,
    });

    render(<EditorToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    
    // Click multiple times rapidly
    fireEvent.click(undoButton);
    fireEvent.click(undoButton);
    fireEvent.click(undoButton);

    await waitFor(() => {
      // Should only be called once due to isUndoing state
      expect(mockUndo).toHaveBeenCalledTimes(1);
    });
  });
});
