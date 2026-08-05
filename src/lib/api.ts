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

/**
 * Admin fetch helper — automatically fires the 'admin:session-expired'
 * event when the backend responds with 401 or 403, which causes the
 * layout to show the "Session Expired — Sign In Again" modal.
 *
 * Usage: replace  fetch(url, { headers: { Authorization: ... } })
 *        with     adminFetch(url, { headers: { Authorization: ... } })
 */
export async function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, init);
  if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin:session-expired'));
  }
  return response;
}
