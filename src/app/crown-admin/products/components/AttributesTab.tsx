import React, { useEffect, useState } from 'react';
import styles from '../products.module.css';
import { ProductAttribute } from './types';

interface AttributesTabProps {
  attributes: ProductAttribute[];
  onChange: (attrs: ProductAttribute[]) => void;
}

interface GlobalAttribute {
  id: number;
  name: string;
  slug: string;
}

export default function AttributesTab({ attributes, onChange }: AttributesTabProps) {
  const [globalAttrs, setGlobalAttrs] = useState<GlobalAttribute[]>([]);
  const [selectedAttrId, setSelectedAttrId] = useState<string>('');

  useEffect(() => {
    fetch(`/api/admin/attributes`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setGlobalAttrs(data.attributes || []);
        if (data.attributes?.length > 0) {
          setSelectedAttrId(data.attributes[0].id.toString());
        }
      })
      .catch(err => console.error("Failed to load attributes", err));
  }, []);

  const handleAddAttribute = () => {
    if (!selectedAttrId) return;
    const attrDef = globalAttrs.find(a => a.id.toString() === selectedAttrId);
    if (!attrDef) return;

    if (attributes.some(a => a.attribute_id === attrDef.id)) {
      alert("This attribute is already added.");
      return;
    }

    const newAttr: ProductAttribute = {
      id: Date.now(), // temporary client-side ID
      attribute_id: attrDef.id,
      name: attrDef.name,
      slug: attrDef.slug,
      values: '',
      is_visible: true,
      is_for_variation: true
    };

    onChange([...attributes, newAttr]);
  };

  const handleRemoveAttribute = (attrId: number) => {
    onChange(attributes.filter(a => a.attribute_id !== attrId));
  };

  const updateAttribute = (attrId: number, field: keyof ProductAttribute, value: any) => {
    onChange(attributes.map(a => 
      a.attribute_id === attrId ? { ...a, [field]: value } : a
    ));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div className={styles.fieldGroup} style={{ flex: 1, maxWidth: '300px' }}>
          <label className={styles.fieldLabel}>Add existing attribute</label>
          <select 
            className={styles.fieldSelect} 
            value={selectedAttrId}
            onChange={(e) => setSelectedAttrId(e.target.value)}
          >
            {globalAttrs.map(ga => (
              <option key={ga.id} value={ga.id}>{ga.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleAddAttribute}
          style={{ padding: '0.65rem 1.5rem', background: '#d4af37', color: '#1a1a2e', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {attributes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            No attributes added to this product.
          </div>
        ) : (
          attributes.map(attr => (
            <div key={attr.attribute_id} style={{ border: '1px solid #e2e8f0', padding: '1.5rem', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a1a2e' }}>{attr.name}</h4>
                <button 
                  onClick={() => handleRemoveAttribute(attr.attribute_id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Remove
                </button>
              </div>

              <div className={styles.fieldGroup} style={{ marginBottom: '1rem' }}>
                <label className={styles.fieldLabel}>Values (Comma separated)</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={attr.values}
                  onChange={(e) => updateAttribute(attr.attribute_id, 'values', e.target.value)}
                  placeholder="e.g. Small, Medium, Large"
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={attr.is_visible}
                    onChange={(e) => updateAttribute(attr.attribute_id, 'is_visible', e.target.checked)}
                  />
                  Visible on product page
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={attr.is_for_variation}
                    onChange={(e) => updateAttribute(attr.attribute_id, 'is_for_variation', e.target.checked)}
                  />
                  Used for variations
                </label>
              </div>
            </div>
          ))
        )}
      </div>
      
      {attributes.length > 0 && (
        <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          * Make sure to save changes before attempting to generate variations.
        </div>
      )}
    </div>
  );
}
