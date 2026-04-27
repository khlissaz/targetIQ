'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';

import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ResetPasswordResponse = {
  success: boolean;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);

  const initialToken = useMemo(() => searchParams?.get('token') ?? '', [searchParams]);

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiFetch<ResetPasswordResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });

      toast.success(t('passwordResetSuccess'));
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiq-bg to-tiq-surface flex flex-col" dir={dir}>
      <header className="p-4 flex items-center justify-between">
        <Link href="/landing">
          <Logo showTagline={false} />
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-tiq-navy">{t('resetPasswordTitle')}</CardTitle>
            <CardDescription>{t('resetPasswordDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">{t('resetToken')}</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder={t('resetTokenPlaceholder')}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full bg-tiq-primary hover:opacity-95 active:opacity-90" disabled={loading}>
                {loading ? t('loading') : t('resetPasswordButton')}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-tiq-primary hover:underline font-semibold">
                  {t('backToLogin')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
