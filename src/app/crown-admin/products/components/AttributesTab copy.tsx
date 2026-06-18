import React, { useEffect, useState } from 'react';
import styles from '../products.module.css';
import { ProductAttribute } from './types';
import { toast } from "react-hot-toast";

interface AttributesTabProps {
  attributes: ProductAttribute[];
  onChange: (attrs: ProductAttribute[]) => void;
}

interface GlobalAttribute {
  id: number;
  name: string;
  slug: string;
}

interface Term {
  id: number;
  name: string;
  slug: string;
}

function TermSelector({ attrId, selectedTermIds, onTermsChange, legacyValues, onLegacyChange }: { attrId: number, selectedTermIds: number[], onTermsChange: (ids: number[]) => void, legacyValues: string, onLegacyChange: (val: string) => void }) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Own the selection state locally so clicks are instant - no parent re-render needed
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const initializedRef = React.useRef(false);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetch(`/api/admin/attributes/${attrId}/terms`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFetchError(data.error);
          setTerms([]);
        } else {
          setTerms(data.terms || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load terms", err);
        setFetchError("Network error loading terms");
        setLoading(false);
      });
  }, [attrId]);

  // Initialize selectedIds from props once terms are loaded
  useEffect(() => {
    if (!initializedRef.current && !loading) {
      const normalized = (selectedTermIds || []).map(id => Number(id));
      setSelectedIds(normalized);
      initializedRef.current = true;
    }
  }, [loading, selectedTermIds]);

  const toggleTerm = (term: Term) => {
    const termId = Number(term.id);
    setSelectedIds(prev => {
      const next = prev.includes(termId)
        ? prev.filter(id => id !== termId)
        : [...prev, termId];
      
      // Propagate to parent for saving
      onTermsChange(next);
      
      // Update legacy comma-separated string
      const names = terms.filter(t => next.includes(Number(t.id))).map(t => t.name);
      onLegacyChange(names.join(', '));
      
      return next;
    });
  };

  if (loading) return <div style={{ fontSize: '0.85rem', color: '#666' }}>Loading terms...</div>;

  if (fetchError) return (
    <div style={{ marginBottom: '1rem' }}>
      <label className={styles.fieldLabel}>Select Terms</label>
      <div style={{ fontSize: '0.85rem', color: '#ef4444', padding: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
        ⚠️ Error loading terms: {fetchError}
        <br /><span style={{ color: '#64748b' }}>Check table permissions in Supabase for <strong>attribute_terms</strong>.</span>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className={styles.fieldLabel}>Select Terms {selectedIds.length > 0 && <span style={{ color: '#3b82f6', fontWeight: 'normal' }}>({selectedIds.length} selected)</span>}</label>
      {terms.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          No terms defined for this attribute yet.{' '}
          <a href="/crown-admin/attributes" target="_blank" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            Go to Attributes manager
          </a>
          {' '}to add terms first.
          <div style={{ marginTop: '0.5rem' }}>
            <input 
              type="text" 
              className={styles.fieldInput} 
              placeholder="Fallback comma-separated values" 
              value={legacyValues} 
              onChange={e => onLegacyChange(e.target.value)} 
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc', maxHeight: '150px', overflowY: 'auto' }}>
          {terms.map(term => {
            const isSelected = selectedIds.includes(Number(term.id));
            return (
              <div
                key={term.id}
                onClick={() => toggleTerm(term)}
                style={{ 
                  padding: '0.3rem 0.6rem', 
                  background: isSelected ? '#3b82f6' : '#fff', 
                  color: isSelected ? '#fff' : '#1e293b', 
                  border: `1px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}`, 
                  borderRadius: '16px', 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {term.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

  // Coerce all incoming IDs to numbers to avoid string/number type mismatch
  const normalizedSelectedIds = (selectedTermIds || []).map(id => Number(id));

  const toggleTerm = (term: Term) => {
    const termId = Number(term.id);
    let newIds = [...normalizedSelectedIds];
    if (newIds.includes(termId)) {
      newIds = newIds.filter(id => id !== termId);
    } else {
      newIds.push(termId);
    }
    onTermsChange(newIds);
    
    // Auto-update legacy comma-separated string for fallback
    const selectedTerms = terms.filter(t => newIds.includes(Number(t.id))).map(t => t.name);
    onLegacyChange(selectedTerms.join(', '));
  };

  if (loading) return <div style={{ fontSize: '0.85rem', color: '#666' }}>Loading terms...</div>;

  if (fetchError) return (
    <div style={{ marginBottom: '1rem' }}>
      <label className={styles.fieldLabel}>Select Terms</label>
      <div style={{ fontSize: '0.85rem', color: '#ef4444', padding: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
        ⚠️ Error loading terms: {fetchError}
        <br /><span style={{ color: '#64748b' }}>Check table permissions in Supabase for <strong>attribute_terms</strong>.</span>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className={styles.fieldLabel}>Select Terms</label>
      {terms.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          No terms defined for this attribute yet.{' '}
          <a href="/crown-admin/attributes" target="_blank" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            Go to Attributes manager
          </a>
          {' '}to add terms first.
          <div style={{ marginTop: '0.5rem' }}>
            <input 
              type="text" 
              className={styles.fieldInput} 
              placeholder="Fallback comma-separated values" 
              value={legacyValues} 
              onChange={e => onLegacyChange(e.target.value)} 
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc', maxHeight: '150px', overflowY: 'auto' }}>
          {terms.map(term => {
            const isSelected = normalizedSelectedIds.includes(Number(term.id));
            return (
              <div
                key={term.id}
                onClick={() => toggleTerm(term)}
                style={{ 
                  padding: '0.3rem 0.6rem', 
                  background: isSelected ? '#3b82f6' : '#fff', 
                  color: isSelected ? '#fff' : '#1e293b', 
                  border: `1px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}`, 
                  borderRadius: '16px', 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {term.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AttributesTab({ attributes, onChange }: AttributesTabProps) {
  const [globalAttrs, setGlobalAttrs] = useState<GlobalAttribute[]>([]);
  const [selectedAttrId, setSelectedAttrId] = useState<string>('');
  // Local copy of attributes so selections are immediately visible
  const [localAttrs, setLocalAttrs] = useState<ProductAttribute[]>(attributes || []);

  // Sync from parent only on first load (not on every parent re-render)
  useEffect(() => {
    setLocalAttrs(attributes || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

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

  const applyChange = (newAttrs: ProductAttribute[]) => {
    setLocalAttrs(newAttrs);
    onChange(newAttrs);
  };

  const handleAddAttribute = () => {
    if (!selectedAttrId) return;
    const attrDef = globalAttrs.find(a => a.id.toString() === selectedAttrId);
    if (!attrDef) return;

    if (localAttrs.some(a => a.attribute_id === attrDef.id)) {
      toast.error("This attribute is already added.");
      return;
    }

    const newAttr: ProductAttribute = {
      id: Date.now(), // temporary client-side ID
      attribute_id: attrDef.id,
      name: attrDef.name,
      slug: attrDef.slug,
      values: '',
      term_ids: [],
      is_visible: true,
      is_for_variation: true
    };

    applyChange([...localAttrs, newAttr]);
  };

  const handleRemoveAttribute = (attrId: number) => {
    applyChange(localAttrs.filter(a => a.attribute_id !== attrId));
  };

  const updateAttribute = <K extends keyof ProductAttribute>(attrId: number, field: K, value: ProductAttribute[K]) => {
    applyChange(localAttrs.map(a => 
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
        {localAttrs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            No attributes added to this product.
          </div>
        ) : (
          localAttrs.map(attr => (
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

              <TermSelector 
                attrId={attr.attribute_id} 
                selectedTermIds={attr.term_ids || []}
                onTermsChange={(ids) => updateAttribute(attr.attribute_id, 'term_ids', ids)}
                legacyValues={attr.values}
                onLegacyChange={(val) => updateAttribute(attr.attribute_id, 'values', val)}
              />

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
      
      {localAttrs.length > 0 && (
        <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          * Make sure to save changes before attempting to generate variations.
        </div>
      )}
    </div>
  );
}
