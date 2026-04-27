'use client';

import React, { useEffect, useState } from 'react';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqInput } from '@/components/tiq/TiqInput';
import {
  adminBillingGetConfig,
  adminBillingUpsertConfig,
  type AdminBillingConfigDto,
} from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  planCode: string;
}

const FLAG_FIELDS: { key: keyof AdminBillingConfigDto; label: string }[] = [
  { key: 'hasExtensionAccess', label: 'Extension Access' },
  { key: 'hasApiAccess', label: 'API Access' },
  { key: 'hasAnalytics', label: 'Analytics' },
  { key: 'hasPrioritySupport', label: 'Priority Support' },
  { key: 'hasOnboarding', label: 'Onboarding' },
  { key: 'hasCustomIntegrations', label: 'Custom Integrations' },
  { key: 'hasSla', label: 'SLA' },
  { key: 'hasOutreachEnabled', label: 'Outreach / LinkedIn Automation' },
];

type FormFlags = Record<string, boolean>;
type FormInts = {
  captureCredits: string;
  enrichCredits: string;
  dailyCaptureCap: string;
  dailyEnrichCap: string;
  teamLimit: string;
};

export function BillingPlanConfigForm({ planCode }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ints, setInts] = useState<FormInts>({ captureCredits: '', enrichCredits: '', dailyCaptureCap: '', dailyEnrichCap: '', teamLimit: '' });
  const [flags, setFlags] = useState<FormFlags>({
    hasExtensionAccess: true,
    hasApiAccess: false,
    hasAnalytics: false,
    hasPrioritySupport: false,
    hasOnboarding: false,
    hasCustomIntegrations: false,
    hasSla: false,
    hasOutreachEnabled: false,
  });
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    if (!planCode) return;
    setLoading(true);
    adminBillingGetConfig(planCode)
      .then((cfg) => {
        if (cfg) {
          setConfigId(cfg.id);
          setInts({
            captureCredits: cfg.captureCredits != null ? String(cfg.captureCredits) : '',
            enrichCredits: cfg.enrichCredits != null ? String(cfg.enrichCredits) : '',
            dailyCaptureCap: cfg.dailyCaptureCap != null ? String(cfg.dailyCaptureCap) : '',
            dailyEnrichCap: cfg.dailyEnrichCap != null ? String(cfg.dailyEnrichCap) : '',
            teamLimit: cfg.teamLimit != null ? String(cfg.teamLimit) : '',
          });
          const newFlags: FormFlags = {};
          for (const { key } of FLAG_FIELDS) newFlags[key] = !!(cfg as any)[key];
          setFlags(newFlags);
        }
      })
      .catch((e: any) => toast.error(e?.message ?? 'Failed to load config'))
      .finally(() => setLoading(false));
  }, [planCode]);

  function setInt(k: keyof FormInts, v: string) {
    setInts((f) => ({ ...f, [k]: v }));
  }

  function toggleFlag(k: string) {
    setFlags((f) => ({ ...f, [k]: !f[k] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const parseNullableInt = (v: string) => v.trim() === '' ? null : parseInt(v, 10);
      const body: Partial<AdminBillingConfigDto> = {
        captureCredits: parseNullableInt(ints.captureCredits),
        enrichCredits: parseNullableInt(ints.enrichCredits),
        dailyCaptureCap: parseNullableInt(ints.dailyCaptureCap),
        dailyEnrichCap: parseNullableInt(ints.dailyEnrichCap),
        teamLimit: parseNullableInt(ints.teamLimit),
        ...flags,
      };
      await adminBillingUpsertConfig(planCode, body);
      toast.success('Configuration saved');
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading configuration…</p>;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Credits &amp; Limits</h3>
        <div className="grid grid-cols-2 gap-3">
          <TiqInput label="Monthly Capture Credits" type="number" value={ints.captureCredits} onChange={(e) => setInt('captureCredits', (e as React.ChangeEvent<HTMLInputElement>).target.value)} placeholder="e.g. 500" disabled={saving} />
          <TiqInput label="Monthly Enrich Credits" type="number" value={ints.enrichCredits} onChange={(e) => setInt('enrichCredits', (e as React.ChangeEvent<HTMLInputElement>).target.value)} placeholder="e.g. 200" disabled={saving} />
          <TiqInput label="Daily Capture Cap" type="number" value={ints.dailyCaptureCap} onChange={(e) => setInt('dailyCaptureCap', (e as React.ChangeEvent<HTMLInputElement>).target.value)} placeholder="unlimited" disabled={saving} />
          <TiqInput label="Daily Enrich Cap" type="number" value={ints.dailyEnrichCap} onChange={(e) => setInt('dailyEnrichCap', (e as React.ChangeEvent<HTMLInputElement>).target.value)} placeholder="unlimited" disabled={saving} />
          <TiqInput label="Team Seat Limit" type="number" value={ints.teamLimit} onChange={(e) => setInt('teamLimit', (e as React.ChangeEvent<HTMLInputElement>).target.value)} placeholder="solo plan" disabled={saving} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Feature Flags</h3>
        <div className="flex flex-col gap-2">
          {FLAG_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!flags[key]}
                onChange={() => toggleFlag(key)}
                disabled={saving}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <TiqButton variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : configId ? 'Save Configuration' : 'Create Configuration'}
        </TiqButton>
      </div>
    </div>
  );
}
