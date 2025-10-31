/**
 * Drag and Drop Tree View Component
 * 
 * Tree view with drag and drop reordering support.
 * Integrates with undo/redo system.
 */

import { useState, ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useCommandStore } from '../../stores/commandStore';
import { MoveElementCommand } from '../../commands/ElementCommands';

interface DndTreeViewProps {
  items: any[];
  renderItem: (item: any) => ReactNode;
  getItemId: (item: any) => string;
  onReorder?: (items: any[]) => void;
}

export function DndTreeView({
  items,
  renderItem,
  getItemId,
  onReorder,
}: DndTreeViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const execute = useCommandStore((state) => state.execute);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
    const newIndex = items.findIndex((item) => getItemId(item) === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null);
      return;
    }

    // Get the item being moved
    const movedItem = items[oldIndex];

    // Create move command for undo/redo
    const command = new MoveElementCommand(
      movedItem,
      movedItem.parent || { children: items },
      oldIndex,
      movedItem.parent || { children: items },
      newIndex
    );

    execute(command);

    // Notify parent of reorder
    if (onReorder) {
      const newItems = [...items];
      newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      onReorder(newItems);
    }

    setActiveId(null);
  }

  const activeItem = activeId ? items.find((item) => getItemId(item) === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(getItemId)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => renderItem(item))}
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div className="drag-overlay">
            {renderItem(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
