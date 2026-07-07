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
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
