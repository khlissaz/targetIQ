'use client';

import * as React from 'react';
import { ElementType } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export interface ToolbarAction {
  label: React.ReactNode;
  icon?: ElementType;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  actions: ToolbarAction[];
  className?: string;
}

export function ActionToolbar({
  selectedCount,
  onClear,
  actions,
  className,
}: ActionToolbarProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 flex-wrap rounded-tiq border border-tiq-border bg-tiq-surface px-3 py-2',
        className,
      )}
    >
      <span className="text-sm font-medium text-tiq-navy me-1">
        {t('toolbar.selected').replace('{{count}}', String(selectedCount))}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onClear}
        title={t('toolbar.clearSelection')}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-tiq-border mx-1" />

      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className={cn(
              action.destructive
                ? 'border-tiq-danger/30 text-tiq-danger hover:bg-tiq-danger/5'
                : '',
            )}
          >
            {Icon ? <Icon className="me-1 h-4 w-4" /> : null}
            {action.loading ? '…' : action.label}
          </Button>
        );
      })}
    </div>
  );
}
