'use client';

/* ──────────────────────────────────────────────────────────────────────────────
   Admin Billing Page — /admin/billing
   Each section is a fully self-contained component in:
     components/admin/billing/
────────────────────────────────────────────────────────────────────────────── */

import React, { useState } from 'react';
import { TiqShell } from '@/components/tiq/TiqShell';
import { TiqTabs } from '@/components/tiq/TiqTabs';
import { BillingPlansTable } from '@/components/admin/billing/BillingPlansTable';
import { BillingPricesTable } from '@/components/admin/billing/BillingPricesTable';
import { BillingCreditPacksTable } from '@/components/admin/billing/BillingCreditPacksTable';
import { BillingDiagnosticsPanel } from '@/components/admin/billing/BillingDiagnosticsPanel';
import { BillingFeaturesTab } from '@/components/admin/billing/BillingFeaturesTab';
import { BillingConfigTab } from '@/components/admin/billing/BillingConfigTab';

type Tab = 'plans' | 'prices' | 'packs' | 'features' | 'config' | 'diagnostics';

const TAB_ITEMS: { key: Tab; label: string }[] = [
  { key: 'plans', label: 'Plans' },
  { key: 'prices', label: 'Plan Prices' },
  { key: 'packs', label: 'Credit Packs' },
  { key: 'features', label: 'Features' },
  { key: 'config', label: 'Configuration' },
  { key: 'diagnostics', label: 'Diagnostics' },
];

export default function AdminBillingPage() {
  const [tab, setTab] = useState<Tab>('plans');

  return (
    <TiqShell
      title="Billing Admin"
      subtitle="Manage plans, prices, credit packs, features, configuration, and checkout Stripe mappings"
    >
      <TiqTabs
        value={tab}
        onValueChange={setTab}
        items={TAB_ITEMS}
        className="mb-6"
      />

      {tab === 'plans' && <BillingPlansTable />}
      {tab === 'prices' && <BillingPricesTable />}
      {tab === 'packs' && <BillingCreditPacksTable />}
      {tab === 'features' && <BillingFeaturesTab />}
      {tab === 'config' && <BillingConfigTab />}
      {tab === 'diagnostics' && <BillingDiagnosticsPanel />}
    </TiqShell>
  );
}
