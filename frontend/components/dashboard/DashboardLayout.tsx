'use client';

import React, { useState } from 'react';
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
  LayoutDashboard,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('leads'), href: '/dashboard/leads', icon: Users },
    { name: t('analytics'), href: '/dashboard/analytics', icon: TrendingUp },
    { name: t('settings'), href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/landing');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <aside
        className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-40 w-64 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'
        } md:translate-x-0 bg-white border-${dir === 'rtl' ? 'l' : 'r'} border-gray-200`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <Link href="/dashboard">
              <LogoSmall />
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-3 ${
                      isActive ? 'bg-[#FF6B00]/10 text-[#FF6B00]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-[#FF6B00] text-white">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('profile')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className={`${dir === 'rtl' ? 'md:mr-64' : 'md:ml-64'}`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
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
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
