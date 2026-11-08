/**
 * Type-safe API client for the StockIQ backend.
 * Wraps fetch() with consistent error handling and response unwrapping.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { page: number; limit: number; total: number };
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: `Invalid JSON response (${res.status})`,
  }));

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  }

  return json.data as T;
}

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(url, { credentials: "include" });
    return handleResponse<T>(res);
  },
  post: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    return handleResponse<T>(res);
  },
  put: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    return handleResponse<T>(res);
  },
  delete: async <T = void>(url: string): Promise<T> => {
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.status === 204) return undefined as T;
    return handleResponse<T>(res);
  },
};
