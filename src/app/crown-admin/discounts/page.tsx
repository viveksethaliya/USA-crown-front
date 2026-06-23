'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/cart';
import { toast } from "react-hot-toast";

interface Exclusion {
  product_id: number | null;
  category_id: number | null;
}

interface CustomerGroup {
  id: string;
  name: string;
}

interface Discount {
  id: string;
  name: string;
  type: string;
  value: number;
  min_quantity: number;
  is_active: boolean;
  customer_group_id: string | null;
  exclusions?: Exclusion[];
}

export default function DiscountsAdminPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [minQuantity, setMinQuantity] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [customerGroupId, setCustomerGroupId] = useState('');
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);

  // For adding new exclusion
  const [exclType, setExclType] = useState('product');
  const [exclId, setExclId] = useState('');

  const fetchData = async () => {
    try {
      const [discRes, groupsRes] = await Promise.all([
        fetch(apiUrl('/api/admin/discounts'), { credentials: 'include' }),
        fetch(apiUrl('/api/admin/customer-groups'), { credentials: 'include' })
      ]);
      
      if (!discRes.ok) throw new Error('Failed to fetch discounts');
      const discData = await discRes.json();
      setDiscounts(discData.discounts);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setCustomerGroups(Array.isArray(groupsData) ? groupsData : (groupsData.groups || []));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setValue(0);
    setMinQuantity(1);
    setIsActive(true);
    setCustomerGroupId('');
    setExclusions([]);
    setExclId('');
  };

  const handleEdit = (discount: Discount) => {
    setEditingId(discount.id);
    setName(discount.name);
    setValue(discount.value);
    setMinQuantity(discount.min_quantity);
    setIsActive(discount.is_active);
    setCustomerGroupId(discount.customer_group_id || '');
    setExclusions(discount.exclusions || []);
    setExclId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { 
      name, 
      value: Number(value), 
      min_quantity: Number(minQuantity), 
      is_active: isActive,
      customer_group_id: customerGroupId === '' ? null : customerGroupId,
      exclusions 
    };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/discounts/${editingId}` : '/api/admin/discounts';

    try {
      const response = await fetch(apiUrl(url), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save discount');
      }

      toast.success(editingId ? 'Discount updated' : 'Discount created');
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving discount');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this discount tier?')) return;
    
    try {
      const response = await fetch(apiUrl(`/api/admin/discounts/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete discount');
      toast.success('Discount deleted');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error deleting discount');
    }
  };

  const handleAddExclusion = () => {
    const idNum = parseInt(exclId);
    if (isNaN(idNum) || idNum <= 0) return;
    const newExcl: Exclusion = {
      product_id: exclType === 'product' ? idNum : null,
      category_id: exclType === 'category' ? idNum : null
    };
    setExclusions([...exclusions, newExcl]);
    setExclId('');
  };

  const handleRemoveExclusion = (idx: number) => {
    const newExcls = [...exclusions];
    newExcls.splice(idx, 1);
    setExclusions(newExcls);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading discounts...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Manage Discounts</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
        {/* Discouts List */}
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e5e7eb' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Tier Name</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Customer Group</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Minimum Qty</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Discount (%)</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    No discounts defined.
                  </td>
                </tr>
              ) : (
                discounts.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>
                      {d.name}
                      {d.exclusions && d.exclusions.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                          {d.exclusions.length} exclusions
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4b5563', fontSize: '13px' }}>
                      {d.customer_group_id 
                        ? customerGroups.find(g => g.id === d.customer_group_id)?.name || 'Unknown Group'
                        : 'Global (All)'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{d.min_quantity} pcs</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>{d.value}%</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        background: d.is_active ? '#d1fae5' : '#f3f4f6',
                        color: d.is_active ? '#065f46' : '#4b5563'
                      }}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => handleEdit(d)} style={{ color: '#2563eb', marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(d.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Editor Form */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '20px', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
            {editingId ? 'Edit Discount Tier' : 'Add New Tier'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Tier Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. 72-Piece Discount"
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Minimum Quantity (Items)</label>
              <input 
                type="number" 
                min="1" 
                value={minQuantity} 
                onChange={e => setMinQuantity(Number(e.target.value))} 
                required 
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Discount Percentage (%)</label>
              <input 
                type="number" 
                min="0.01" 
                max="100" 
                step="0.01" 
                value={value} 
                onChange={e => setValue(Number(e.target.value))} 
                required 
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Customer Group</label>
              <select 
                value={customerGroupId} 
                onChange={e => setCustomerGroupId(e.target.value)} 
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', background: 'white' }}
              >
                <option value="">Global (All Authenticated Users)</option>
                {customerGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
              />
              <span style={{ fontSize: '14px' }}>Active</span>
            </label>

            {/* Exclusions UI */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Exclusions</label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>Exclude specific products or categories from this discount.</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={exclType} onChange={e => setExclType(e.target.value)} style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  <option value="product">Product ID</option>
                  <option value="category">Category ID</option>
                </select>
                <input 
                  type="number" 
                  value={exclId} 
                  onChange={e => setExclId(e.target.value)} 
                  placeholder="ID"
                  style={{ width: '80px', padding: '8px', border: '1px solid #d1d5db' }}
                />
                <button type="button" onClick={handleAddExclusion} style={{ background: '#e5e7eb', padding: '8px 12px', border: 'none', cursor: 'pointer' }}>Add</button>
              </div>

              {exclusions.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                  {exclusions.map((ex, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span>{ex.product_id ? `Product ID: ${ex.product_id}` : `Category ID: ${ex.category_id}`}</span>
                      <button type="button" onClick={() => handleRemoveExclusion(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                type="submit" 
                style={{ flex: 1, background: '#111827', color: 'white', padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {editingId ? 'Update Tier' : 'Add Tier'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{ flex: 1, background: '#f3f4f6', color: '#374151', padding: '10px', border: '1px solid #d1d5db', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
