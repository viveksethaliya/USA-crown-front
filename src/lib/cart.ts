export interface CartItem {
  id: string;
  productId: number;
  variationId: number | null;
  productName: string;
  variationLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  lineTotal: number;
  discountAmount?: number;
  finalLineTotal?: number;
  available: boolean;
  availabilityMessage: string | null;
}

export interface CartSummary {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  discountTierName: string | null;
  total: number;
  canCheckout: boolean;
}

export interface CartApiResponse {
  success?: boolean;
  cart?: CartSummary;
  error?: string;
}

const BACKEND_URL = 'https://api.utilixo.online';

export function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (base) {
    // If on client and base is localhost, dynamically rewrite to actual hostname for LAN testing
    if (typeof window !== 'undefined' && base.includes('localhost')) {
      if (window.location.hostname !== 'localhost') {
        return `${base.replace('localhost', window.location.hostname)}${path}`;
      }
    }
    return `${base}${path}`;
  }

  // Server-side (SSR): must use absolute URL — relative paths are not valid in Node.js fetch()
  if (typeof window === 'undefined') return `${BACKEND_URL}${path}`;

  // Client-side: use relative path so Next.js rewrites proxy it (avoids CORS)
  return path;
}

export function cartFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('storeToken') : null;
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Login to view';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}
