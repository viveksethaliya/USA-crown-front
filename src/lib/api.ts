const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';

export function apiUrl(path: string) {
  if (!path.startsWith('/api/')) throw new Error(`Expected /api path: ${path}`);
  return typeof window === 'undefined' ? `${BACKEND_URL}${path}` : path;
}

export async function storeFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('storeToken') : null;
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
