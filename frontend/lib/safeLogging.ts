export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function isPrimitive(v: unknown): boolean {
  const t = typeof v;
  return v == null || t === 'string' || t === 'number' || t === 'boolean';
}

// Deterministic, synchronous, browser-safe FNV-1a 32-bit hash returning hex string.
export function hashIdentifier(value?: string, purpose: string = ''): string | undefined {
  if (!value) return undefined;
  const input = `${purpose}:${value}`;
  // FNV-1a 32-bit
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // multiply by FNV prime (mod 2^32)
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'h_' + (h >>> 0).toString(16).padStart(8, '0');
}

// Narrow error sanitizer that avoids leaking stacks or nested objects.
export function sanitizeError(err: unknown): { message: string; code?: string } {
  try {
    if (err == null) return { message: 'Unknown error' };
    if (typeof err === 'string') return { message: err.slice(0, 200) };
    if (err instanceof Error) {
      return { message: (err.message || String(err)).slice(0, 200), code: err.name };
    }
    // For non-Error objects, avoid serializing entire object to prevent PII leaks.
    // Return a conservative fallback.
    return { message: 'Unknown error' };
  } catch {
    return { message: 'Failed to sanitize error' };
  }
}

// Minimal structured logger that only emits primitives in meta.
export function safeLog(level: LogLevel, key: string, meta?: Record<string, unknown>): void {
  const safeMeta: Record<string, unknown> = {};
  if (meta && typeof meta === 'object') {
    for (const k of Object.keys(meta)) {
      const v = (meta as any)[k];
      if (isPrimitive(v)) {
        safeMeta[k] = v;
      } else {
        // replace non-primitives with their type to avoid leaking objects
        safeMeta[k] = `[${typeof v}]`;
      }
    }
  }

  const payload = { key, meta: safeMeta };

  try {
    if (typeof console !== 'undefined') {
      const fn = (console as any)[level] ?? console.log;
      fn.call(console, payload);
    }
  } catch {
    // best-effort only; swallow logging errors
    try {
      // fallback to console.log if available
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log(payload);
      }
    } catch {
      // noop
    }
  }
}
