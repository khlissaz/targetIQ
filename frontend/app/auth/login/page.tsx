'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getPostAuthRedirectPath } from '@/lib/authRedirect';

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { signIn, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      const path = await getPostAuthRedirectPath().catch(() => '/onboarding');
      router.replace(path);
    })();
  }, [authLoading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success(t('auth.loginSuccess'));
      const path = await getPostAuthRedirectPath().catch(() => '/onboarding');
      router.replace(path);
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
            <CardTitle className="text-3xl font-bold text-tiq-navy">{t('login')}</CardTitle>
            <CardDescription>{t('auth.loginDescription')}</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="/auth/forgot-password" className="text-tiq-primary hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-tiq-primary hover:opacity-95 active:opacity-90"
                disabled={loading}
              >
                {loading ? t('loading') : t('login')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-tiq-muted">{t('dontHaveAccount')} </span>
              <Link href="/auth/signup" className="text-tiq-primary hover:underline font-semibold">
                {t('signup')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
