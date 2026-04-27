import { cn } from '@/lib/utils';

export const tiqBtnPrimary = cn(
  'inline-flex items-center justify-center gap-2 rounded-tiq px-4 py-2 text-sm font-semibold',
  'bg-tiq-primary text-tiq-surface shadow-tiq',
  'hover:opacity-95 active:opacity-90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none'
);

export const tiqBtnSecondary = cn(
  'inline-flex items-center justify-center gap-2 rounded-tiq px-4 py-2 text-sm font-semibold',
  'bg-tiq-secondary text-tiq-surface shadow-tiq',
  'hover:opacity-95 active:opacity-90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none'
);

export const tiqBtnDanger = cn(
  'inline-flex items-center justify-center gap-2 rounded-tiq px-4 py-2 text-sm font-semibold',
  'bg-tiq-danger text-tiq-surface shadow-tiq',
  'hover:opacity-95 active:opacity-90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none'
);

export const tiqBtnGhost = cn(
  'inline-flex items-center justify-center gap-2 rounded-tiq px-3 py-2 text-sm font-semibold',
  'bg-transparent text-tiq-navy',
  'hover:bg-tiq-primary/10',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none'
);

export const tiqIconBtn = cn(tiqBtnGhost, 'h-11 w-11 p-0');
