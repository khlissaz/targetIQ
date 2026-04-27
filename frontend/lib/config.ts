const LOCAL_DEV_API_URL = 'http://localhost:5000/api';

function isLikelyLocalhost(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function getApiBaseUrl(): string {
  const configured = String(process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (configured) return configured;

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error('Missing NEXT_PUBLIC_API_URL in production.');
  }

  return LOCAL_DEV_API_URL;
}

export function isUnsafeProductionApiUrl(url: string): boolean {
  return process.env.NODE_ENV === 'production' && isLikelyLocalhost(url);
}
