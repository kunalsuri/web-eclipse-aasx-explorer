/**
 * Context Menu Component
 * 
 * Right-click context menu with keyboard navigation support.
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  enabled?: boolean;
  visible?: boolean;
  separator?: boolean;
  onClick?: () => void;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  trigger: ReactNode;
  items: ContextMenuItem[];
}

export function ContextMenu({ trigger, items }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Handle right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate position
    const x = e.clientX;
    const y = e.clientY;

    setPosition({ x, y });
    setIsOpen(true);
  };

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Adjust position to stay in viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }

    if (x !== position.x || y !== position.y) {
      setPosition({ x, y });
    }
  }, [isOpen, position]);

  // Handle item click
  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.enabled) return;
    
    item.onClick?.();
    setIsOpen(false);
  };

  // Filter visible items
  const visibleItems = items.filter(item => item.visible !== false);

  return (
    <>
      <div ref={triggerRef} onContextMenu={handleContextMenu}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 shadow-lg"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {visibleItems.map((item, index) => {
            if (item.separator) {
              return <div key={`sep-${index}`} className="my-1 h-px bg-border" />;
            }

            const isDisabled = item.enabled === false;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm
                  transition-colors text-left
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                  }
                `}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
