'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

// ─── LoadingState ─────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  rows?: number;
  spinner?: boolean;
  className?: string;
}

export function LoadingState({ rows = 4, spinner = false, className }: LoadingStateProps) {
  if (spinner) {
    return (
      <div className={cn('flex items-center justify-center py-16', className)}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-tiq-border border-t-tiq-primary" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-tiq bg-tiq-border/50 h-12"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-tiqLg border border-tiq-danger/20 bg-tiq-danger/5 px-6 py-8 text-center',
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-tiq-danger" />
      {message ? (
        <p className="text-sm text-tiq-danger">{message}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  );
}
