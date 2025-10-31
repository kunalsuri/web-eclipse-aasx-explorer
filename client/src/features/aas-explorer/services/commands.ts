/**
 * Command Pattern Implementation
 * Base command interface and implementations for undo/redo
 * 
 * Commands encapsulate all information needed to execute and undo an operation
 */

import { updateService, type ElementPath } from './update-service';
import type { SubmodelElement, LangStringTextType } from '../../../../../shared/aas-v3-types';

/**
 * Base command interface
 */
export interface Command {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
  execute(): Promise<void>;
  undo(): Promise<void>;
  canUndo(): boolean;
}

/**
 * Abstract base command class
 */
export abstract class BaseCommand implements Command {
  readonly id: string;
  readonly timestamp: Date;

  constructor(
    public readonly type: string,
    public readonly description: string
  ) {
    this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date();
  }

  abstract execute(): Promise<void>;
  abstract undo(): Promise<void>;

  canUndo(): boolean {
    return true;
  }
}

/**
 * Update Property Value Command
 */
export class UpdatePropertyCommand extends BaseCommand {
  private executed = false;

  constructor(
    private readonly fileId: string,
    private readonly elementPath: ElementPath[],
    private readonly oldValue: any,
    private readonly newValue: any,
    private readonly propertyName: string = 'value'
  ) {
    super(
      'update-property',
      `Update ${propertyName} to "${String(newValue).substring(0, 50)}"`
    );
  }

  async execute(): Promise<void> {
    await updateService.updatePropertyValue(
      this.fileId,
      this.elementPath,
      this.newValue
    );
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.updatePropertyValue(
      this.fileId,
      this.elementPath,
      this.oldValue
    );
  }

  canUndo(): boolean {
    return this.executed;
  }
}

/**
 * Update Element Command (multiple properties)
 */
export class UpdateElementCommand extends BaseCommand {
  private executed = false;

  constructor(
    private readonly fileId: string,
    private readonly elementPath: ElementPath[],
    private readonly oldValues: Partial<SubmodelElement>,
    private readonly newValues: Partial<SubmodelElement>,
    private readonly elementName: string = 'element'
  ) {
    super(
      'update-element',
      `Update ${elementName} properties`
    );
  }

  async execute(): Promise<void> {
    await updateService.updateElement(
      this.fileId,
      this.elementPath,
      this.newValues
    );
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.updateElement(
      this.fileId,
      this.elementPath,
      this.oldValues
    );
  }

  canUndo(): boolean {
    return this.executed;
  }
}

/**
 * Update Multi-Language Property Command
 */
export class UpdateMultiLanguageCommand extends BaseCommand {
  private executed = false;

  constructor(
    private readonly fileId: string,
    private readonly elementPath: ElementPath[],
    private readonly oldValue: LangStringTextType[],
    private readonly newValue: LangStringTextType[],
    private readonly propertyName: string = 'multi-language property'
  ) {
    super(
      'update-multi-language',
      `Update ${propertyName} (${newValue.length} languages)`
    );
  }

  async execute(): Promise<void> {
    await updateService.updateMultiLanguageProperty(
      this.fileId,
      this.elementPath,
      this.newValue
    );
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.updateMultiLanguageProperty(
      this.fileId,
      this.elementPath,
      this.oldValue
    );
  }

  canUndo(): boolean {
    return this.executed;
  }
}

/**
 * Add Element Command
 */
export class AddElementCommand extends BaseCommand {
  private executed = false;
  private addedElementPath?: ElementPath[];

  constructor(
    private readonly fileId: string,
    private readonly parentPath: ElementPath[],
    private readonly element: SubmodelElement,
    private readonly position?: number
  ) {
    super(
      'add-element',
      `Add ${element.modelType} "${element.idShort || 'unnamed'}"`
    );
  }

  async execute(): Promise<void> {
    const result = await updateService.addElement(
      this.fileId,
      this.parentPath,
      this.element,
      this.position
    );
    
    // Store the path to the added element for undo
    this.addedElementPath = [
      ...this.parentPath,
      { type: 'element', id: result.element.idShort || '' }
    ];
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed || !this.addedElementPath) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.removeElement(this.fileId, this.addedElementPath);
  }

  canUndo(): boolean {
    return this.executed && !!this.addedElementPath;
  }
}

/**
 * Remove Element Command
 */
export class RemoveElementCommand extends BaseCommand {
  private executed = false;
  private removedElement?: SubmodelElement;
  private removedPosition?: number;

  constructor(
    private readonly fileId: string,
    private readonly elementPath: ElementPath[],
    private readonly parentPath: ElementPath[],
    private readonly elementName: string = 'element'
  ) {
    super(
      'remove-element',
      `Remove ${elementName}`
    );
  }

