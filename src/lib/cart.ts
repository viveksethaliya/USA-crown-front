export const GUEST_CART_ID_KEY = 'crown_guest_cart_id';

export interface CartItem {
  id: string;
  productId: number;
  variationId: number | null;
  productName: string;
  variationLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number | null;
  regularPrice?: number | null;
  lineTotal: number | null;
  available: boolean;
  availabilityMessage: string | null;
}

export interface CartSummary {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number | null;
  discountAmount: number | null;
  discountTierName: string | null;
  discountId: string | null;
  total: number | null;
  hasPricing: boolean;
  minimumOrderAmount: number;
  belowMinimum: boolean;
  canCheckout: boolean;
  authenticated: boolean;
}

export interface CartApiResponse {
  success?: boolean;
  cart: CartSummary;
  error?: string;
}

export function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}${path}`;
}

function createGuestCartId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export function getGuestCartId() {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(GUEST_CART_ID_KEY);
  if (existing) return existing;

  const guestId = createGuestCartId();
  window.localStorage.setItem(GUEST_CART_ID_KEY, guestId);
  return guestId;
}

export function clearGuestCartId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_CART_ID_KEY);
}

export async function mergeGuestCart() {
  const guestId = getGuestCartId();
  if (!guestId) return null;

  const response = await fetch(apiUrl('/api/cart/merge'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId })
  });

  if (!response.ok) return null;

  const data = await response.json() as CartApiResponse;
  clearGuestCartId();
  window.dispatchEvent(new Event('cart-updated'));
  return data.cart;
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Login to view';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}
