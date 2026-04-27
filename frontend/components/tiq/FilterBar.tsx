'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  onStatusChange?: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
  pageSize?: number;
  onPageSizeChange?: (v: number) => void;
  pageSizeOptions?: number[];
  right?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  statusValue,
  onStatusChange,
  statusOptions,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  right,
  className,
}: FilterBarProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
        <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-tiq-muted pointer-events-none" />
        <Input
          className="ps-9"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {statusOptions && onStatusChange && (
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filter.byStatus')} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {onPageSizeChange && (
        <Select
          value={String(pageSize ?? pageSizeOptions[0])}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {right}
    </div>
  );
}
