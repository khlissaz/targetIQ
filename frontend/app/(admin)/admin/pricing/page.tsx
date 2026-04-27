/**
 * @deprecated This page reads the legacy `pricing` table (pre-migration-1799).
 * Billing is now managed at /admin/billing — this page permanently redirects there.
 */
import { redirect } from 'next/navigation';

export default function AdminPricingPage() {
  redirect('/admin/billing');
}
