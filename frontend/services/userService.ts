import { apiFetch } from '@/lib/api';
import { safeLog, sanitizeError } from '@/lib/safeLogging';

export const logActivity = async (
  action: string,
  resource: string,
  details = '',
  metadata: Record<string, unknown> = {},
): Promise<void> => {
  try {
    await apiFetch('/user-activities', {
      method: 'POST',
      body: JSON.stringify({ action, resource, details, metadata }),
    });
  } catch (error) {
    const se = sanitizeError(error);
    safeLog('error', 'user.logActivity.failed', { action, resource, message: se.message, code: se.code });
  }
};
