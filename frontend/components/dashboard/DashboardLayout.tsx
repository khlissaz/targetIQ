'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { LogoSmall } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EnrichmentProgress from '@/components/dashboard/leads/EnrichmentProgress';
import { CreditStrip } from '@/components/tiq/CreditStrip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Send,
  Target,
  Megaphone,
  ListOrdered,
  FileText,
  BarChart2,
  UserCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Chrome,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHROME_STORE_URL } from '@/lib/constants';

const SIDEBAR_COLLAPSED_KEY = 'tiq-sidebar-collapsed';
const SIDEBAR_WIDTH_KEY = 'tiq-sidebar-width';
const SIDEBAR_MIN_W = 220;
const SIDEBAR_MAX_W = 360;
const SIDEBAR_DEFAULT_W = 280;
const SIDEBAR_COLLAPSED_W = 64;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { user, me, capabilities, signOut, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);

  // Collapsible + resizable sidebar state
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const w = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? '', 10);
      return isNaN(w) ? SIDEBAR_DEFAULT_W : Math.min(SIDEBAR_MAX_W, Math.max(SIDEBAR_MIN_W, w));
    } catch { return SIDEBAR_DEFAULT_W; }
  });
  const isResizingRef = useRef(false);

  // Track viewport width: sidebar indent must only be applied on desktop (md+)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768
  );

  // Auth guard — redirect unauthenticated users to landing
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/landing'); }
  }, [authLoading, user, router]);

  // Sync isDesktop on viewport resize
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;
    const isRtl = dir === 'rtl';

    const onMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = isRtl ? startX - ev.clientX : ev.clientX - startX;
      const newW = Math.min(SIDEBAR_MAX_W, Math.max(SIDEBAR_MIN_W, startW + delta));
      setSidebarWidth(newW);
      try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(newW))); } catch {}
    };

    const onUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth, dir]);

  const businessId =
    typeof params?.businessId === 'string'
      ? params.businessId
      : Array.isArray(params?.businessId)
        ? params.businessId[0]
        : null;

  // Persist active business id — runs client-side in effect (not during render)
  useEffect(() => {
    if (!businessId) return;
    const membershipIds = Array.isArray((me as any)?.memberships)
      ? Array.from(
          new Set(
            (me as any).memberships
              .map((m: any) => String(m?.tenantId ?? m?.businessId ?? m?.tenant?.id ?? '').trim())
              .filter(Boolean),
          ),
        )
      : [];
    if (membershipIds.includes(String(businessId).trim())) {
      try {
        localStorage.setItem('active-business-id', businessId);
      } catch {
        // ignore
      }
    }
  }, [businessId, me]);

  // Auto-open Outreach group when on an outreach sub-path
  useEffect(() => {
    if (pathname?.includes('/outreach')) setOutreachOpen(true);
  }, [pathname]);

  const base = businessId ? `/dashboard/${businessId}` : '/dashboard';

  const outreachItems = [
    { name: t('outreach.prospects') || 'Prospects', href: `${base}/outreach/prospects`, icon: Target },
    { name: t('outreach.lists') || 'Outreach Lists', href: `${base}/outreach/lists`, icon: ListOrdered },
    { name: t('outreach.campaigns') || 'Campaigns', href: `${base}/campaigns`, icon: Megaphone },
    { name: t('outreach.sequences') || 'Sequences', href: `${base}/sequences`, icon: Send },
    { name: t('outreach.templates') || 'Templates', href: `${base}/templates`, icon: FileText },
  ];

  const topNavItems = [
    { name: t('dashboard'), href: base, icon: LayoutDashboard },
    { name: t('leads'), href: `${base}/leads`, icon: Users },
  ];

  const bottomNavItems = [
    { name: t('analytics'), href: `${base}/analytics`, icon: BarChart2 },
    { name: t('team') || 'Team', href: `${base}/team`, icon: UserCheck },
    ...(capabilities?.includes('VIEW_BILLING')
      ? [{ name: t('billing'), href: `${base}/billing`, icon: CreditCard }]
      : []),
    { name: t('settings'), href: `${base}/settings`, icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/landing');
  };

  const displayEmail = me?.user?.email ?? user?.email ?? '';
  const displayName =
    (me as any)?.user?.fullName ??
    (me as any)?.user?.full_name ??
    (user as any)?.fullName ??
    (user as any)?.full_name ??
    '';
  const initials = (displayName || displayEmail || 'U').trim().charAt(0).toUpperCase();

  const NavItem = ({ name, href, icon: Icon, disabled, title: tooltip }: { name: string; href: string; icon: React.ElementType; disabled?: boolean; title?: string }) => {
    const isActive = pathname === href || (href !== base && pathname?.startsWith(href));
    return (
      <Link href={href} title={collapsed ? (tooltip ?? name) : undefined}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full gap-3',
            collapsed ? 'justify-center px-0' : 'justify-start',
            isActive ? 'bg-tiq-primary/10 text-tiq-primary' : '',
          )}
          disabled={disabled}
          title={!collapsed ? tooltip : undefined}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && name}
        </Button>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-tiq-bg" dir={dir}>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 z-40 h-screen transition-transform md:translate-x-0',
          'bg-tiq-surface border-tiq-border border-e',
          'start-0',
          // Use explicit dir-based class: avoids rtl: variant specificity conflict with md:translate-x-0
          sidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'),
        )}
        style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : sidebarWidth }}
      >
        <div className="flex h-full flex-col">
          {/* Logo + collapse toggle */}
          <div className="flex items-center border-b border-tiq-border p-4">
            {!collapsed && (
              <Link href="/landing" className="flex-1 overflow-hidden">
                <LogoSmall />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 shrink-0 md:flex"
              onClick={toggleCollapse}
              title={collapsed ? t('nav.expandSidebar') || 'Expand' : t('nav.collapseSidebar') || 'Collapse'}
            >
              {/* Mirror icon for RTL (sidebar on right) instead of swapping */}
              {collapsed
                ? <PanelLeftOpen className={cn('h-4 w-4', dir === 'rtl' && 'scale-x-[-1]')} />
                : <PanelLeftClose className={cn('h-4 w-4', dir === 'rtl' && 'scale-x-[-1]')} />
              }
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {topNavItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}

            {/* Outreach collapsible group */}
            <div>
              {collapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-full justify-center',
                    pathname?.includes('/outreach') ? 'text-tiq-primary' : '',
                  )}
                  title={t('outreach.title') || 'Outreach'}
                  disabled
                >
                  <Send className="h-5 w-5 shrink-0" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3',
                      pathname?.includes('/outreach') ? 'text-tiq-primary' : '',
                    )}
                    onClick={() => setOutreachOpen((v) => !v)}
                    disabled
                  >
                    <Send className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-start">{t('outreach.title') || 'Outreach'}</span>
                    {outreachOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : dir === 'rtl' ? (
                      <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  {outreachOpen && (
                    <div className="ms-4 mt-1 space-y-1 border-s border-tiq-border ps-3">
                      {outreachItems.map((item) => (
                        <NavItem key={item.href} {...item} disabled title="soon" />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {bottomNavItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>

          {/* User menu */}
          <div className="border-t border-tiq-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn('w-full gap-3', collapsed ? 'justify-center px-0' : 'justify-start')}
                  title={collapsed ? (displayName || displayEmail || t('profile')) : undefined}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-tiq-primary text-tiq-surface">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 overflow-hidden text-start">
                      <p className="truncate text-sm font-medium">{displayName || t('profile')}</p>
                      <p className="truncate text-xs text-tiq-muted">{displayEmail}</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('profile')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`${base}/profile`)}>
                  <Users className="me-2 h-4 w-4" />
                  {t('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`${base}/settings`)}>
                  <Settings className="me-2 h-4 w-4" />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-tiq-danger">
                  <LogOut className="me-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Resize handle — desktop only, not shown when collapsed */}
        {!collapsed && (
          <div
            onMouseDown={startResize}
            className={cn(
              'absolute top-0 hidden h-full w-1.5 cursor-col-resize md:block',
              'hover:bg-tiq-primary/20 active:bg-tiq-primary/40 transition-colors',
              // end-0 = inner edge for both LTR (right side) and RTL (left side of the aside)
              'end-0',
            )}
            aria-hidden
          />
        )}
      </aside>

      {/* Main content */}
      <div
        className="transition-[margin] duration-200"
        style={isDesktop ? { marginInlineStart: collapsed ? SIDEBAR_COLLAPSED_W : sidebarWidth } : undefined}
      >
        <header className="sticky top-0 z-30 border-b border-tiq-border bg-tiq-surface">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-tiq-primary/20 bg-tiq-primary/10 px-3 py-1.5 text-sm font-semibold text-tiq-primary transition-all hover:bg-tiq-primary hover:text-white md:flex"
            >
              <Chrome className="h-4 w-4 shrink-0" />
              {t('getExtension') || 'Get Extension'}
            </a>
            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <CreditStrip />
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-tiq-navy/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <EnrichmentProgress />
    </div>
  );
};

