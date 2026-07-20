const BACKEND_URL = 'https://api.utilixo.online';

const getBaseUrl = () => {
  // Client-side: use relative path so Next.js rewrites proxy it — avoids CORS crash
  if (typeof window !== 'undefined') return '';

  // Server-side (SSR): use full URL from env or fallback constant
  return process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
};

export const API_URL = getBaseUrl();
export const ADMIN_API = `${API_URL}/api/admin`;



