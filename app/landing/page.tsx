'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chrome,
  LayoutDashboard,
  TrendingUp,
  Globe,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Users,
} from 'lucide-react';

export default function LandingPage() {
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir={dir}>
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo showTagline={false} className="cursor-pointer" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-600 hover:text-[#FF6B00] transition">
              {t('features')}
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-[#FF6B00] transition">
              {t('about')}
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-[#FF6B00] transition">
              {t('contact')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost">{t('login')}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#FF6B00] hover:bg-[#ff7d1a]">{t('signup')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <Logo className="mx-auto mb-8" />
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#1A2B3C]">
          {t('landingHero')}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {t('landingHeroDesc')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-[#FF6B00] hover:bg-[#ff7d1a] text-lg px-8">
              {t('getStarted')} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              {t('learnMore')}
            </Button>
          </Link>
        </div>

        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
          <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-[#FF6B00]/20">
            <div className="bg-gradient-to-br from-[#1A2B3C] to-[#2a3b4c] p-8 aspect-video flex items-center justify-center">
              <div className="text-white text-center">
                <LayoutDashboard className="w-24 h-24 mx-auto mb-4 text-[#FF6B00]" />
                <h3 className="text-2xl font-bold mb-2">{t('dashboard')}</h3>
                <p className="text-gray-300">Powerful lead management at your fingertips</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A2B3C] mb-4">{t('features')}</h2>
            <p className="text-xl text-gray-600">Everything you need to supercharge your lead generation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-t-4 border-t-[#FF6B00] hover:shadow-lg transition">
              <CardHeader>
                <Chrome className="w-12 h-12 text-[#FF6B00] mb-4" />
                <CardTitle>{t('feature1Title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('feature1Desc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-[#FF6B00] hover:shadow-lg transition">
              <CardHeader>
                <LayoutDashboard className="w-12 h-12 text-[#FF6B00] mb-4" />
                <CardTitle>{t('feature2Title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('feature2Desc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-[#FF6B00] hover:shadow-lg transition">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-[#FF6B00] mb-4" />
                <CardTitle>{t('feature3Title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('feature3Desc')}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-[#FF6B00] hover:shadow-lg transition">
              <CardHeader>
                <Globe className="w-12 h-12 text-[#FF6B00] mb-4" />
                <CardTitle>{t('feature4Title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t('feature4Desc')}</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-[#1A2B3C] to-[#2a3b4c] text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why TargetIQ?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-gray-300">Capture leads in seconds with our optimized chrome extension</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                    <p className="text-gray-300">Your data is encrypted and protected with enterprise-grade security</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Zap className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Intelligent Automation</h3>
                    <p className="text-gray-300">Smart workflows that adapt to your sales process</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                    <p className="text-gray-300">Work together seamlessly with your sales team</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <div className="text-center">
                <Users className="w-16 h-16 text-[#FF6B00] mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">Join 10,000+ Users</h3>
                <p className="text-gray-300 mb-8">
                  Growing their business with TargetIQ every day
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-[#FF6B00] hover:bg-[#ff7d1a] w-full">
                    {t('getStarted')} <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo showTagline={true} className="mb-4" />
              <p className="text-sm">Transform your lead generation with intelligent automation.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-[#FF6B00]">Features</Link></li>
                <li><Link href="#" className="hover:text-[#FF6B00]">Pricing</Link></li>
                <li><Link href="#" className="hover:text-[#FF6B00]">Chrome Extension</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-[#FF6B00]">About</Link></li>
                <li><Link href="#" className="hover:text-[#FF6B00]">Contact</Link></li>
                <li><Link href="#" className="hover:text-[#FF6B00]">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-[#FF6B00]">Help Center</Link></li>
                <li><Link href="#" className="hover:text-[#FF6B00]">Documentation</Link></li>
                <li><Link href="#" className="hover:text-[#FF6B00]">API</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 TargetIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
