export type StorageKey =
  | 'access-token'
  | 'active-business-id'
  | 'language'
  | 'targetiq.dashboard.sidebar.collapsed'
  | 'targetiq.dashboard.sidebar.width';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredItem(key: StorageKey): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(key);
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

export function setStoredItem(key: StorageKey, value: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredItem(key: StorageKey): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
