'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, Language } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { safeLog, sanitizeError } from '@/lib/safeLogging';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqCard } from '@/components/tiq/TiqCard';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { toast } from 'sonner';

type UserSettings = {
  user_id: string;
  language: string;
  notifications_enabled: boolean;
  timezone: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage: setGlobalLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [formData, setFormData] = useState({
    language: 'en' as Language,
    notifications_enabled: true,
    timezone: 'UTC',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadSettings = async () => {
    try {
      const data = await apiFetch<UserSettings | null>(`/user_settings/${user!.id}`);
      if (data) {
        setSettings(data);
        setFormData({
          language: data.language as Language,
          notifications_enabled: data.notifications_enabled,
          timezone: data.timezone,
        });
      } else {
        const newSettings = await apiFetch<UserSettings>('/user_settings', {
          method: 'POST',
          body: JSON.stringify({
            user_id: user!.id,
            language: 'en',
            notifications_enabled: true,
            timezone: 'UTC',
          }),
        });
        if (newSettings) {
          setSettings(newSettings);
        }
      }
    } catch (error: any) {
      const se = sanitizeError(error);
      safeLog('error', 'settings.load.failed', { message: se.message, code: se.code });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiFetch<UserSettings>(`/user_settings/${user!.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setGlobalLanguage(formData.language);
      toast.success(t('settingsSaved'));
    } catch (error: any) {
        const se = sanitizeError(error);
        safeLog('error', 'settings.save.failed', { message: se.message, code: se.code });
        toast.error(se.message || t('error'));
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiq-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader title={t('settings')} subtitle={t('settings.subtitle')} />

        <TiqCard title={t('languagePreference')}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.languageLabel')}</Label>
              <Select
                value={formData.language}
                onValueChange={(value: Language) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
                  <SelectItem value="ar">{t('settings.languageArabic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TiqCard>

        <TiqCard title={t('notifications')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('enableNotifications')}</Label>
              <p className="text-sm text-tiq-muted">{t('settings.notificationsDescription')}</p>
            </div>
            <Switch
              checked={formData.notifications_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notifications_enabled: checked })
              }
            />
          </div>
        </TiqCard>

        <TiqCard title={t('timezone')}>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">{t('timezone.eastern')}</SelectItem>
              <SelectItem value="America/Chicago">{t('timezone.central')}</SelectItem>
              <SelectItem value="America/Denver">{t('timezone.mountain')}</SelectItem>
              <SelectItem value="America/Los_Angeles">{t('timezone.pacific')}</SelectItem>
              <SelectItem value="Europe/London">{t('timezone.london')}</SelectItem>
              <SelectItem value="Europe/Paris">{t('timezone.paris')}</SelectItem>
              <SelectItem value="Asia/Dubai">{t('timezone.dubai')}</SelectItem>
              <SelectItem value="Asia/Riyadh">{t('timezone.riyadh')}</SelectItem>
              <SelectItem value="Asia/Tokyo">{t('timezone.tokyo')}</SelectItem>
            </SelectContent>
          </Select>
        </TiqCard>

        <div className="flex justify-end">
          <TiqButton onClick={handleSave}>{t('save')}</TiqButton>
        </div>
      </PageShell>
    </DashboardLayout>
  );
}
