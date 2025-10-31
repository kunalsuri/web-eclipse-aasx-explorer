/**
 * Element Commands
 * 
 * Concrete command implementations for element operations.
 * Used by the undo/redo system.
 */

import { BaseCommand } from './Command';
import type { SubmodelElement } from '../../../shared/aas-v3-types';

/**
 * Create Element Command
 * Adds a new element to a parent's children array
 */
export class CreateElementCommand extends BaseCommand {
  private element: any;

  constructor(
    private parent: any,
    element: any,
    private index?: number
  ) {
    super(`Create ${element.modelType || 'Element'}`);
    this.element = this.deepClone(element);
  }

  execute(): void {
    const targetArray = this.getTargetArray();
    const insertIndex = this.index !== undefined ? this.index : targetArray.length;
    targetArray.splice(insertIndex, 0, this.element);
  }

  undo(): void {
    const targetArray = this.getTargetArray();
    const elementIndex = targetArray.indexOf(this.element);
    if (elementIndex !== -1) {
      targetArray.splice(elementIndex, 1);
    }
  }

  private getTargetArray(): any[] {
    return (
      this.parent.value ||
      this.parent.submodelElements ||
      this.parent.children ||
      this.parent.statements ||
      []
    );
  }
}

/**
 * Delete Element Command
 * Removes an element from its parent's children array
 */
export class DeleteElementCommand extends BaseCommand {
  private element: any;
  private index: number;

  constructor(
    private parent: any,
    element: any
  ) {
    super(`Delete ${element.modelType || 'Element'}`);
    this.element = this.deepClone(element);
    this.index = this.getElementIndex(element);
  }

  execute(): void {
    const targetArray = this.getTargetArray();
    targetArray.splice(this.index, 1);
  }

  undo(): void {
    const targetArray = this.getTargetArray();
    targetArray.splice(this.index, 0, this.element);
  }

  private getTargetArray(): any[] {
    return (
      this.parent.value ||
      this.parent.submodelElements ||
      this.parent.children ||
      this.parent.statements ||
      []
    );
  }

  private getElementIndex(element: any): number {
    const targetArray = this.getTargetArray();
    return targetArray.indexOf(element);
  }
}

/**
 * Edit Property Command
 * Changes a property value on an object
 */
export class EditPropertyCommand extends BaseCommand {
  private oldValue: any;

  constructor(
    private target: any,
    private property: string,
    private newValue: any
  ) {
    super(`Edit ${property}`);
    this.oldValue = this.deepClone(target[property]);
  }

  execute(): void {
    this.target[this.property] = this.newValue;
  }

  undo(): void {
    this.target[this.property] = this.oldValue;
  }
}

/**
 * Move Element Command
 * Moves an element from one parent to another (or within same parent)
 */
export class MoveElementCommand extends BaseCommand {
  private element: any;

  constructor(
    element: any,
    private oldParent: any,
    private oldIndex: number,
    private newParent: any,
    private newIndex: number
  ) {
    super(`Move ${element.modelType || 'Element'}`);
    this.element = element; // Don't clone - we're moving the same object
  }

  execute(): void {
    const oldArray = this.getArray(this.oldParent);
    const newArray = this.getArray(this.newParent);

    // Remove from old position
    oldArray.splice(this.oldIndex, 1);

    // Adjust new index if moving within same parent
    let insertIndex = this.newIndex;
    if (this.oldParent === this.newParent && this.oldIndex < this.newIndex) {
      insertIndex--;
    }

    // Insert at new position
    newArray.splice(insertIndex, 0, this.element);
  }

  undo(): void {
    const oldArray = this.getArray(this.oldParent);
    const newArray = this.getArray(this.newParent);

    // Remove from new position
    const currentIndex = newArray.indexOf(this.element);
    if (currentIndex !== -1) {
      newArray.splice(currentIndex, 1);
    }

    // Restore to old position
    oldArray.splice(this.oldIndex, 0, this.element);
  }

  private getArray(parent: any): any[] {
    return (
      parent.value ||
      parent.submodelElements ||
      parent.children ||
      parent.statements ||
      []
    );
  }
}

