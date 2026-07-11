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

export function apiUrl(path: string) {
  let base = process.env.NEXT_PUBLIC_API_URL;
  
  // If on client and base is localhost, dynamically rewrite to actual hostname for LAN testing
  if (typeof window !== 'undefined' && base && base.includes('localhost')) {
    if (window.location.hostname !== 'localhost') {
      base = base.replace('localhost', window.location.hostname);
    }
  }

  if (!base) {
    base = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
  }
  return `${base}${path}`;
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
