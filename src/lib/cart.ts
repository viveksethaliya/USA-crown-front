export interface CartItem {
  id: string;
  productId: number;
  productSlug: string | null;
  variationId: number | null;
  productName: string;
  variationLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  lineTotal: number;
  discountAmount: number;
  finalLineTotal: number;
  available: boolean;
  availabilityMessage: string | null;
}

export interface CartSummary {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount?: number;
  total: number;
  canCheckout: boolean;
  pricingSource: string | null;
  pricingSourceName: string | null;
  submittedCouponCodes: string[];
  selectedCouponCode: string | null;
  rejectedCouponMessages: { code: string; reason: string }[];
}

export interface CartApiResponse {
  success?: boolean;
  cart?: CartSummary;
  error?: string;
}

import { apiUrl, storeFetch as cartFetch } from './api';

export { apiUrl, cartFetch };

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Login to view';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function getGuestCartId(): string {
  if (typeof window === 'undefined') return '';
  let guestId = localStorage.getItem('guestCartId');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 11) + Date.now();
    localStorage.setItem('guestCartId', guestId);
  }
  return guestId;
}
