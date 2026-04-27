import { LeadI } from '@/lib/types';

export function normalizeFullName(obj: Record<string, any>): string {
  return (
    obj?.fullName ||
    obj?.full_name ||
    obj?.name ||
    obj?.profile?.name ||
    obj?.profile?.fullName ||
    obj?.profile?.full_name ||
    ''
  );
}

export function normalizeBusinessId(obj: Record<string, any>): string | null {
  const raw =
    obj?.businessId ||
    obj?.tenantId ||
    obj?.tenant?.id ||
    null;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export function normalizeLead(raw: Record<string, any>): LeadI {
  const profile = raw?.profile ?? {};

  const normalizedProfile = {
    ...profile,
    // canonical: profile.name
    name: profile.name || profile.fullName || profile.full_name || raw?.fullName || raw?.full_name || '',
    // canonical: profile.job
    job:
      profile.job ||
      profile.jobTitle ||
      profile.position ||
      profile.title ||
      profile.caption ||
      '',
    // canonical: profile.profileLink
    profileLink: profile.profileLink || profile.linkedinUrl || '',
    // canonical: profile.picture
    picture: profile.picture || profile.profilePicture || '',
    // canonical: profile.info
    info: profile.info || profile.about || profile.notes || '',
  };

  return {
    ...raw,
    profile: normalizedProfile,
  } as LeadI;
}

export function normalizeLeads(raws: Record<string, any>[]): LeadI[] {
  return Array.isArray(raws) ? raws.map(normalizeLead) : [];
}
