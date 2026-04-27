'use client';

import React, { useEffect, useState } from 'react';
import { TiqSelect } from '@/components/tiq/TiqSelect';
import { BillingFeaturesEditor } from './BillingFeaturesEditor';
import { adminBillingListPlans, type AdminBillingPlanDto } from '@/lib/api';
import { toast } from 'sonner';

export function BillingFeaturesTab() {
  const [plans, setPlans] = useState<AdminBillingPlanDto[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminBillingListPlans()
      .then((data) => {
        setPlans(data ?? []);
        if (data?.length) setSelectedCode(data[0].code);
      })
      .catch((e: any) => toast.error(e?.message ?? 'Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading plans…</p>;

  const planOptions = plans.map((p) => ({
    value: p.code,
    label: `${p.nameI18n?.en ?? p.code} (${p.code})${p.isActive ? '' : ' – inactive'}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xs">
        <TiqSelect
          label="Select Plan"
          value={selectedCode}
          onChange={(e) => setSelectedCode((e as React.ChangeEvent<HTMLSelectElement>).target.value)}
        >
          {planOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </TiqSelect>
      </div>

      {selectedCode ? (
        <BillingFeaturesEditor planCode={selectedCode} />
      ) : (
        <p className="text-sm text-gray-500">Select a plan to manage its features.</p>
      )}
    </div>
  );
}
