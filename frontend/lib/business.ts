const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type MembershipLike = {
  tenantId?: string;
  businessId?: string;
  tenant?: { id?: string };
};

type AuthMeLike = {
  memberships?: MembershipLike[];
  activeBusinessId?: string | null;
};

const getMembershipBusinessIds = (me: AuthMeLike): string[] => {
  const memberships = Array.isArray(me?.memberships) ? me.memberships : [];
  const ids = memberships
    .map((m) => (m?.tenantId ?? m?.businessId ?? m?.tenant?.id ?? '').trim())
    .filter(Boolean);
  return Array.from(new Set(ids));
};

const pickValidBusinessId = (me: AuthMeLike): string | null => {
  const ids = getMembershipBusinessIds(me);
  const active = typeof me?.activeBusinessId === 'string' ? me.activeBusinessId.trim() : '';
  if (active && ids.includes(active)) return active;
  return ids.length > 0 ? ids[0] : null;
};

const readToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access-token');
  return token && token.trim() ? token.trim() : null;
};

const writeActiveBusinessId = (businessId: string) => {
  if (typeof window === 'undefined') return;
  const trimmed = String(businessId || '').trim();
  if (!trimmed) return;
  localStorage.setItem('active-business-id', trimmed);
};

export const clearActiveBusinessId = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('active-business-id');
};

export async function ensureActiveBusiness(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const token = readToken();
  if (!token) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const getMe = async (): Promise<AuthMeLike> => {
    const res = await fetch(`${API_URL}/auth/me`, { method: 'GET', headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error('Failed to fetch /auth/me'), { status: res.status, data });
    return data as any;
  };

  const provision = async () => {
    const res = await fetch(`${API_URL}/auth/provision-workspace`, { method: 'POST', headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw Object.assign(new Error('Failed to provision workspace'), { status: res.status, data });
    }
  };

  // 1) Fetch /auth/me
  let me = await getMe();
  let businessId = pickValidBusinessId(me);

  // 2) If memberships empty, provision then refetch
  if (!businessId) {
    await provision();
    me = await getMe();
    businessId = pickValidBusinessId(me);
  }

  if (businessId) {
    writeActiveBusinessId(businessId);
    return businessId;
  }

  return null;
}

// Backwards/forwards-compatible name used by some callers/docs.
export const ensureActiveBusinessId = ensureActiveBusiness;
