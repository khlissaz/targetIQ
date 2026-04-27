'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

type ApiStatusEventDetail = {
  kind: 'login' | 'upgrade' | 'dailyCap' | 'serverError';
  message?: string;
  resetAt?: string | null;
};

export function ApiStatusListener() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useEffect(() => {
    const handler = (evt: Event) => {
      const event = evt as CustomEvent<ApiStatusEventDetail>;
      const detail = event.detail;
      if (!detail?.kind) return;

      if (detail.kind === 'login') {
        toast.error(t('status.loginRequired'));
        router.push('/auth/login');
        return;
      }

      if (detail.kind === 'upgrade') {
        toast.error(t('status.upgradeRequired'));
        return;
      }

      if (detail.kind === 'dailyCap') {
        const reset = detail.resetAt ? ` (${detail.resetAt})` : '';
        toast.error(t('status.dailyCapReached') + reset);
        return;
      }

      if (detail.kind === 'serverError') {
        toast.error(t('status.retryableServerError'));
      }
    };

    window.addEventListener('targetiq:api-status', handler as EventListener);
    return () => window.removeEventListener('targetiq:api-status', handler as EventListener);
  }, [router, t]);

  return null;
}
