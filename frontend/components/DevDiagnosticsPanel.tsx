'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRuntimeStatus } from '@/lib/runtimeStatus';

export function DevDiagnosticsPanel() {
  const isDev = process.env.NODE_ENV !== 'production';
  const status = useRuntimeStatus();

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Diagnostics / Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="min-w-[110px]">Action</div>
            <Badge variant="secondary">{status.lastActionState}</Badge>
            {status.block.kind !== 'none' && <Badge variant="destructive">blocked: {status.block.kind}</Badge>}
          </div>

          <div>
            <div className="font-medium mb-1">Last /credits payload</div>
            <pre className="max-h-40 overflow-auto rounded border p-2">
              {status.lastCredits ? JSON.stringify(status.lastCredits, null, 2) : '—'}
            </pre>
          </div>

          <div>
            <div className="font-medium mb-1">Last API error</div>
            <pre className="max-h-28 overflow-auto rounded border p-2">
              {status.lastApiError ? JSON.stringify(status.lastApiError, null, 2) : '—'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
