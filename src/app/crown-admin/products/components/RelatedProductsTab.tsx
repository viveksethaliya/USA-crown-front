import React, { useState, useEffect } from 'react';

interface RelatedProduct {
  product_id: number;
  related_product_id: number;
  type: string;
  related_product: {
    id: number;
    name: string;
    sku: string;
    image: { url: string }[];
  };
}

export default function RelatedProductsTab({ productId }: { productId: number }) {
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{id: number, name: string, sku: string}[]>([]);
  const [selectedType, setSelectedType] = useState('related');

  const fetchRelated = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/related`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRelated(data.related || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRelated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=10`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (relatedProductId: number) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/related`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ related_product_id: relatedProductId, type: selectedType })
      });
      if (res.ok) {
        setSearch('');
        setSearchResults([]);
        fetchRelated();
      } else {
        alert('Failed to add related product');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (relatedProductId: number, type: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/related/${relatedProductId}?type=${encodeURIComponent(type)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchRelated();
      } else {
        alert('Failed to remove related product');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h3>Related Products, Upsells, and Cross-sells</h3>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Link products to display them on the storefront product detail page or cart.
      </p>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: 8 }}>
        <h4 style={{ marginBottom: '1rem' }}>Add New Link</h4>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
          >
            <option value="related">Related</option>
            <option value="upsell">Upsell</option>
            <option value="cross_sell">Cross-sell</option>
          </select>
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={handleSearch}
            style={{ flex: 1, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        
        {searchResults.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, maxHeight: 200, overflowY: 'auto' }}>
            {searchResults.map(p => (
              <div 
                key={p.id} 
                style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <strong>{p.name}</strong> <span style={{ color: '#666', fontSize: '0.85rem' }}>({p.sku})</span>
                </div>
                <button 
                  onClick={() => handleAdd(p.id)}
                  style={{ background: '#0070f3', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '0.5rem' }}>Product</th>
            <th style={{ padding: '0.5rem' }}>SKU</th>
            <th style={{ padding: '0.5rem' }}>Type</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {related.length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No linked products.</td></tr>
          ) : related.map(r => (
            <tr key={`${r.related_product_id}-${r.type}`} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>{r.related_product?.name || 'Unknown'}</td>
              <td style={{ padding: '0.5rem' }}>{r.related_product?.sku || 'N/A'}</td>
              <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{r.type.replace('_', '-')}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                <button 
                  onClick={() => handleRemove(r.related_product_id, r.type)}
                  style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
