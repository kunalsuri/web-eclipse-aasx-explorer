/**
 * Undo/Redo Flow - Integration Tests
 * Tests complete undo/redo workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditorToolbar } from '@/features/aas-explorer/components/editor-toolbar';
import { undoService } from '@/features/aas-explorer/services/undo-service';
import { UpdatePropertyCommand } from '@/features/aas-explorer/services/commands';
import { updateService } from '@/features/aas-explorer/services/update-service';

// Mock services
vi.mock('@/features/aas-explorer/services/update-service');

describe('Undo/Redo Flow - Integration', () => {
  const mockFileId = 'test-file-id';
  const mockElementPath = [
    { type: 'submodel' as const, id: 'sm1' },
    { type: 'element' as const, id: 'prop1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    undoService.clear();

    // Mock update service
    vi.mocked(updateService.updatePropertyValue).mockResolvedValue({
      element: {} as any,
      version: 2,
      timestamp: new Date().toISOString(),
    });
  });

  it('should execute command and enable undo', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Execute command
    await undoService.executeCommand(command);

    // Verify command was executed
    expect(updateService.updatePropertyValue).toHaveBeenCalledWith(
      mockFileId,
      mockElementPath,
      'new-value'
    );

    // Verify undo is available
    expect(undoService.canUndo()).toBe(true);
    expect(undoService.canRedo()).toBe(false);
  });

  it('should undo command and enable redo', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Execute and undo
    await undoService.executeCommand(command);
    await undoService.undo();

    // Verify undo was called with old value
    expect(updateService.updatePropertyValue).toHaveBeenLastCalledWith(
      mockFileId,
      mockElementPath,
      'old-value'
    );

    // Verify state
    expect(undoService.canUndo()).toBe(false);
    expect(undoService.canRedo()).toBe(true);
  });

  it('should redo command after undo', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Execute, undo, then redo
    await undoService.executeCommand(command);
    await undoService.undo();
    await undoService.redo();

    // Verify redo was called with new value
    expect(updateService.updatePropertyValue).toHaveBeenLastCalledWith(
      mockFileId,
      mockElementPath,
      'new-value'
    );

    // Verify state
    expect(undoService.canUndo()).toBe(true);
    expect(undoService.canRedo()).toBe(false);
  });

  it('should handle multiple commands in sequence', async () => {
    const command1 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value0',
      'value1',
      'prop1'
    );

    const command2 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value1',
      'value2',
      'prop2'
    );

    const command3 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value2',
      'value3',
      'prop3'
    );

    // Execute all commands
    await undoService.executeCommand(command1);
    await undoService.executeCommand(command2);
    await undoService.executeCommand(command3);

    // Verify history size
    expect(undoService.getState().historySize).toBe(3);

    // Undo twice
    await undoService.undo();
    await undoService.undo();

    // Should be able to undo one more time
    expect(undoService.canUndo()).toBe(true);
    expect(undoService.canRedo()).toBe(true);

    // Undo last command
    await undoService.undo();

    // Should not be able to undo anymore
    expect(undoService.canUndo()).toBe(false);
    expect(undoService.canRedo()).toBe(true);
  });

  it('should clear redo stack when new command is executed after undo', async () => {
    const command1 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value0',
      'value1',
      'prop1'
    );

    const command2 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value1',
      'value2',
      'prop2'
    );

    // Execute and undo
    await undoService.executeCommand(command1);
    await undoService.undo();

    // Verify redo is available
    expect(undoService.canRedo()).toBe(true);

    // Execute new command
    await undoService.executeCommand(command2);

    // Redo should no longer be available
    expect(undoService.canRedo()).toBe(false);
    expect(undoService.canUndo()).toBe(true);
  });

  it('should provide command descriptions', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    await undoService.executeCommand(command);

    // Check undo description
    const undoDesc = undoService.getUndoDescription();
    expect(undoDesc).toContain('testProperty');
    expect(undoDesc).toContain('new-value');

    // Undo and check redo description
    await undoService.undo();
    const redoDesc = undoService.getRedoDescription();
    expect(redoDesc).toContain('testProperty');
  });

  it('should respect max stack size', async () => {
    // Execute 51 commands (max is 50)
    for (let i = 0; i < 51; i++) {
      const command = new UpdatePropertyCommand(
        mockFileId,
        mockElementPath,
        `value${i}`,
        `value${i + 1}`,
        `prop${i}`
      );
      await undoService.executeCommand(command);
    }

    // History should be capped at 50
    expect(undoService.getState().historySize).toBe(50);
  });

  it('should handle command execution errors', async () => {
    const mockError = new Error('Command execution failed');
    vi.mocked(updateService.updatePropertyValue).mockRejectedValue(mockError);

    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Should throw error
    await expect(undoService.executeCommand(command)).rejects.toThrow(
      'Command execution failed'
    );

    // Command should not be added to history
    expect(undoService.canUndo()).toBe(false);
  });

  it('should handle undo errors gracefully', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Execute command successfully
    vi.mocked(updateService.updatePropertyValue).mockResolvedValueOnce({
      element: {} as any,
      version: 2,
      timestamp: new Date().toISOString(),
    });

    await undoService.executeCommand(command);

    // Make undo fail
    vi.mocked(updateService.updatePropertyValue).mockRejectedValueOnce(
      new Error('Undo failed')
    );

    // Undo should throw error
    await expect(undoService.undo()).rejects.toThrow('Undo failed');

    // Command should still be in undo stack
    expect(undoService.canUndo()).toBe(true);
  });

  it('should integrate with EditorToolbar component', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Execute command
    await undoService.executeCommand(command);

    // Render toolbar
    const { rerender } = render(<EditorToolbar />);

    // Wait for state update
    await waitFor(() => {
      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
    });

    // Click undo
    const undoButton = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoButton);

    // Wait for undo to complete
    await waitFor(() => {
      expect(updateService.updatePropertyValue).toHaveBeenLastCalledWith(
        mockFileId,
        mockElementPath,
        'old-value'
      );
    });

    // Rerender to get updated state
    rerender(<EditorToolbar />);

    // Redo button should now be enabled
    await waitFor(() => {
      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();
    });
  });

  it('should handle keyboard shortcuts', async () => {
    const command = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'old-value',
      'new-value',
      'testProperty'
    );

    // Execute command
    await undoService.executeCommand(command);

    // Clear previous calls
    vi.clearAllMocks();

    // Simulate Ctrl+Z (undo)
    const undoEvent = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(undoEvent);

    // Wait for undo with increased timeout
    await waitFor(() => {
      expect(updateService.updatePropertyValue).toHaveBeenCalledWith(
        mockFileId,
        mockElementPath,
        'old-value'
      );
    }, { timeout: 2000 });

    // Clear calls again
    vi.clearAllMocks();

    // Simulate Ctrl+Y (redo)
    const redoEvent = new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(redoEvent);

    // Wait for redo with increased timeout
    await waitFor(() => {
      expect(updateService.updatePropertyValue).toHaveBeenCalledWith(
        mockFileId,
        mockElementPath,
        'new-value'
      );
    }, { timeout: 2000 });
  });

  it('should clear history', async () => {
    const command1 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value0',
      'value1',
      'prop1'
    );

    const command2 = new UpdatePropertyCommand(
      mockFileId,
      mockElementPath,
      'value1',
      'value2',
      'prop2'
    );

    // Execute commands
    await undoService.executeCommand(command1);
    await undoService.executeCommand(command2);

    // Verify history
    expect(undoService.getState().historySize).toBe(2);

    // Clear history
    undoService.clear();

    // Verify cleared
    expect(undoService.canUndo()).toBe(false);
    expect(undoService.canRedo()).toBe(false);
    expect(undoService.getState().historySize).toBe(0);
  });
});
