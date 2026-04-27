'use client';

import * as React from 'react';
import { ElementType } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RowMenuAction {
  label: string;
  icon?: ElementType;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

export interface RowMenuProps {
  actions: RowMenuAction[];
}

export function RowMenu({ actions }: RowMenuProps) {
  const normal = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {normal.map((action, i) => {
          const Icon = action.icon;
          return (
            <React.Fragment key={i}>
              {action.separator && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {Icon ? <Icon className="me-2 h-4 w-4" /> : null}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}

        {normal.length > 0 && destructive.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {destructive.map((action, i) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className="text-tiq-danger focus:text-tiq-danger"
            >
              {Icon ? <Icon className="me-2 h-4 w-4" /> : null}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
