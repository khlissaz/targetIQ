'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPostAuthRedirectPath } from '@/lib/authRedirect';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
      if (token && token.trim()) {
        const path = await getPostAuthRedirectPath().catch(() => '/dashboard');
        router.replace(path);
        return;
      }
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      router.replace(`/landing${hash || ''}`);
    })();
  }, [router]);

  return null;
}
