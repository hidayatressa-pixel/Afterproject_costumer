const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const isRemoteBackendConfigured = Boolean(API_BASE_URL);

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error('API request failed: ' + response.status);
  if (response.status === 204) return undefined as T;
  return response.json();
}