/**
 * Paste Command
 * Pastes elements from clipboard to target
 */
export class PasteCommand extends BaseCommand {
  private pastedElements: any[] = [];

  constructor(
    private target: any,
    private items: any[],
    private index?: number
  ) {
    super(`Paste ${items.length} item(s)`);
  }

  execute(): void {
    const targetArray = this.getTargetArray();
    const insertIndex = this.index !== undefined ? this.index : targetArray.length;

    // Clone items with new IDs
    this.pastedElements = this.items.map((item) => this.deepClone(item));

    // Insert at target position
    targetArray.splice(insertIndex, 0, ...this.pastedElements);
  }

  undo(): void {
    const targetArray = this.getTargetArray();

    // Remove pasted elements
    this.pastedElements.forEach((element) => {
      const index = targetArray.indexOf(element);
      if (index !== -1) {
        targetArray.splice(index, 1);
      }
    });
  }

  private getTargetArray(): any[] {
    return (
      this.target.value ||
      this.target.submodelElements ||
      this.target.children ||
      this.target.statements ||
      []
    );
  }
}

/**
 * Bulk Delete Command
 * Deletes multiple elements at once
 */
export class BulkDeleteCommand extends BaseCommand {
  private deletedItems: Array<{ parent: any; element: any; index: number }> = [];

  constructor(items: Array<{ parent: any; element: any }>) {
    super(`Delete ${items.length} item(s)`);

    // Store items with their indices
    this.deletedItems = items.map(({ parent, element }) => ({
      parent,
      element: this.deepClone(element),
      index: this.getElementIndex(parent, element),
    }));

    // Sort by index descending to avoid index shifting during deletion
    this.deletedItems.sort((a, b) => b.index - a.index);
  }

  execute(): void {
    // Delete in reverse order to maintain indices
    this.deletedItems.forEach(({ parent, index }) => {
      const targetArray = this.getArray(parent);
      targetArray.splice(index, 1);
    });
  }

  undo(): void {
    // Restore in forward order
    const sortedItems = [...this.deletedItems].sort((a, b) => a.index - b.index);

    sortedItems.forEach(({ parent, element, index }) => {
      const targetArray = this.getArray(parent);
      targetArray.splice(index, 0, element);
    });
  }

  private getArray(parent: any): any[] {
    return (
      parent.value ||
      parent.submodelElements ||
      parent.children ||
      parent.statements ||
      []
    );
  }

  private getElementIndex(parent: any, element: any): number {
    const targetArray = this.getArray(parent);
    return targetArray.indexOf(element);
  }
}

/**
 * Duplicate Element Command
 * Creates a copy of an element next to the original
 */
export class DuplicateElementCommand extends BaseCommand {
  private duplicatedElement: any;
  private insertIndex: number;

  constructor(
    private parent: any,
    private element: any
  ) {
    super(`Duplicate ${element.modelType || 'Element'}`);
    this.duplicatedElement = this.deepClone(element);
    this.insertIndex = this.getElementIndex(element) + 1;

    // Modify ID/idShort to make it unique
    if (this.duplicatedElement.id) {
      this.duplicatedElement.id = `${this.duplicatedElement.id}_copy`;
    }
    if (this.duplicatedElement.idShort) {
      this.duplicatedElement.idShort = `${this.duplicatedElement.idShort}_copy`;
    }
  }

  execute(): void {
    const targetArray = this.getTargetArray();
    targetArray.splice(this.insertIndex, 0, this.duplicatedElement);
  }

  undo(): void {
    const targetArray = this.getTargetArray();
    const index = targetArray.indexOf(this.duplicatedElement);
    if (index !== -1) {
      targetArray.splice(index, 1);
    }
  }

  private getTargetArray(): any[] {
    return (
      this.parent.value ||
      this.parent.submodelElements ||
      this.parent.children ||
      this.parent.statements ||
      []
    );
  }

  private getElementIndex(element: any): number {
    const targetArray = this.getTargetArray();
    return targetArray.indexOf(element);
  }
}
