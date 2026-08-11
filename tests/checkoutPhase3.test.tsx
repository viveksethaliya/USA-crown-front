import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CheckoutPage from '../src/app/(main)/checkout/page'
import * as cartLib from '../src/lib/cart'

vi.mock('../src/lib/cart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/cart')>()
  return {
    ...actual,
    cartFetch: vi.fn(),
    formatMoney: actual.formatMoney
  }
})

const mockedCartFetch = vi.mocked(cartLib.cartFetch)

const mockCartTemplate = {
  id: 'cart-1',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Test Item',
      quantity: 2,
      unitPrice: 10,
      regularPrice: 12,
      finalLineTotal: 20
    }
  ],
  itemCount: 2,
  subtotal: 24,
  discountAmount: 4,
  total: 20,
  canCheckout: true,
  pricingSource: 'group',
  pricingSourceName: 'Gold Tier',
  submittedCouponCodes: [],
  selectedCouponCode: null,
  rejectedCouponMessages: []
}

describe('Checkout Phase 3 - Stability', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the standard responses for /api/store/checkout/shipping-methods
    // and /api/store/account/profile etc.
    mockedCartFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/store/cart')) {
        return { ok: true, json: async () => ({ cart: mockCartTemplate }) } as any
      }
      if (url.includes('/shipping-methods')) {
        return { ok: true, json: async () => ({ shippingMethods: [{ id: 'standard_review', name: 'Standard', cost: 0 }] }) } as any
      }
      if (url.includes('/profile')) {
        return { ok: true, json: async () => ({ first_name: 'John', last_name: 'Doe' }) } as any
      }
      if (url.includes('/addresses')) {
        return { ok: true, json: async () => ([]) } as any
      }
      if (url.includes('/fields')) {
        return { ok: true, json: async () => ([
          { id: 1, label: 'Agree to terms', field_key: 'terms', field_type: 'checkbox', is_required: true }
        ]) } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })
  })

  it('renders order summary with B2B safe wording and final line total', async () => {
    render(<CheckoutPage />)
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading checkout/i)).toBeNull()
    })

    // Check pricingSourceName is rendered
    expect(screen.getByText(/Best available B2B price/i)).not.toBeNull()
    expect(screen.getByText('Gold Tier')).not.toBeNull()
    
    // Check final line total
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0)
  })

  it('preserves form state and shows banner when canCheckout is false', async () => {
    mockedCartFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/store/cart')) {
        return { ok: true, json: async () => ({ cart: { ...mockCartTemplate, canCheckout: false } }) } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })

    render(<CheckoutPage />)
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading checkout/i)).toBeNull()
    })

    // Should show banner
    expect(screen.getByText('Cart needs attention')).not.toBeNull()
    
    // But the form should still be visible! 
    expect(screen.getByText('Billing Address')).not.toBeNull()
    
    // And place order button should be disabled
    const btn = screen.getByRole('button', { name: /Place Order/i })
    expect(btn.hasAttribute('disabled')).toBe(true)
  })

  it('confirmation wording is Current order total with review note', async () => {
    render(<CheckoutPage />)
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading checkout/i)).toBeNull()
    })

    // Simulate clicking place order (which is mocked to succeed if we set it up)
    mockedCartFetch.mockImplementation(async (url: string, init?: any) => {
      if (url === '/api/store/checkout' && init?.method === 'POST') {
        return { ok: true, json: async () => ({ order: { id: 'ord-123', total_amount: 20 } }) } as any
      }
      // fallback for initial load
      if (url.includes('/api/store/cart')) {
        return { ok: true, json: async () => ({ cart: mockCartTemplate }) } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })

    // Click button
    const btn = screen.getByRole('button', { name: /Place Order/i })
    // We need to fill required fields
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Phone \*/i), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/Address Line 1 \*/i), { target: { value: '123 test' } })
    fireEvent.change(screen.getByLabelText(/City \*/i), { target: { value: 'test' } })
    fireEvent.change(screen.getByLabelText(/State \/ Province \*/i), { target: { value: 'test' } })
    fireEvent.change(screen.getByLabelText(/Zip \/ Postal Code \*/i), { target: { value: '12345' } })
    
    // Checkbox custom field
    const checkbox = screen.getAllByRole('checkbox')[2] // first is sameAsBilling, second is terms
    fireEvent.click(checkbox)
    
    // Check terms
    const terms = screen.getAllByRole('checkbox')[1]
    fireEvent.click(terms)

    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText(/Order received/i)).not.toBeNull()
      expect(screen.getByText(/Current order total/i)).not.toBeNull()
      expect(screen.getByText(/Shipping and tax are pending and subject to staff review/i)).not.toBeNull()
    })
  })
})
