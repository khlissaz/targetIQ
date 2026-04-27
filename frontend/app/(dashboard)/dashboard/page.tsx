'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TiqCard } from '@/components/tiq/TiqCard';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { loading, user, activeBusinessId, provisionWorkspace, signOut } = useAuth();
  const [provisioning, setProvisioning] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const role = typeof (user as any)?.role === 'string' ? String((user as any).role).trim().toUpperCase() : '';
    if (role === 'ADMIN') {
      router.replace('/admin');
      return;
    }

    const stored = typeof window !== 'undefined' ? localStorage.getItem('active-business-id') : null;
    const businessId = activeBusinessId ?? stored;
    if (businessId) {
      router.replace(`/dashboard/${businessId}`);
      return;
    }
  }, [activeBusinessId, loading, router, user]);

  if (loading) return null;
  if (!user) return null;

  const stored = typeof window !== 'undefined' ? localStorage.getItem('active-business-id') : null;
  const businessId = activeBusinessId ?? stored;
  if (businessId) return null;

  const onCreateWorkspace = async () => {
    setProvisioning(true);
    try {
      const nextId = await provisionWorkspace();
      if (nextId) {
        toast.success(t('auth.workspaceProvisioned'));
        router.replace(`/dashboard/${nextId}`);
        return;
      }
      toast.error(t('error'));
    } catch (e: any) {
      toast.error(e?.message || t('error'));
    } finally {
      setProvisioning(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace('/auth/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiq-bg to-tiq-surface flex items-center justify-center p-4" dir={dir}>
      <TiqCard className="w-full max-w-md" title={t('auth.workspaceRequiredTitle')} subtitle={t('auth.workspaceRequiredBody')}>
          
          <div className="space-y-2">
            <Button className="w-full bg-tiq-primary hover:opacity-95 active:opacity-90" onClick={onCreateWorkspace} disabled={provisioning || loggingOut}>
              {provisioning ? t('loading') : t('auth.createWorkspace')}
            </Button>
            <Button className="w-full" variant="outline" onClick={onLogout} disabled={provisioning || loggingOut}>
              {loggingOut ? t('loading') : t('logout')}
            </Button>
          </div>
      </TiqCard>
    </div>
  );
}
