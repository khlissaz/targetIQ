'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { LogoSmall } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  Tag,
  BarChart3,
  ScrollText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { user, me, activeBusinessId, capabilities, loading: authLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = capabilities.includes('ADMIN_ALL');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!isAdmin) {
      const dest = activeBusinessId ? `/dashboard/${activeBusinessId}` : '/dashboard';
      router.push(dest);
    }
  }, [activeBusinessId, authLoading, isAdmin, router, user]);

  const navigation = useMemo(
    () => [
      { name: t('admin.overview'), href: '/admin', icon: Shield },
      { name: t('admin.businesses'), href: '/admin/businesses', icon: Building2 },
      { name: t('admin.users'), href: '/admin/users', icon: Users },
      { name: t('admin.subscriptions'), href: '/admin/subscriptions', icon: CreditCard },
      { name: t('admin.pricing'), href: '/admin/pricing', icon: Tag },
      { name: t('admin.usage'), href: '/admin/usage', icon: BarChart3 },
      { name: t('admin.audit'), href: '/admin/audit', icon: ScrollText },
    ],
    [t]
  );

  const handleSignOut = async () => {
    await signOut();
    router.push('/landing');
  };

  const displayEmail = me?.user?.email ?? user?.email ?? '';
  const initials = (displayEmail || 'A').trim().charAt(0).toUpperCase();

  if (authLoading) {
    return <div className="min-h-screen bg-tiq-bg" dir={dir} />;
  }

  return (
    <div className="min-h-screen bg-tiq-bg" dir={dir}>
      <aside
        className={cn(
          'fixed top-0 z-40 h-screen w-64 transition-transform md:translate-x-0',
          'bg-tiq-surface border-tiq-border border-s',
          'start-0',
          sidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-tiq-border">
            <Link href="/admin">
              <LogoSmall />
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start gap-3', isActive ? 'bg-tiq-primary/10 text-tiq-primary' : '')}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-tiq-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-tiq-primary text-tiq-surface">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-start overflow-hidden">
                    <p className="text-sm font-medium truncate">{t('admin.title')}</p>
                    <p className="text-xs text-tiq-muted truncate">{displayEmail}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('admin.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-tiq-danger">
                  <LogOut className="me-2 w-4 h-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="md:ms-64">
        <header className="sticky top-0 z-30 border-b border-tiq-border bg-tiq-surface">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-tiq-navy/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
