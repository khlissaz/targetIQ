'use client';

import { getAuthMe, type AuthMeDto } from './api';
import { ensureActiveBusiness } from './business';

function isAdminRole(me: AuthMeDto | null): boolean {
  const raw = (me as any)?.role ?? (me as any)?.user?.role;
  const role = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  return role === 'ADMIN';
}

export async function getPostAuthRedirectPath(): Promise<string> {
  if (typeof window === 'undefined') return '/landing';

  const token = localStorage.getItem('access-token');
  if (!token || !token.trim()) return '/auth/login';

  let me: AuthMeDto | null = null;
  try {
    me = await getAuthMe();
  } catch {
    // If /auth/me fails, fall back to dashboard; downstream pages will handle login.
  }

  if (me && isAdminRole(me)) {
    return '/admin';
  }

  const ensured = await ensureActiveBusiness().catch(() => null);
  const businessId = ensured ?? (me?.activeBusinessId ?? null) ?? localStorage.getItem('active-business-id');
  if (businessId && String(businessId).trim()) {
    return `/dashboard/${String(businessId).trim()}`;
  }

  return '/onboarding';
}
