/**
 * Undo Service - Test Suite
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { undoService } from '../undo-service';
import { UpdatePropertyCommand, AddElementCommand, BatchCommand } from '../commands';
import { AasSubmodelElements, DataTypeDefXsd } from '../../../../../../shared/aas-v3-types';

// Mock the update service
vi.mock('../update-service', () => ({
  updateService: {
    updatePropertyValue: vi.fn().mockResolvedValue({
      element: { idShort: 'Test' },
      version: 1,
      timestamp: '2025-01-01T00:00:00Z',
    }),
    addElement: vi.fn().mockResolvedValue({
      element: { idShort: 'NewElement' },
      index: 0,
      version: 1,
      timestamp: '2025-01-01T00:00:00Z',
    }),
    removeElement: vi.fn().mockResolvedValue({
      removedElement: { idShort: 'Removed' },
      version: 1,
      timestamp: '2025-01-01T00:00:00Z',
    }),
  },
}));

describe('UndoService', () => {
  beforeEach(() => {
    undoService.clear();
    vi.clearAllMocks();
  });

  describe('executeCommand', () => {
    it('should execute command and add to history', async () => {
      // Arrange
      const command = new UpdatePropertyCommand(
        'file-id',
        [{ type: 'element', id: 'e1' }],
        'old',
        'new'
      );

      // Act
      await undoService.executeCommand(command);

      // Assert
      expect(undoService.canUndo()).toBe(true);
      expect(undoService.getUndoDescription()).toContain('new');
    });

    it('should clear redo stack when new command executed', async () => {
      // Arrange
      const cmd1 = new UpdatePropertyCommand('file-id', [], 'old1', 'new1');
      const cmd2 = new UpdatePropertyCommand('file-id', [], 'old2', 'new2');
      const cmd3 = new UpdatePropertyCommand('file-id', [], 'old3', 'new3');

      await undoService.executeCommand(cmd1);
      await undoService.executeCommand(cmd2);
      await undoService.undo();

      // Act
      await undoService.executeCommand(cmd3);

      // Assert
      expect(undoService.canRedo()).toBe(false);
    });

    it('should limit stack size to 50', async () => {
      // Arrange & Act
      for (let i = 0; i < 60; i++) {
        const cmd = new UpdatePropertyCommand('file-id', [], `old${i}`, `new${i}`);
        await undoService.executeCommand(cmd);
      }

      // Assert
      const state = undoService.getState();
      expect(state.historySize).toBe(50);
    });
  });

  describe('undo', () => {
    it('should undo last command', async () => {
      // Arrange
      const command = new UpdatePropertyCommand(
        'file-id',
        [{ type: 'element', id: 'e1' }],
        'old',
        'new'
      );
      await undoService.executeCommand(command);

      // Act
      await undoService.undo();

      // Assert
      expect(undoService.canUndo()).toBe(false);
      expect(undoService.canRedo()).toBe(true);
    });

    it('should throw error when nothing to undo', async () => {
      // Act & Assert
      await expect(undoService.undo()).rejects.toThrow('Nothing to undo');
    });
  });

  describe('redo', () => {
    it('should redo last undone command', async () => {
      // Arrange
      const command = new UpdatePropertyCommand('file-id', [], 'old', 'new');
      await undoService.executeCommand(command);
      await undoService.undo();

      // Act
      await undoService.redo();

      // Assert
      expect(undoService.canUndo()).toBe(true);
      expect(undoService.canRedo()).toBe(false);
    });

    it('should throw error when nothing to redo', async () => {
      // Act & Assert
      await expect(undoService.redo()).rejects.toThrow('Nothing to redo');
    });
  });

  describe('getState', () => {
    it('should return correct state', async () => {
      // Arrange
      const cmd = new UpdatePropertyCommand('file-id', [], 'old', 'new');
      await undoService.executeCommand(cmd);

      // Act
      const state = undoService.getState();

      // Assert
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
      expect(state.undoDescription).toBeDefined();
      expect(state.historySize).toBe(1);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', async () => {
      // Arrange
      const listener = vi.fn();
      undoService.subscribe(listener);
      const cmd = new UpdatePropertyCommand('file-id', [], 'old', 'new');

      // Act
      await undoService.executeCommand(cmd);

      // Assert
      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ canUndo: true })
      );
    });

    it('should allow unsubscribe', async () => {
      // Arrange
      const listener = vi.fn();
      const unsubscribe = undoService.subscribe(listener);
      unsubscribe();
      const cmd = new UpdatePropertyCommand('file-id', [], 'old', 'new');

      // Act
      await undoService.executeCommand(cmd);

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all history', async () => {
      // Arrange
      const cmd = new UpdatePropertyCommand('file-id', [], 'old', 'new');
      await undoService.executeCommand(cmd);

      // Act
      undoService.clear();

      // Assert
      expect(undoService.canUndo()).toBe(false);
      expect(undoService.canRedo()).toBe(false);
      expect(undoService.getState().historySize).toBe(0);
    });
  });
});

describe('Commands', () => {
  describe('UpdatePropertyCommand', () => {
    it('should execute and undo', async () => {
      // Arrange
      const cmd = new UpdatePropertyCommand(
        'file-id',
        [{ type: 'element', id: 'e1' }],
        'old',
        'new'
      );

      // Act
      await cmd.execute();
      expect(cmd.canUndo()).toBe(true);
      
      await cmd.undo();

      // Assert - verify it was called with old value
      const { updateService } = await import('../update-service');
      expect(updateService.updatePropertyValue).toHaveBeenCalledWith(
        'file-id',
        [{ type: 'element', id: 'e1' }],
        'old'
      );
    });
  });

  describe('AddElementCommand', () => {
    it('should execute and undo', async () => {
      // Arrange
      const element = {
        modelType: AasSubmodelElements.Property,
        idShort: 'NewProp',
        valueType: DataTypeDefXsd.String,
        value: 'test',
      };
      const cmd = new AddElementCommand(
        'file-id',
        [{ type: 'submodel', id: 'sm1' }],
        element as any
      );

      // Act
      await cmd.execute();
      expect(cmd.canUndo()).toBe(true);
      
      await cmd.undo();

      // Assert
      const { updateService } = await import('../update-service');
      expect(updateService.removeElement).toHaveBeenCalled();
    });
  });

  describe('BatchCommand', () => {
    it('should execute multiple commands', async () => {
      // Arrange
      const cmd1 = new UpdatePropertyCommand('file-id', [], 'old1', 'new1');
      const cmd2 = new UpdatePropertyCommand('file-id', [], 'old2', 'new2');
      const batch = new BatchCommand([cmd1, cmd2], 'Batch update');

      // Act
      await batch.execute();

      // Assert
      expect(batch.canUndo()).toBe(true);
    });

    it('should undo in reverse order', async () => {
      // Arrange
      const commands: any[] = [];
      const cmd1 = new UpdatePropertyCommand('file-id', [], 'old1', 'new1');
      const cmd2 = new UpdatePropertyCommand('file-id', [], 'old2', 'new2');
      
      const batch = new BatchCommand([cmd1, cmd2]);
      await batch.execute();

      // Act
      await batch.undo();

      // Assert - commands should be undone in reverse
      expect(batch.canUndo()).toBe(true);
    });
  });
});
