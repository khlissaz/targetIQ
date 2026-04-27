import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function parseLeadIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const leadIds = parseLeadIds(req.nextUrl.searchParams.get('leadIds'));

  if (leadIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const authorization = req.headers.get('authorization') ?? '';
  const businessId = req.headers.get('x-business-id') ?? '';
  const params = new URLSearchParams({ leadIds: leadIds.join(',') });

  const upstream = await fetch(`${API_URL}/lead-enrichment-tasks/getStatusOfProcessingTasks?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(businessId ? { 'X-Business-Id': businessId } : {}),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const text = await upstream.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Upstream enrichment status failed', details: data },
      { status: upstream.status || 500 },
    );
  }

  const items: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return NextResponse.json({ items });
}
