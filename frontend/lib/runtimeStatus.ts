'use client';

import { useSyncExternalStore } from 'react';

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

export type ApiErrorInfo = {
  status: number;
  code?: string;
  message?: string;
  path?: string;
  at: string; // ISO
};

export type CreditsBucket = {
  monthlyUsed: number;
  monthlyCap: number | null;
  monthlyRemaining: number | null;
  dailyUsed: number;
  dailyCap: number;
  dailyRemaining: number;
  resetAt: string | null;
};

export type CreditsInfo = {
  capture: CreditsBucket;
  enrich: CreditsBucket;
  addonBalance?: number;
};

export type ApiBlockKind = 'none' | 'login' | 'upgrade' | 'dailyCap' | 'workspaceRequired';

export type ApiBlock = {
  kind: ApiBlockKind;
  resetAt?: string | null;
};

export type RuntimeStatus = {
  lastActionState: ActionState;
  lastCredits: CreditsInfo | null;
  lastApiError: ApiErrorInfo | null;
  block: ApiBlock;
};

let status: RuntimeStatus = {
  lastActionState: 'idle',
  lastCredits: null,
  lastApiError: null,
  block: { kind: 'none' },
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRuntimeStatus(): RuntimeStatus {
  return status;
}

export function useRuntimeStatus(): RuntimeStatus {
  return useSyncExternalStore(subscribe, getRuntimeStatus, getRuntimeStatus);
}

export function setLastActionState(next: ActionState) {
  if (status.lastActionState === next) return;
  status = { ...status, lastActionState: next };
  emit();
}

export function setLastApiError(next: Omit<ApiErrorInfo, 'at'> & { at?: string }) {
  status = {
    ...status,
    lastApiError: {
      ...next,
      at: next.at ?? new Date().toISOString(),
    },
  };
  emit();
}

export function setLastCredits(next: CreditsInfo) {
  status = { ...status, lastCredits: next };

  // Opportunistically clear blocks if credits indicate recovery.
  const hasMonthlyRemaining =
    (next.capture.monthlyRemaining != null && next.capture.monthlyRemaining > 0) ||
    (next.enrich.monthlyRemaining != null && next.enrich.monthlyRemaining > 0);
  if (status.block.kind === 'upgrade' && hasMonthlyRemaining) {
    status = { ...status, block: { kind: 'none' } };
  }
  if (status.block.kind === 'dailyCap') {
    const resetAt = next.capture?.resetAt ?? next.enrich?.resetAt ?? null;
    const resetMs = resetAt ? Date.parse(resetAt) : NaN;
    if (resetAt && Number.isFinite(resetMs) && Date.now() >= resetMs) {
      status = { ...status, block: { kind: 'none' } };
    }
  }

  emit();
}

export function setApiBlock(block: ApiBlock) {
  status = { ...status, block };
  emit();
}

export function clearApiBlock() {
  if (status.block.kind === 'none') return;
  status = { ...status, block: { kind: 'none' } };
  emit();
}
