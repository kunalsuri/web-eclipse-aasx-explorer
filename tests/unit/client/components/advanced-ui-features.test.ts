/**
 * Advanced UI Features Tests
 * 
 * Test suite for Phase 3 features:
 * - Undo/Redo
 * - Copy/Paste
 * - Multi-Select
 * - Commands
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCommandStore } from '../../../../client/src/stores/commandStore';
import { useClipboardStore } from '../../../../client/src/stores/clipboardStore';
import { useSelectionStore } from '../../../../client/src/stores/selectionStore';
import {
  CreateElementCommand,
  DeleteElementCommand,
  EditPropertyCommand,
  MoveElementCommand,
} from '../../../../client/src/commands/ElementCommands';

describe('Command Store', () => {
  beforeEach(() => {
    useCommandStore.getState().clear();
  });

  it('should execute a command', () => {
    const store = useCommandStore.getState();
    const obj = { value: 0 };
    const command = new EditPropertyCommand(obj, 'value', 10);

    store.execute(command);

    expect(obj.value).toBe(10);
    expect(store.canUndo()).toBe(true);
  });

  it('should undo a command', () => {
    const store = useCommandStore.getState();
    const obj = { value: 0 };
    const command = new EditPropertyCommand(obj, 'value', 10);

    store.execute(command);
    store.undo();

    expect(obj.value).toBe(0);
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(true);
  });

  it('should redo a command', () => {
    const store = useCommandStore.getState();
    const obj = { value: 0 };
    const command = new EditPropertyCommand(obj, 'value', 10);

    store.execute(command);
    store.undo();
    store.redo();

    expect(obj.value).toBe(10);
    expect(store.canRedo()).toBe(false);
  });

  it('should clear redo stack on new command', () => {
    const store = useCommandStore.getState();
    const obj = { value: 0 };

    const cmd1 = new EditPropertyCommand(obj, 'value', 10);
    store.execute(cmd1);
    store.undo();

    expect(store.canRedo()).toBe(true);

    const cmd2 = new EditPropertyCommand(obj, 'value', 20);
    store.execute(cmd2);

    expect(store.canRedo()).toBe(false);
  });

  it('should limit stack size', () => {
    const store = useCommandStore.getState();
    store.setMaxStackSize(3);

    const obj = { value: 0 };

    for (let i = 1; i <= 5; i++) {
      const cmd = new EditPropertyCommand(obj, 'value', i);
      store.execute(cmd);
    }

    const history = store.getUndoHistory();
    expect(history.length).toBe(3);
  });
});

describe('Create Element Command', () => {
  it('should create an element', () => {
    const parent = { children: [] };
    const element = { id: 'test', modelType: 'Property' };
    const command = new CreateElementCommand(parent, element);

    command.execute();

    expect(parent.children).toHaveLength(1);
    expect(parent.children[0].id).toBe('test');
  });

  it('should undo element creation', () => {
    const parent = { children: [] };
    const element = { id: 'test', modelType: 'Property' };
    const command = new CreateElementCommand(parent, element);

    command.execute();
    command.undo();

    expect(parent.children).toHaveLength(0);
  });
});

describe('Delete Element Command', () => {
  it('should delete an element', () => {
    const element = { id: 'test', modelType: 'Property' };
    const parent = { children: [element] };
    const command = new DeleteElementCommand(parent, element);

    command.execute();

    expect(parent.children).toHaveLength(0);
  });

  it('should undo element deletion', () => {
    const element = { id: 'test', modelType: 'Property' };
    const parent = { children: [element] };
    const command = new DeleteElementCommand(parent, element);

    command.execute();
    command.undo();

    expect(parent.children).toHaveLength(1);
    expect(parent.children[0].id).toBe('test');
  });
});

describe('Move Element Command', () => {
  it('should move element within same parent', () => {
    const el1 = { id: '1' };
    const el2 = { id: '2' };
    const el3 = { id: '3' };
    const parent = { children: [el1, el2, el3] };

    // Move from index 0 to index 2
    // After removing from 0: [2,3]
    // Insert at adjusted index (2-1=1): [2,1,3]
    const command = new MoveElementCommand(el1, parent, 0, parent, 2);
    command.execute();

    expect(parent.children[0].id).toBe('2');
    expect(parent.children[1].id).toBe('1');
    expect(parent.children[2].id).toBe('3');
  });

  it('should undo move operation', () => {
    const el1 = { id: '1' };
    const el2 = { id: '2' };
    const el3 = { id: '3' };
    const parent = { children: [el1, el2, el3] };

    const command = new MoveElementCommand(el1, parent, 0, parent, 2);
    command.execute();
    command.undo();

    expect(parent.children[0].id).toBe('1');
    expect(parent.children[1].id).toBe('2');
    expect(parent.children[2].id).toBe('3');
  });
});

describe('Clipboard Store', () => {
  beforeEach(() => {
    useClipboardStore.getState().clear();
  });

  it('should copy items', () => {
    const store = useClipboardStore.getState();
    const items = [{ id: 'test', modelType: 'Property' }];

    store.copy(items);

    // Get fresh state after mutation
    const data = useClipboardStore.getState().content;
    expect(data).not.toBeNull();
    expect(data?.operation).toBe('copy');
    expect(data?.elements).toHaveLength(1);
  });

  it('should cut items', () => {
    const store = useClipboardStore.getState();
    const items = [{ id: 'test', modelType: 'Property' }];

    store.cut(items);

    // Get fresh state after mutation
    const freshStore = useClipboardStore.getState();
    const data = freshStore.content;
    expect(data?.operation).toBe('cut');
    expect(freshStore.isCut('test')).toBe(true);
  });

  it('should validate paste target', () => {
    const store = useClipboardStore.getState();
    const items = [{ id: 'test', modelType: 'Property' }];

    store.copy(items);

    const validTarget = { modelType: 'SubmodelElementCollection', value: [] };
    const invalidTarget = { modelType: 'Property' };

    expect(store.canPaste(validTarget)).toBe(true);
    expect(store.canPaste(invalidTarget)).toBe(false);
  });

  it('should clear clipboard after cut and paste', async () => {
    const store = useClipboardStore.getState();
    const items = [{ id: 'test', modelType: 'Property' }];
    const target = { modelType: 'SubmodelElementCollection', value: [] };

    store.cut(items);
    await store.paste(target);

    expect(store.content).toBeNull();
  });
});

describe('Selection Store', () => {
  beforeEach(() => {
    useSelectionStore.getState().deselectAll();
  });

  it('should select single item', () => {
    const store = useSelectionStore.getState();

    store.select('item1', 'single');

    expect(store.isSelected('item1')).toBe(true);
    expect(store.getSelectedCount()).toBe(1);
  });

  it('should toggle selection', () => {
    const store = useSelectionStore.getState();

    store.toggle('item1');
    expect(store.isSelected('item1')).toBe(true);

    store.toggle('item1');
    expect(store.isSelected('item1')).toBe(false);
  });

  it('should select range', () => {
    const store = useSelectionStore.getState();
    const allIds = ['item1', 'item2', 'item3', 'item4', 'item5'];

    store.selectRange('item2', 'item4', allIds);

    expect(store.isSelected('item1')).toBe(false);
    expect(store.isSelected('item2')).toBe(true);
    expect(store.isSelected('item3')).toBe(true);
    expect(store.isSelected('item4')).toBe(true);
    expect(store.isSelected('item5')).toBe(false);
  });

  it('should select all', () => {
    const store = useSelectionStore.getState();
    const allIds = ['item1', 'item2', 'item3'];

    store.selectAll(allIds);

    expect(store.getSelectedCount()).toBe(3);
  });

  it('should clear selection', () => {
    const store = useSelectionStore.getState();

    store.selectAll(['item1', 'item2']);
    store.deselectAll();

    expect(store.getSelectedCount()).toBe(0);
  });
});

describe('Integration: Undo/Redo with Commands', () => {
  beforeEach(() => {
    useCommandStore.getState().clear();
  });

  it('should undo and redo multiple operations', () => {
    const store = useCommandStore.getState();
    const obj = { value: 0 };

    // Execute multiple commands
    store.execute(new EditPropertyCommand(obj, 'value', 10));
    store.execute(new EditPropertyCommand(obj, 'value', 20));
    store.execute(new EditPropertyCommand(obj, 'value', 30));

    expect(obj.value).toBe(30);

    // Undo all
    store.undo();
    expect(obj.value).toBe(20);
    store.undo();
    expect(obj.value).toBe(10);
    store.undo();
    expect(obj.value).toBe(0);

    // Redo all
    store.redo();
    expect(obj.value).toBe(10);
    store.redo();
    expect(obj.value).toBe(20);
    store.redo();
    expect(obj.value).toBe(30);
  });

  it('should handle complex workflow', () => {
    const store = useCommandStore.getState();
    const parent = { children: [] };

    // Create element
    const element = { id: 'test', value: 0 };
    store.execute(new CreateElementCommand(parent, element));
    expect(parent.children).toHaveLength(1);

    // Edit element
    store.execute(new EditPropertyCommand(element, 'value', 100));
    expect(element.value).toBe(100);

    // Undo edit
    store.undo();
    expect(element.value).toBe(0);

    // Undo create
    store.undo();
    expect(parent.children).toHaveLength(0);

    // Redo both
    store.redo();
    expect(parent.children).toHaveLength(1);
    store.redo();
    expect(element.value).toBe(100);
  });
});
