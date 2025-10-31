/**
 * Breadcrumb Navigation Component
 * 
 * Displays hierarchical navigation path for AAS tree structure.
 * Supports click navigation, keyboard accessibility, and responsive design.
 */

import React, { useMemo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/stores/breadcrumbStore';

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
  maxItems?: number;
  className?: string;
}

/**
 * Get icon for breadcrumb item type
 */
function getTypeIcon(type: BreadcrumbItem['type']): React.ReactNode {
  switch (type) {
    case 'environment':
      return <Home className="h-4 w-4" />;
    default:
      return null;
  }
}

/**
 * Get color class for item type
 */
function getTypeColor(type: BreadcrumbItem['type']): string {
  switch (type) {
    case 'environment':
      return 'text-blue-600 dark:text-blue-400';
    case 'shell':
      return 'text-green-600 dark:text-green-400';
    case 'submodel':
      return 'text-purple-600 dark:text-purple-400';
    case 'collection':
      return 'text-orange-600 dark:text-orange-400';
    case 'element':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Breadcrumb Navigation Component
 */
export function BreadcrumbNavigation({
  items,
  onNavigate,
  maxItems = 5,
  className,
}: BreadcrumbNavigationProps) {
  // Collapse items if too many
  const displayItems = useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }
    
    // Keep first, last, and middle items
    const first = items[0];
    const last = items[items.length - 1];
    const middle = items.slice(1, items.length - 1);
    
    return [
      first,
      { id: 'ellipsis', label: '...', type: 'element' as const, path: [], level: 0 },
      ...middle.slice(-2),
      last,
    ];
  }, [items, maxItems]);
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-1 text-sm overflow-x-auto py-2 px-4 bg-muted/30 rounded-lg',
        className
      )}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.id === 'ellipsis';
          
          return (
            <li key={`${item.id}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
              
              {isEllipsis ? (
                <span className="text-muted-foreground px-2">...</span>
              ) : (
                <button
                  onClick={() => !isLast && onNavigate(item)}
                  disabled={isLast}
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'flex items-center space-x-1 px-2 py-1 rounded transition-colors',
                    isLast
                      ? 'font-semibold cursor-default'
                      : 'hover:bg-muted cursor-pointer',
                    getTypeColor(item.type)
                  )}
                >
                  {item.type === 'environment' && getTypeIcon(item.type)}
                  <span className="truncate max-w-[200px]">{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Compact Breadcrumb for mobile
 */
export function CompactBreadcrumb({
  items,
  onNavigate,
  className,
}: Omit<BreadcrumbNavigationProps, 'maxItems'>) {
  if (items.length === 0) {
    return null;
  }
  
  const currentItem = items[items.length - 1];
  const parentItem = items.length > 1 ? items[items.length - 2] : null;
  
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm py-2 px-4', className)}
    >
      {parentItem && (
        <>
          <button
            onClick={() => onNavigate(parentItem)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {parentItem.label}
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </>
      )}
      <span className={cn('font-semibold', getTypeColor(currentItem.type))}>
        {currentItem.label}
      </span>
    </nav>
  );
}

/**
 * Responsive Breadcrumb that switches between full and compact
 */
export function ResponsiveBreadcrumb(props: BreadcrumbNavigationProps) {
  return (
    <>
      <div className="hidden md:block">
        <BreadcrumbNavigation {...props} />
      </div>
      <div className="block md:hidden">
        <CompactBreadcrumb {...props} />
      </div>
    </>
  );
}
