const BACKEND_URL = 'https://api.utilixo.online';

const getBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (base) {
    // If on client and base is localhost, dynamically rewrite to actual hostname for LAN testing
    if (typeof window !== 'undefined' && base.includes('localhost')) {
      if (window.location.hostname !== 'localhost') {
        return base.replace('localhost', window.location.hostname);
      }
    }
    return base;
  }

  // Server-side (SSR): must use absolute URL — relative paths are not valid in Node.js fetch()
  if (typeof window === 'undefined') return BACKEND_URL;

  // Client-side: use relative path so Next.js rewrites proxy it (avoids CORS)
  return '';
};

export const API_URL = getBaseUrl();
export const ADMIN_API = `${API_URL}/api/admin`;


