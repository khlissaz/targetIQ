'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { TiqButton } from '@/components/tiq/TiqButton';

export function MarketingShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { user, activeBusinessId, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = user && activeBusinessId
    ? [
        { label: t('dashboard'), href: `/dashboard/${activeBusinessId}/leads` },
        { label: t('billing'), href: `/dashboard/${activeBusinessId}/billing` },
        { label: t('pricing'), href: '/pricing' },
      ]
    : user
    ? [
        { label: t('nav.onboarding') || 'Setup', href: '/onboarding' },
        { label: t('pricing'), href: '/pricing' },
      ]
    : [
        { label: t('pricing'), href: '/pricing' },
      ];

  return (
    <div className="min-h-screen bg-tiq-bg" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-tiq-border/60 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link href="/landing"><Logo showTagline={false} /></Link>

          <div className="flex items-center gap-2">
            {/* Desktop nav links */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-tiq-muted hover:bg-tiq-bg hover:text-tiq-navy transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <LanguageSwitcher />

            {/* Auth CTAs */}
            {!authLoading && (
              user ? (
                activeBusinessId ? (
                  <Link href={`/dashboard/${activeBusinessId}/leads`}>
                    <TiqButton variant="primary" size="sm">{t('dashboard')}</TiqButton>
                  </Link>
                ) : (
                  <Link href="/onboarding">
                    <TiqButton variant="primary" size="sm">{t('nav.completeSetup') || 'Complete Setup'}</TiqButton>
                  </Link>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">{t('login')}</Button>
                  </Link>
                  <Link href="/auth/signup" className="hidden sm:inline-flex">
                    <TiqButton variant="primary" size="sm">{t('signup')}</TiqButton>
                  </Link>
                </div>
              )
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="border-t border-tiq-border/60 bg-white/95 px-4 py-3 md:hidden">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-tiq-muted hover:bg-tiq-bg hover:text-tiq-navy transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!authLoading && !user && (
                <Link
                  href="/auth/signup"
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-tiq-primary hover:bg-tiq-primary/5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('signup')}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-10 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-tiq-navy lg:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-base text-tiq-muted lg:text-lg">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
