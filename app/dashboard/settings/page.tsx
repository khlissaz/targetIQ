'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, Language } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
type UserSettings = {
  user_id: string;
  language: string;
  notifications_enabled: boolean;
  timezone: string;
};
import { toast } from 'sonner';

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
        const newSettings = await apiFetch<UserSettings>(
          '/user_settings',
          {
            method: 'POST',
            body: JSON.stringify({
              user_id: user!.id,
              language: 'en',
              notifications_enabled: true,
              timezone: 'UTC',
            }),
          }
        );
        if (newSettings) {
          setSettings(newSettings);
        }
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiFetch<UserSettings>(
        `/user_settings/${user!.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        }
      );
      setGlobalLanguage(formData.language);
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2B3C]">{t('settings')}</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('languagePreference')}</CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: Language) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notifications')}</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>{t('enableNotifications')}</Label>
                <p className="text-sm text-gray-500">
                  Receive email notifications for new leads and updates
                </p>
              </div>
              <Switch
                checked={formData.notifications_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifications_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('timezone')}</CardTitle>
            <CardDescription>Set your timezone for accurate timestamps</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                <SelectItem value="Asia/Riyadh">Riyadh</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#FF6B00] hover:bg-[#ff7d1a]">
            {t('save')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
