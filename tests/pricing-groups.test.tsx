import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'

// Import components
import PricingGroupsAdmin from '@/app/crown-admin/pricing-groups/page'
import GroupOverview from '@/components/pricing-groups/GroupOverview'
import GroupCustomers from '@/components/pricing-groups/GroupCustomers'
import RuleEditor from '@/components/pricing-groups/RuleEditor'
import GroupRules from '@/components/pricing-groups/GroupRules'

// Mock the API client
import { adminFetch } from '@/lib/api'
const mockedAdminFetch = adminFetch as any

describe('B2B Pricing Groups - UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.prompt = vi.fn()
    window.confirm = vi.fn()
  })

  it('renders empty state when no groups exist', async () => {
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groups: [] })
    })

    render(<PricingGroupsAdmin />)
    
    await waitFor(() => {
      expect(screen.getByText(/No groups exist yet/i)).not.toBeNull()
    })
  })

  it('can create a new group', async () => {
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groups: [] })
    })

    render(<PricingGroupsAdmin />)
    await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeNull())

    // Mock prompt
    ;(window.prompt as any).mockReturnValue('New VIP Group')

    // Mock POST
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ group: { id: 1, name: 'New VIP Group', status: 'draft' } })
    })

    // Mock GET (fetchGroups after create)
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groups: [{ id: 1, name: 'New VIP Group', status: 'draft' }] })
    })

    fireEvent.click(screen.getByTitle('Create new group'))

    await waitFor(() => {
      expect(mockedAdminFetch).toHaveBeenCalledWith('/api/admin/pricing-groups', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New VIP Group' })
      }))
    })
  })

  it('warns when activating a group in GroupOverview', async () => {
    const group = { id: 1, name: 'Test Group', status: 'draft' }
    
    render(<GroupOverview group={group} onUpdate={() => {}} />)
    
    // Change status to active
    const select = screen.getByRole('combobox', { name: /lifecycle status/i })
    fireEvent.change(select, { target: { name: 'status', value: 'active' } })

    // Confirm dialog should appear
    expect(screen.getByText(/Activate Pricing Group\?/i)).not.toBeNull()
    
    // Mock the PUT request
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ group: { ...group, status: 'active' } })
    })
    
    // Click 'Yes, Activate'
    fireEvent.click(screen.getByText(/Yes, Activate/i))
    
    await waitFor(() => {
      expect(mockedAdminFetch).toHaveBeenCalledWith('/api/admin/pricing-groups/1', expect.objectContaining({
        method: 'PUT'
      }))
    })
  })

  it('Customer inheritance limit noted and prevents adding sub-users directly', async () => {
    const group = { id: 1, name: 'Test Group' }
    
    // Initial fetch empty
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ members: [] })
    })

    render(<GroupCustomers group={group} />)

    // Search for a user
    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 10, first_name: 'John', email: 'john@example.com', parent_user_id: null },
          { id: 11, first_name: 'Jane', email: 'jane@example.com', parent_user_id: 10 } // sub-user
        ]
      })
    })

    fireEvent.change(screen.getByPlaceholderText(/Search customers/i), { target: { value: 'j' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).not.toBeNull()
    })

    // Parent account should have an enabled Add button
    const buttons = screen.getAllByRole('button', { name: /Add/i })
    const parentButton = buttons.find(b => !b.hasAttribute('disabled'))
    const subuserButton = buttons.find(b => b.hasAttribute('disabled'))
    
    expect(parentButton).toBeDefined()
    expect(subuserButton).toBeDefined() // sub-user is disabled

    // The text explicitly explaining sub-user inheritance should exist
    expect(screen.getByText(/Sub-users automatically inherit the group of their parent account/i)).not.toBeNull()
  })

  it('Core Rule Editor applies correct specificity rank for target', async () => {
    const group = { id: 1, name: 'Test Group' }
    
    render(<RuleEditor group={group} ruleType="group_pricing" initialRule={null} onClose={() => {}} onSaved={() => {}} />)
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. 10% Off Base Products/i), { target: { value: 'Test Rule', name: 'name' } })
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '15', name: 'percent_off' } }) // First spinbutton is percent
    
    // Set Target to Variation
    const targetSelect = document.querySelector('select[name="target_type"]') as HTMLSelectElement;
    if (!targetSelect) throw new Error('Could not find targetSelect');
    fireEvent.change(targetSelect, { target: { value: 'variation', name: 'target_type' } })
    
    fireEvent.change(screen.getByPlaceholderText(/Enter variation ID/i), { target: { value: '99', name: 'target_id' } })

    mockedAdminFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rule: { id: 1 } })
    })

    fireEvent.click(screen.getByText('Save Rule'))

    await waitFor(() => {
      expect(mockedAdminFetch).toHaveBeenCalled()
      const payload = JSON.parse(mockedAdminFetch.mock.calls[0][1].body)
      // Rank 4 is variation
      expect(payload.specificity_rank).toBe(4)
      expect(payload.targets[0]).toEqual({ target_type: 'variation', target_id: '99', is_exclusion: false })
      expect(payload.actions[0]).toEqual({ action_type: 'percent_off', percent_value: 15 })
    })
  })
})
