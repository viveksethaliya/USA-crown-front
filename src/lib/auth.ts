import { useState, useEffect } from 'react';
import { apiUrl } from './cart';

interface UserSession {
  authenticated: boolean;
  user?: {
    id: number;
    email: string;
    role: string;
    purchasing_permission?: string;
  };
}

let cachedSession: UserSession | null = null;
let fetchPromise: Promise<UserSession> | null = null;

export function useSessionStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(cachedSession?.authenticated || false);
  const [userPermission, setUserPermission] = useState<string | null>(cachedSession?.user?.purchasing_permission || 'can_place_orders');
  const [sessionLoading, setSessionLoading] = useState(cachedSession === null);

  useEffect(() => {
    let mounted = true;

    async function loadSession(forceRefetch = false) {
      if (!forceRefetch && cachedSession !== null) {
        if (mounted) {
          setIsAuthenticated(cachedSession.authenticated);
          setUserPermission(cachedSession.user?.purchasing_permission || 'can_place_orders');
          setSessionLoading(false);
        }
        return;
      }

      setSessionLoading(true);
      try {
        const token = localStorage.getItem('storeToken');
        if (!token) {
          cachedSession = { authenticated: false };
        } else {
          if (!fetchPromise || forceRefetch) {
            fetchPromise = fetch(apiUrl('/api/store/auth/me'), {
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-store'
            }).then(r => r.ok ? r.json() : { authenticated: false });
          }
          const data = await fetchPromise;
          cachedSession = data;
        }

        if (mounted) {
          setIsAuthenticated(cachedSession?.authenticated || false);
          setUserPermission(cachedSession?.user?.purchasing_permission || 'can_place_orders');
          setSessionLoading(false);
        }
      } catch (e) {
        if (mounted) {
          cachedSession = { authenticated: false };
          setIsAuthenticated(false);
          setSessionLoading(false);
        }
      } finally {
        fetchPromise = null;
      }
    }

    loadSession();

    const handleAuthChange = () => {
      cachedSession = null;
      loadSession(true);
    };

    window.addEventListener('user-auth-change', handleAuthChange);
    return () => {
      mounted = false;
      window.removeEventListener('user-auth-change', handleAuthChange);
    };
  }, []);

  return { isAuthenticated, userPermission, sessionLoading };
}
