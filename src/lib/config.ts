const getBaseUrl = () => {
  let base = process.env.NEXT_PUBLIC_API_URL;
  
  // If on client and base is localhost, dynamically rewrite to actual hostname for LAN testing
  if (typeof window !== 'undefined' && base && base.includes('localhost')) {
    if (window.location.hostname !== 'localhost') {
      base = base.replace('localhost', window.location.hostname);
    }
  }

  if (base) return base;
  
  if (typeof window !== 'undefined') return `http://${window.location.hostname}:5000`;
  return 'http://localhost:5000';
};

export const API_URL = getBaseUrl();
export const ADMIN_API = `${API_URL}/api/admin`;
