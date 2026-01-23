'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
