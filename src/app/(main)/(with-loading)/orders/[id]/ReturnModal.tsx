'use client';

import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { apiUrl } from "@/lib/cart";

interface ReturnModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({ order, onClose, onSuccess }: ReturnModalProps) {
  const [returnItems, setReturnItems] = useState<{ [id: number]: { qty: number, reason: string } }>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: 'defective', label: 'Defective' },
    { value: 'wrong_item_shipped', label: 'Wrong Item Shipped' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'changed_mind', label: 'Changed Mind' },
    { value: 'damaged_in_transit', label: 'Damaged in Transit' },
    { value: 'sizing_issue', label: 'Sizing Issue' },
    { value: 'other', label: 'Other' },
  ];

  const handleQtyChange = (itemId: number, qty: number) => {
    setReturnItems(prev => {
      const updated = { ...prev };
      if (qty <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = { qty, reason: prev[itemId]?.reason || 'changed_mind' };
      }
      return updated;
    });
  };

  const handleReasonChange = (itemId: number, reason: string) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason }
    }));
  };

  const handleSubmit = async () => {
    const itemsPayload = Object.entries(returnItems).map(([id, data]) => ({
      order_item_id: parseInt(id, 10),
      quantity: data.qty,
      reason: data.reason
    }));

    if (itemsPayload.length === 0) {
      toast.error('Please select at least one item to return.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('storeToken');
      const res = await fetch(apiUrl(`/api/store/account/orders/${order.id}/return`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsPayload, customer_note: note })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Return requested successfully (RMA: ${data.return_number})`);
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to submit return request.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '8px', padding: '2rem',
        maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Request a Return</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>
            <FiX />
          </button>
        </div>

        <p style={{ marginBottom: '1.5rem', color: '#555', fontSize: '0.9rem' }}>
          Please select the items and quantities you wish to return, along with a reason for each.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', backgroundColor: '#fbfbfb' }}>
                <th style={{ padding: '0.75rem 0.5rem', color: '#555', fontSize: '0.85rem' }}>Product</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#555', fontSize: '0.85rem' }}>Purchased</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#555', fontSize: '0.85rem' }}>Return Qty</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#555', fontSize: '0.85rem' }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => {
                // In a robust system we'd subtract already-returned quantities here.
                const maxQty = item.quantity;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#333', fontSize: '0.9rem' }}>{item.product_name}</div>
                      {item.sku && <div style={{ fontSize: '0.75rem', color: '#999' }}>SKU: {item.sku}</div>}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#555', fontSize: '0.9rem' }}>{maxQty}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max={maxQty} 
                        value={returnItems[item.id]?.qty || 0}
                        onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10))}
                        style={{ width: '60px', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {returnItems[item.id]?.qty > 0 ? (
                        <select
                          value={returnItems[item.id]?.reason || 'changed_mind'}
                          onChange={(e) => handleReasonChange(item.id, e.target.value)}
                          style={{ padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', fontSize: '0.85rem' }}
                        >
                          {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : <span style={{ color: '#aaa', fontSize: '0.85rem' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>Additional Notes (Optional)</label>
          <textarea 
            rows={3} 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Please provide any additional details about your return..."
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '0.75rem 1.5rem', border: '1px solid #ccc', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: '#d1a054', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {submitting ? 'Submitting...' : <><FiCheck /> Submit Request</>}
          </button>
        </div>
      </div>
    </div>
  );
}
