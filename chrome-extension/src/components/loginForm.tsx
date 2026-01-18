
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface LoginFormProps {
  login: (email: string, password: string) => Promise<any>;
}

export default function LoginForm({ login }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || t('login.error'));
      setLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-[400px] sm:max-w-[420px] md:max-w-[480px] mx-auto">
        {/* TargetIQ Brand Header for test and branding */}
        <div className="flex flex-col items-center justify-center mt-6 mb-2">
          <span className="flex items-center gap-2">
            {/* SVG logo reused from TargetIQTabs */}
            <svg width="28" height="22" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle mr-1">
              <rect x="0" y="7" width="10" height="4" rx="2" fill="#FF6B00"/>
              <rect x="12" y="9" width="8" height="2" rx="1" fill="#FF6B00"/>
              <rect x="22" y="11" width="6" height="2" rx="1" fill="#FF6B00"/>
            </svg>
            <span className="text-2xl font-extrabold text-targetiq-navy" style={{letterSpacing:1}}>TargetIQ</span>
          </span>
        </div>
       
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-2 sm:px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="mb-2">{t('login.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="mb-2">{t('login.passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="targetiq-error">{error}</div>}
          <Button
            type="submit"
            disabled={loading}
            variant={loading ? 'outline' : 'default'}
            size="lg"
            className="w-full"
            aria-label={loading ? t('login.loading') : t('login.button')}
          >
            {loading ? t('login.loading') : t('login.button')}
          </Button>
        </form>
        <div className="mt-6 text-center text-[14px]">
          <span className="text-[#6B7280]">{t('login.noAccount')}</span>
          <a href="https://target-iq-delta.vercel.app/auth/signup" className="text-[#FF6B00] underline font-semibold ml-1">{t('login.signupLink')}</a>
        </div>
      </Card>
  );
}
