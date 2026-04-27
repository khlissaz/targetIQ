'use client';

import './globals.css';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { ApiStatusListener } from '@/components/ApiStatusListener';
import { DevDiagnosticsPanel } from '@/components/DevDiagnosticsPanel';

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800'], variable: '--font-inter' });
const noto = Noto_Sans_Arabic({ subsets: ['arabic'], weight: ['300','400','600','700'], variable: '--font-ar' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=localStorage.getItem('language');if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=(l==='ar'?'rtl':'ltr');}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${inter.variable} ${noto.variable} ${inter.className}`}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
            {children}
            <ApiStatusListener />
            <DevDiagnosticsPanel />
            <Toaster position="top-right" richColors />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
