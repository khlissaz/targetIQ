// Shared constants and helpers for admin billing UI

export const BILLING_MODEL_OPTIONS = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'free', label: 'Free' },
  { value: 'enterprise-custom', label: 'Enterprise Custom' },
];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'SAR', label: 'SAR' },
];

export const INTERVAL_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One-Time' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Archived' },
];

export const FEATURED_OPTIONS = [
  { value: 'yes', label: 'Featured' },
  { value: 'no', label: 'Not Featured' },
];

/** A Stripe price ID is real if it starts with price_ and has no further underscores */
export function isRealStripeId(id: string | null | undefined): boolean {
  if (!id || !id.startsWith('price_')) return false;
  return !id.slice('price_'.length).includes('_');
}

/** Format a numeric amount for display */
export function fmtAmount(raw: string | number | null | undefined, currency?: string): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  const n = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (isNaN(n)) return String(raw);
  const formatted = n.toFixed(2);
  return currency ? `${formatted} ${currency}` : formatted;
}

/** Normalise a search string for comparison */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  if (!query) return true;
  return (text ?? '').toLowerCase().includes(query.toLowerCase());
}
