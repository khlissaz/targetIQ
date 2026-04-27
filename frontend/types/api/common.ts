export type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };
export type ApiErrorResponse = { status: number; code: string; message: string; path?: string; details?: unknown; at: string };
