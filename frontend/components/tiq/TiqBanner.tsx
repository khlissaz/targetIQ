import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type TiqBannerVariant = 'info' | 'success' | 'warning' | 'warn' | 'danger' | 'error';
type TiqBannerVariantNormalized = 'info' | 'success' | 'warning' | 'danger';

const variantStyles: Record<TiqBannerVariantNormalized, string> = {
  info: 'border-tiq-info/30 bg-tiq-info/10 text-tiq-text',
  success: 'border-tiq-success/30 bg-tiq-success/10 text-tiq-text',
  warning: 'border-tiq-warning/30 bg-tiq-warning/10 text-tiq-text',
  danger: 'border-tiq-danger/30 bg-tiq-danger/10 text-tiq-text',
};

const variantIcons: Record<TiqBannerVariantNormalized, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const variantIconColors: Record<TiqBannerVariantNormalized, string> = {
  info: 'text-tiq-info',
  success: 'text-tiq-success',
  warning: 'text-tiq-warning',
  danger: 'text-tiq-danger',
};

function normalizeVariant(variant: TiqBannerVariant): TiqBannerVariantNormalized {
  if (variant === 'warn') return 'warning';
  if (variant === 'error') return 'danger';
  return variant;
}

export type TiqBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: TiqBannerVariant;
  title?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
};

export function TiqBanner({
  className,
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  ...props
}: TiqBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const v = normalizeVariant(variant);
  const Icon = variantIcons[v];

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="status"
      className={cn(
        'rounded-tiq border px-4 py-3 text-sm',
        'flex items-start gap-3 relative',
        variantStyles[v],
        className
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', variantIconColors[v])} />
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold text-tiq-navy mb-1">{title}</div>}
        <div className="text-tiq-text/90">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 rounded hover:bg-black/5 p-1 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-tiq-muted" />
        </button>
      )}
    </div>
  );
}
