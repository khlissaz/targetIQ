'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TiqButton } from './TiqButton';

export type TiqTabItem<K extends string> = {
  key: K;
  label: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
};

export type TiqTabsProps<K extends string> = {
  value: K;
  onValueChange: (next: K) => void;
  items: ReadonlyArray<TiqTabItem<K>>;
  className?: string;
};

export function TiqTabs<K extends string>({ value, onValueChange, items, className }: TiqTabsProps<K>) {
  return (
    <div className={cn('grid grid-cols-4 gap-2 rounded-tiqLg border border-tiq-border bg-tiq-surface p-1', className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <TiqButton
            key={item.key}
            variant={active ? 'primary' : 'ghost'}
            size="sm"
            className={cn('h-9 w-full rounded-tiq px-2 text-xs', active ? 'shadow-tiq' : 'text-tiq-muted')}
            disabled={item.disabled}
            tooltip={item.disabled ? item.disabledReason : undefined}
            onClick={() => onValueChange(item.key)}
          >
            {item.label}
          </TiqButton>
        );
      })}
    </div>
  );
}
