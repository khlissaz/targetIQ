import { render, screen, fireEvent } from '@testing-library/react';
import { TargetIQTabs, TargetIQSubTabs } from './targetiq-tabs';
import React from 'react';

describe('TargetIQTabs component', () => {
  const tabs = [
    { key: 'tab1', label: 'Tab 1', icon: '🔥' },
    { key: 'tab2', label: 'Tab 2', icon: '💧' },
  ];
  it('renders all tabs and highlights the active one', () => {
    const onTabChange = jest.fn();
    render(<TargetIQTabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 1').closest('button')).toHaveClass('bg-targetiq-primary');
    expect(screen.getByText('Tab 2').closest('button')).toHaveClass('bg-targetiq-grey');
  });
  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = jest.fn();
    render(<TargetIQTabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });
});

describe('TargetIQSubTabs component', () => {
  const subtabs = [
    { key: 'sub1', label: 'Sub 1' },
    { key: 'sub2', label: 'Sub 2' },
  ];
  it('renders all subtabs and highlights the active one', () => {
    const onTabChange = jest.fn();
    render(<TargetIQSubTabs tabs={subtabs} activeTab="sub2" onTabChange={onTabChange} />);
    expect(screen.getByText('Sub 1')).toBeInTheDocument();
    expect(screen.getByText('Sub 2')).toBeInTheDocument();
    expect(screen.getByText('Sub 2').closest('button')).toHaveClass('text-targetiq-primary');
  });
  it('calls onTabChange when a subtab is clicked', () => {
    const onTabChange = jest.fn();
    render(<TargetIQSubTabs tabs={subtabs} activeTab="sub1" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('Sub 2'));
    expect(onTabChange).toHaveBeenCalledWith('sub2');
  });
});
