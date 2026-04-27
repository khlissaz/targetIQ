import * as React from 'react';
import { cn } from '@/lib/utils';

type TiqCardProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  noPadding?: boolean;
  hover?: boolean;
};

export function TiqCard({
  className,
  title,
  subtitle,
  actions,
  children,
  noPadding = false,
  hover = false,
  ...props
}: TiqCardProps) {
  return (
    <section
      className={cn(
        'rounded-tiqLg border border-tiq-border bg-tiq-surface shadow-md',
        'text-tiq-text transition-all duration-200',
        hover && 'hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-tiq-border/60 px-5 py-4">
          <div className="min-w-0">
            {title && <div className="text-base font-semibold leading-5 text-tiq-navy">{title}</div>}
            {subtitle && <div className="mt-1 text-sm text-tiq-muted leading-5">{subtitle}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!noPadding && 'px-5 py-4')}>{children}</div>
    </section>
  );
}
