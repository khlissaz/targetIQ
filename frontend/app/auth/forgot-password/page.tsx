'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

type RequestResetResponse = {
  success: boolean;
  message?: string;
  token?: string;
  expiresAt?: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch<RequestResetResponse>('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      toast.success(res.message || t('resetPasswordRequestSent'));

      // In dev, backend returns token. Make the flow usable without email delivery.
      if (res.token) {
        router.push(`/auth/reset-password?token=${encodeURIComponent(res.token)}`);
      }
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
            <CardTitle className="text-3xl font-bold text-tiq-navy">{t('forgotPasswordTitle')}</CardTitle>
            <CardDescription>{t('forgotPasswordDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full bg-tiq-primary hover:opacity-95 active:opacity-90" disabled={loading}>
                {loading ? t('loading') : t('sendResetInstructions')}
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
