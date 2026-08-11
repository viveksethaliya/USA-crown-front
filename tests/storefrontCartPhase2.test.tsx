import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'

// Import components
import CartPage from '@/app/(main)/cart/page'

// Mock the cartFetch
import { cartFetch } from '@/lib/cart'
vi.mock('@/lib/cart', async () => {
  const actual = await vi.importActual('@/lib/cart')
  return {
    ...actual as any,
    cartFetch: vi.fn(),
  }
})
const mockedCartFetch = cartFetch as any

const mockCartTemplate = {
  id: 'cart-1',
  items: [
    {
      id: 'item-1',
      productId: 1,
      productName: 'Test Item',
      quantity: 2,
      unitPrice: 10,
      regularPrice: 12,
      lineTotal: 24,
      finalLineTotal: 20,
      discountAmount: 4
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

describe('Storefront Cart Phase 2 - UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('storeToken', 'dummy-token')
  })
  
  afterEach(() => {
    cleanup()
  })

  it('renders group winner correctly', async () => {
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cart: { ...mockCartTemplate, pricingSource: 'group', pricingSourceName: 'Gold Tier' } })
    })

    render(<CartPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Best available B2B price:')).not.toBeNull()
      expect(screen.getByText('Gold Tier')).not.toBeNull()
    })
  })

  it('renders Price List winner with Contract pricing label', async () => {
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cart: { ...mockCartTemplate, pricingSource: 'price_list', pricingSourceName: 'My Price List' } })
    })

    render(<CartPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Best available B2B price:')).not.toBeNull()
      expect(screen.getByText('Contract pricing')).not.toBeNull()
    })
  })

  it('renders Coupon winner with Applied label', async () => {
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        cart: { 
          ...mockCartTemplate, 
          pricingSource: 'coupon', 
          pricingSourceName: 'SAVE20',
          submittedCouponCodes: ['SAVE20'],
          selectedCouponCode: 'SAVE20'
        } 
      })
    })

    render(<CartPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Best available B2B price:')).not.toBeNull()
      expect(screen.getAllByText('SAVE20').length).toBeGreaterThan(0)
      expect(screen.getByText('APPLIED')).not.toBeNull()
    })
  })

  it('renders losing coupon with preservation message', async () => {
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        cart: { 
          ...mockCartTemplate, 
          pricingSource: 'group', 
          pricingSourceName: 'Gold Tier',
          submittedCouponCodes: ['SAVE20'],
          selectedCouponCode: null
        } 
      })
    })

    render(<CartPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Best available B2B price:')).not.toBeNull()
      expect(screen.getByText('Gold Tier')).not.toBeNull()
      // Should show the losing coupon code
      expect(screen.getAllByText('SAVE20').length).toBeGreaterThan(0)
      // Should show the preservation message
      expect(screen.getByText('Your existing B2B pricing gives you a better price, so this code was not applied.')).not.toBeNull()
    })
  })

  it('allows adding and removing a coupon', async () => {
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cart: mockCartTemplate })
    })

    render(<CartPage />)
    await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeNull())

    // Type in coupon
    const input = screen.getByPlaceholderText('Enter code')
    fireEvent.change(input, { target: { value: 'NEWCODE' } })
    
    // Mock the apply POST and subsequent loadCart GET
    mockedCartFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        cart: { ...mockCartTemplate, submittedCouponCodes: ['NEWCODE'] } 
      })
    })

    fireEvent.click(screen.getByRole('button', { name: /Apply/i }))

    await waitFor(() => {
      expect(mockedCartFetch).toHaveBeenCalledWith('/api/store/cart/coupons', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'NEWCODE' })
      }))
      expect(screen.getAllByText('NEWCODE').length).toBeGreaterThan(0)
    })

    // Now remove it
    mockedCartFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    mockedCartFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cart: mockCartTemplate })
    })

    const removeBtn = screen.getByText('Remove', { selector: 'button' })
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(mockedCartFetch).toHaveBeenCalledWith('/api/store/cart/coupons/NEWCODE', expect.objectContaining({
        method: 'DELETE'
      }))
    })
  })
})