  async execute(): Promise<void> {
    const result = await updateService.removeElement(
      this.fileId,
      this.elementPath
    );
    this.removedElement = result.removedElement;
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed || !this.removedElement) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.addElement(
      this.fileId,
      this.parentPath,
      this.removedElement,
      this.removedPosition
    );
  }

  canUndo(): boolean {
    return this.executed && !!this.removedElement;
  }
}

/**
 * Reorder Elements Command
 */
export class ReorderElementsCommand extends BaseCommand {
  private executed = false;

  constructor(
    private readonly fileId: string,
    private readonly parentPath: ElementPath[],
    private readonly oldOrder: string[],
    private readonly newOrder: string[]
  ) {
    super(
      'reorder-elements',
      `Reorder ${newOrder.length} elements`
    );
  }

  async execute(): Promise<void> {
    await updateService.reorderElements(
      this.fileId,
      this.parentPath,
      this.newOrder
    );
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.reorderElements(
      this.fileId,
      this.parentPath,
      this.oldOrder
    );
  }

  canUndo(): boolean {
    return this.executed;
  }
}

/**
 * Batch Command - Execute multiple commands as one
 */
export class BatchCommand extends BaseCommand {
  private executed = false;

  constructor(
    private readonly commands: Command[],
    description: string = 'Batch operation'
  ) {
    super('batch', description);
  }

  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo command that was not executed');
    }
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  canUndo(): boolean {
    return this.executed && this.commands.every(cmd => cmd.canUndo());
  }
}

/**
 * Bulk Delete Command - Delete multiple elements
 */
export class BulkDeleteCommand extends BaseCommand {
  private executed = false;
  private removedElements: Map<string, { element: SubmodelElement; path: ElementPath[] }> = new Map();

  constructor(
    private readonly fileId: string,
    private readonly elementPaths: Map<string, ElementPath[]>,
    private readonly parentPath: ElementPath[]
  ) {
    super(
      'bulk-delete',
      `Delete ${elementPaths.size} elements`
    );
  }

  async execute(): Promise<void> {
    // Delete in reverse order to maintain indices
    const paths = Array.from(this.elementPaths.entries()).reverse();
    
    for (const [id, path] of paths) {
      const result = await updateService.removeElement(this.fileId, path);
      this.removedElements.set(id, { element: result.removedElement, path });
    }
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo command that was not executed');
    }
    
    // Restore in original order
    const entries = Array.from(this.removedElements.entries());
    for (const [id, { element }] of entries) {
      await updateService.addElement(this.fileId, this.parentPath, element);
    }
  }

  canUndo(): boolean {
    return this.executed && this.removedElements.size > 0;
  }
}

/**
 * Paste Command - Paste element from clipboard
 */
export class PasteCommand extends BaseCommand {
  private executed = false;
  private pastedElementPath?: ElementPath[];

  constructor(
    private readonly fileId: string,
    private readonly parentPath: ElementPath[],
    private readonly element: SubmodelElement,
    private readonly position?: number
  ) {
    super(
      'paste',
      `Paste ${element.modelType} "${element.idShort || 'unnamed'}"`
    );
  }

  async execute(): Promise<void> {
    const result = await updateService.addElement(
      this.fileId,
      this.parentPath,
      this.element,
      this.position
    );
    
    this.pastedElementPath = [
      ...this.parentPath,
      { type: 'element', id: result.element.idShort || '' }
    ];
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed || !this.pastedElementPath) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.removeElement(this.fileId, this.pastedElementPath);
  }

  canUndo(): boolean {
    return this.executed && !!this.pastedElementPath;
  }
}

/**
 * Duplicate Command - Duplicate an element
 */
export class DuplicateCommand extends BaseCommand {
  private executed = false;
  private duplicatedElementPath?: ElementPath[];

  constructor(
    private readonly fileId: string,
    private readonly parentPath: ElementPath[],
    private readonly element: SubmodelElement
  ) {
    super(
      'duplicate',
      `Duplicate ${element.modelType} "${element.idShort || 'unnamed'}"`
    );
  }

  async execute(): Promise<void> {
    // Create a deep copy with new ID
    const duplicated = JSON.parse(JSON.stringify(this.element));
    if (duplicated.idShort) {
      duplicated.idShort = `${duplicated.idShort}_copy`;
    }

    const result = await updateService.addElement(
      this.fileId,
      this.parentPath,
      duplicated
    );
    
    this.duplicatedElementPath = [
      ...this.parentPath,
      { type: 'element', id: result.element.idShort || '' }
    ];
    this.executed = true;
  }

  async undo(): Promise<void> {
    if (!this.executed || !this.duplicatedElementPath) {
      throw new Error('Cannot undo command that was not executed');
    }
    await updateService.removeElement(this.fileId, this.duplicatedElementPath);
  }

  canUndo(): boolean {
    return this.executed && !!this.duplicatedElementPath;
  }
}
