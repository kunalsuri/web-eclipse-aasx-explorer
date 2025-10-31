/**
 * Breadcrumb Navigation Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreadcrumbNavigation, CompactBreadcrumb, ResponsiveBreadcrumb } from '../breadcrumb-navigation';
import type { BreadcrumbItem } from '@/stores/breadcrumbStore';

describe('BreadcrumbNavigation', () => {
  const mockItems: BreadcrumbItem[] = [
    { id: 'env', label: 'Environment', type: 'environment', path: ['env'], level: 0 },
    { id: 'shell1', label: 'Shell-001', type: 'shell', path: ['env', 'shell1'], level: 1 },
    { id: 'sub1', label: 'TechnicalData', type: 'submodel', path: ['env', 'shell1', 'sub1'], level: 2 },
    { id: 'prop1', label: 'Temperature', type: 'element', path: ['env', 'shell1', 'sub1', 'prop1'], level: 3 },
  ];
  
  it('should render all breadcrumb items', () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} />);
    
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Shell-001')).toBeInTheDocument();
    expect(screen.getByText('TechnicalData')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });
  
  it('should call onNavigate when clicking non-last item', () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} />);
    
    fireEvent.click(screen.getByText('Shell-001'));
    
    expect(onNavigate).toHaveBeenCalledWith(mockItems[1]);
  });
  
  it('should not call onNavigate when clicking last item', () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} />);
    
    fireEvent.click(screen.getByText('Temperature'));
    
    expect(onNavigate).not.toHaveBeenCalled();
  });
  
  it('should mark last item as current page', () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} />);
    
    const lastItem = screen.getByText('Temperature').closest('button');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });
  
  it('should collapse items when exceeding maxItems', () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} maxItems={3} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });
  
  it('should render nothing when items array is empty', () => {
    const onNavigate = vi.fn();
    const { container } = render(<BreadcrumbNavigation items={[]} onNavigate={onNavigate} />);
    
    expect(container.firstChild).toBeNull();
  });
  
  it('should have proper ARIA labels', () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });
  
  it('should apply custom className', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <BreadcrumbNavigation items={mockItems} onNavigate={onNavigate} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('CompactBreadcrumb', () => {
  const mockItems: BreadcrumbItem[] = [
    { id: 'env', label: 'Environment', type: 'environment', path: ['env'], level: 0 },
    { id: 'shell1', label: 'Shell-001', type: 'shell', path: ['env', 'shell1'], level: 1 },
    { id: 'prop1', label: 'Temperature', type: 'element', path: ['env', 'shell1', 'prop1'], level: 2 },
  ];
  
  it('should render only current and parent items', () => {
    const onNavigate = vi.fn();
    render(<CompactBreadcrumb items={mockItems} onNavigate={onNavigate} />);
    
    expect(screen.getByText('Shell-001')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.queryByText('Environment')).not.toBeInTheDocument();
  });
  
  it('should call onNavigate when clicking parent', () => {
    const onNavigate = vi.fn();
    render(<CompactBreadcrumb items={mockItems} onNavigate={onNavigate} />);
    
    fireEvent.click(screen.getByText('Shell-001'));
    
    expect(onNavigate).toHaveBeenCalledWith(mockItems[1]);
  });
  
  it('should render only current item when no parent', () => {
    const singleItem: BreadcrumbItem[] = [
      { id: 'env', label: 'Environment', type: 'environment', path: ['env'], level: 0 },
    ];
    const onNavigate = vi.fn();
    render(<CompactBreadcrumb items={singleItem} onNavigate={onNavigate} />);
    
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ResponsiveBreadcrumb', () => {
  const mockItems: BreadcrumbItem[] = [
    { id: 'env', label: 'Environment', type: 'environment', path: ['env'], level: 0 },
    { id: 'shell1', label: 'Shell-001', type: 'shell', path: ['env', 'shell1'], level: 1 },
  ];
  
  it('should render both full and compact versions', () => {
    const onNavigate = vi.fn();
    render(<ResponsiveBreadcrumb items={mockItems} onNavigate={onNavigate} />);
    
    // Both versions should be in the DOM (CSS controls visibility)
    const navElements = screen.getAllByRole('navigation');
    expect(navElements).toHaveLength(2);
  });
});
