'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Layers, X, ChevronDown, Image as ImageIcon, Edit2, Library } from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';
import MediaPickerModal from '../../../../../components/media/MediaPickerModal';

const API = 'http://localhost:5000/api/admin';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: label for a variation (e.g. "14K Yellow Gold / Size 7")
// ─────────────────────────────────────────────────────────────────────────────
function variationLabel(variation: any, productAttributes: any[]) {
  if (!variation.variation_attribute_values?.length) return variation.sku || `Variation #${variation.id}`;
  return variation.variation_attribute_values
    .map((vav: any) => {
      const pa = productAttributes.find(pa => pa.attribute_id === vav.attribute_id);
      const attrName = pa?.attributes?.name || '';
      const value = vav.attribute_values?.value || '';
      return `${attrName}: ${value}`;
    })
    .join(' / ');
}

export default function VariationsTab({ productId, productType, variations, setVariations, attributes }: { productId: string, productType: string, variations: any[], setVariations: React.Dispatch<React.SetStateAction<any[]>>, attributes: any[] }) {
  const [productAttributes, setProductAttributes] = useState<any[]>([]); // attributes linked to THIS product
  const [isLoadingPAs, setIsLoadingPAs] = useState(true);
  const [isLinkingAttr, setIsLinkingAttr] = useState(false);
  const [isAddingVar, setIsAddingVar] = useState(false);

  // Form state for new variation
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVar, setNewVar] = useState<any>({
    sku: '', regular_price: '', sale_price: '',
    stock_quantity: '', stock_status: 'instock', is_published: true,
    weight_g: '', length_in: '', width_in: '', height_in: '', position: '',
    image_url: '',
    selectedValues: {} // { attribute_id: attribute_value_id }
  });

  // Form state for editing variation
  const [editingVarId, setEditingVarId] = useState<number | null>(null);
  const [isUpdatingVar, setIsUpdatingVar] = useState(false);
  const [editVar, setEditVar] = useState<any>(null);

  // Media picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<'new' | 'edit' | null>(null);

  const getToken = () => localStorage.getItem('adminToken');

  // ── Load product's linked attributes ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingPAs(true);
      try {
        const res = await fetch(`${API}/products/${productId}/attributes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) setProductAttributes(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingPAs(false);
      }
    };
    load();
  }, [productId]);

  // ── Link a global attribute to this product ───────────────────────────────
  const handleLinkAttribute = async (attributeId: string) => {
    if (productAttributes.find(pa => pa.attribute_id === parseInt(attributeId))) return;
    setIsLinkingAttr(true);
    try {
      const res = await fetch(`${API}/products/${productId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ attribute_id: parseInt(attributeId), position: productAttributes.length })
      });
      if (res.ok) {
        const data = await res.json();
        setProductAttributes(prev => [...prev, data]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinkingAttr(false);
    }
  };

  // ── Unlink an attribute from this product ─────────────────────────────────
  const handleUnlinkAttribute = async (attributeId: number) => {
    if (!confirm('Remove this attribute from this product? Existing variations will lose this dimension.')) return;
    try {
      await fetch(`${API}/products/${productId}/attributes/${attributeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setProductAttributes(prev => prev.filter(pa => pa.attribute_id !== attributeId));
    } catch (e) {
      console.error(e);
    }
  };

  // ── Add a new variation ───────────────────────────────────────────────────
  const handleAddVariation = async () => {
    setIsAddingVar(true);
    try {
      // Build attribute_values array from selectedValues
      const attribute_values = Object.entries(newVar.selectedValues)
        .filter(([, valId]) => valId)
        .map(([attrId, valId]) => ({
          attribute_id: parseInt(attrId),
          attribute_value_id: parseInt(valId as string)
        }));

      const payload = {
        sku: newVar.sku || null,
        regular_price: newVar.regular_price || null,
        sale_price: newVar.sale_price || null,
        stock_quantity: newVar.stock_quantity !== '' ? parseInt(newVar.stock_quantity) : null,
        stock_status: newVar.stock_status,
        is_published: newVar.is_published,
        image_url: newVar.image_url || null,
        weight_g: newVar.weight_g !== '' ? parseFloat(newVar.weight_g) : null,
        length_in: newVar.length_in !== '' ? parseFloat(newVar.length_in) : null,
        width_in: newVar.width_in !== '' ? parseFloat(newVar.width_in) : null,
        height_in: newVar.height_in !== '' ? parseFloat(newVar.height_in) : null,
        position: newVar.position !== '' ? parseInt(newVar.position) : variations.length,
        attribute_values
      };

      const res = await fetch(`${API}/products/${productId}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        // Re-fetch this variation with its attribute values attached
        const refetch = await fetch(`${API}/products/${productId}/variations`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (refetch.ok) setVariations(await refetch.json());

        // Reset form
        setNewVar({ 
          sku: '', regular_price: '', sale_price: '', stock_quantity: '', 
          stock_status: 'instock', is_published: true, image_url: '', 
          weight_g: '', length_in: '', width_in: '', height_in: '', position: '',
          selectedValues: {} 
        });
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingVar(false);
    }
  };

  // ── Update an existing variation ──────────────────────────────────────────
  const handleUpdateVariation = async () => {
    if (!editVar || editingVarId === null) return;
    setIsUpdatingVar(true);
    try {
      const payload = {
        sku: editVar.sku || null,
        regular_price: editVar.regular_price || null,
        sale_price: editVar.sale_price || null,
        stock_quantity: editVar.stock_quantity !== '' && editVar.stock_quantity !== null ? parseInt(editVar.stock_quantity) : null,
        stock_status: editVar.stock_status,
        is_published: editVar.is_published,
        image_url: editVar.image_url || null,
        weight_g: editVar.weight_g !== '' && editVar.weight_g !== null ? parseFloat(editVar.weight_g) : null,
        length_in: editVar.length_in !== '' && editVar.length_in !== null ? parseFloat(editVar.length_in) : null,
        width_in: editVar.width_in !== '' && editVar.width_in !== null ? parseFloat(editVar.width_in) : null,
        height_in: editVar.height_in !== '' && editVar.height_in !== null ? parseFloat(editVar.height_in) : null,
        position: editVar.position !== '' && editVar.position !== null ? parseInt(editVar.position) : 0,
      };

      const res = await fetch(`${API}/products/${productId}/variations/${editingVarId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Re-fetch to get updated data with relations
        const refetch = await fetch(`${API}/products/${productId}/variations`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (refetch.ok) setVariations(await refetch.json());
        setEditingVarId(null);
        setEditVar(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingVar(false);
    }
  };

  // ── Delete a variation ────────────────────────────────────────────────────
  const handleDeleteVariation = async (varId: number) => {
    if (!confirm('Delete this variation?')) return;
    try {
      await fetch(`${API}/products/${productId}/variations/${varId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setVariations(prev => prev.filter(v => v.id !== varId));
    } catch (e) {
      console.error(e);
    }
  };

  // ── Not a variable product ────────────────────────────────────────────────
  if (productType !== 'variable') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
        <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="font-medium">This product is not Variable</p>
        <p className="text-sm mt-1">Change the type to <strong>Variable</strong> in the Basic Info tab and save first.</p>
      </div>
    );
  }

  // ── Which global attributes are not yet linked to this product ─────────────
  const linkedAttrIds = new Set(productAttributes.map(pa => pa.attribute_id));
  const availableToLink = attributes.filter(a => !linkedAttrIds.has(a.id));

  return (
    <div className="space-y-6">

      {/* ── STEP 1: Attribute Configuration ──────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Step 1 — Choose Variation Attributes</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select which attributes drive variations on this product (e.g. Metal Type, Ring Size)
          </p>
        </div>

        {/* Currently linked */}
        {isLoadingPAs ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : productAttributes.length === 0 ? (
          <p className="text-sm text-gray-600 italic">No attributes linked yet. Use the dropdown below to add one.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {productAttributes.map(pa => (
              <div key={pa.attribute_id}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg group">
                <span className="text-sm font-medium text-purple-300">{pa.attributes?.name}</span>
                <span className="text-xs text-purple-500/70">
                  {pa.attributes?.attribute_values?.length || 0} values
                </span>
                <button
                  onClick={() => handleUnlinkAttribute(pa.attribute_id)}
                  className="text-purple-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add attribute dropdown */}
        {availableToLink.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
            <label className="text-sm text-gray-400 flex-shrink-0">Add attribute:</label>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && handleLinkAttribute(e.target.value)}
              disabled={isLinkingAttr}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">— Select an attribute —</option>
              {availableToLink.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.attribute_values?.length || 0} values)
                </option>
              ))}
            </select>
            {isLinkingAttr && <Loader2 className="w-4 h-4 animate-spin text-purple-400 flex-shrink-0" />}
          </div>
        )}

        {productAttributes.length > 0 && attributes.length > 0 && availableToLink.length === 0 && (
          <p className="text-xs text-gray-600 pt-1">All available attributes are linked.</p>
        )}
      </div>

      {/* ── STEP 2: Add / List Variations ────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Step 2 — Manage Variations</h3>
            <p className="text-xs text-gray-500 mt-0.5">Each variation = one specific combination of attribute values</p>
          </div>
          {productAttributes.length > 0 && (
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Variation
            </button>
          )}
        </div>

        {productAttributes.length === 0 && (
          <div className="py-6 text-center text-gray-600 text-sm">
            ← Complete Step 1 first by linking at least one attribute
          </div>
        )}

        {/* New Variation Form */}
        {showAddForm && productAttributes.length > 0 && (
          <div className="bg-gray-950 border border-gray-700 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-gray-300">New Variation</p>

            {/* Attribute value selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productAttributes.map(pa => {
                const sortedValues = [...(pa.attributes?.attribute_values || [])].sort((a, b) => a.position - b.position);
                return (
                  <div key={pa.attribute_id}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {pa.attributes?.name} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newVar.selectedValues[pa.attribute_id] || ''}
                      onChange={(e) => setNewVar((prev: any) => ({
                        ...prev,
                        selectedValues: { ...prev.selectedValues, [pa.attribute_id]: e.target.value }
                      }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="">— Select {pa.attributes?.name} —</option>
                      {sortedValues.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.value}
                        </option>
                      ))}
                    </select>
                    {sortedValues.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">
                        ⚠ No values defined for {pa.attributes?.name} yet. Go to Attributes page to add values.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">SKU</label>
                <input type="text" value={newVar.sku}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, sku: e.target.value }))}
                  placeholder="e.g. RNG-14KYG-7"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Regular Price ($)</label>
                <input type="number" step="0.01" value={newVar.regular_price}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, regular_price: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Sale Price ($)</label>
                <input type="number" step="0.01" value={newVar.sale_price}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, sale_price: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Qty in Stock</label>
                <input type="number" value={newVar.stock_quantity}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, stock_quantity: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
            </div>

            {/* Dimensions & Weight */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Weight (g)</label>
                <input type="number" step="0.0001" value={newVar.weight_g}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, weight_g: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Length (in)</label>
                <input type="number" step="0.001" value={newVar.length_in}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, length_in: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Width (in)</label>
                <input type="number" step="0.001" value={newVar.width_in}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, width_in: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Height (in)</label>
                <input type="number" step="0.001" value={newVar.height_in}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, height_in: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Position (Sort)</label>
                <input type="number" value={newVar.position}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, position: e.target.value }))}
                  placeholder={variations.length.toString()}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
            </div>

            {/* Variation Image */}
            <div className="pt-3 border-t border-gray-800">
              <label className="block text-xs font-medium text-gray-400 mb-2">Variation Image</label>
              {newVar.image_url ? (
                <div className="relative inline-block group">
                  <img src={newVar.image_url} alt="Variation" className="h-20 w-20 object-cover rounded-lg border border-gray-700" />
                  <button 
                    onClick={() => setNewVar((p: any) => ({ ...p, image_url: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-w-xs">
                  <ImageUploader 
                    folder="variations" 
                    multiple={false} 
                    onUploaded={(url) => setNewVar((p: any) => ({ ...p, image_url: url }))} 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMediaTarget('new');
                      setIsMediaPickerOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 transition-colors text-xs font-medium"
                  >
                    <Library className="w-3.5 h-3.5" /> Pick from Library
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <select value={newVar.stock_status}
                onChange={(e) => setNewVar((p: any) => ({ ...p, stock_status: e.target.value }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none">
                <option value="instock">In Stock</option>
                <option value="outofstock">Out of Stock</option>
                <option value="onbackorder">On Backorder</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={newVar.is_published}
                  onChange={(e) => setNewVar((p: any) => ({ ...p, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-500" />
                Published
              </label>
              <div className="flex-1" />
              <button onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleAddVariation} disabled={isAddingVar}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {isAddingVar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Variation
              </button>
            </div>
          </div>
        )}

        {/* Existing Variations List */}
        <div className="space-y-2">
          {variations.length === 0 ? (
            <div className={`py-8 text-center text-gray-600 text-sm ${productAttributes.length > 0 ? '' : 'hidden'}`}>
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
              No variations yet. Click "Add Variation" above.
            </div>
          ) : (
            variations.map((v, idx) => {
              if (editingVarId === v.id && editVar) {
                return (
                  <div key={v.id} className="bg-gray-900 border border-indigo-500/50 rounded-xl p-6 shadow-lg shadow-indigo-900/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <h4 className="text-sm font-semibold text-indigo-400">Editing: {variationLabel(v, productAttributes)}</h4>
                      <button onClick={() => setEditingVarId(null)} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">SKU</label>
                        <input type="text" value={editVar.sku || ''}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, sku: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Regular Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                          <input type="number" step="0.01" value={editVar.regular_price || ''}
                            onChange={(e) => setEditVar((p: any) => ({ ...p, regular_price: e.target.value }))}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-6 pr-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Sale Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                          <input type="number" step="0.01" value={editVar.sale_price || ''}
                            onChange={(e) => setEditVar((p: any) => ({ ...p, sale_price: e.target.value }))}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-6 pr-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Stock Qty</label>
                        <input type="number" value={editVar.stock_quantity === null ? '' : editVar.stock_quantity}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, stock_quantity: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Weight (g)</label>
                        <input type="number" step="0.001" value={editVar.weight_g || ''}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, weight_g: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Length (in)</label>
                        <input type="number" step="0.001" value={editVar.length_in || ''}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, length_in: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Width (in)</label>
                        <input type="number" step="0.001" value={editVar.width_in || ''}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, width_in: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Height (in)</label>
                        <input type="number" step="0.001" value={editVar.height_in || ''}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, height_in: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Position</label>
                        <input type="number" value={editVar.position || 0}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, position: e.target.value }))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-800">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Variation Image</label>
                      {editVar.image_url ? (
                        <div className="relative inline-block group">
                          <img src={editVar.image_url} alt="Variation" className="h-20 w-20 object-cover rounded-lg border border-gray-700" />
                          <button 
                            onClick={() => setEditVar((p: any) => ({ ...p, image_url: '' }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-w-xs">
                          <ImageUploader 
                            folder="variations" 
                            multiple={false} 
                            onUploaded={(url) => setEditVar((p: any) => ({ ...p, image_url: url }))} 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMediaTarget('edit');
                              setIsMediaPickerOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 transition-colors text-xs font-medium"
                          >
                            <Library className="w-3.5 h-3.5" /> Pick from Library
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <select value={editVar.stock_status || 'instock'}
                        onChange={(e) => setEditVar((p: any) => ({ ...p, stock_status: e.target.value }))}
                        className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="instock">In Stock</option>
                        <option value="outofstock">Out of Stock</option>
                        <option value="onbackorder">On Backorder</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={editVar.is_published}
                          onChange={(e) => setEditVar((p: any) => ({ ...p, is_published: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-800 bg-gray-950 text-indigo-500" />
                        Published
                      </label>
                      <div className="flex-1" />
                      <button onClick={() => setEditingVarId(null)}
                        className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleUpdateVariation} disabled={isUpdatingVar}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                        {isUpdatingVar ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Save Changes
                      </button>
                    </div>
                  </div>
                );
              }

              return (
              <div key={v.id}
                className="flex items-center justify-between gap-4 p-4 bg-gray-950/60 border border-gray-800 rounded-xl group hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs text-gray-600 font-mono w-5 flex-shrink-0">{idx + 1}</span>
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.sku} className="w-10 h-10 rounded bg-gray-900 border border-gray-800 object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0 text-gray-700">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 ml-2">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {variationLabel(v, productAttributes)}
                    </p>
                    {v.sku && (
                      <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {v.sku}</p>
                    )}
                    {/* Attribute pills */}
                    {v.variation_attribute_values?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {v.variation_attribute_values.map((vav: any) => (
                          <span key={vav.attribute_value_id}
                            className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400">
                            {vav.color_hex || vav.attribute_values?.color_hex ? (
                              <span className="w-2.5 h-2.5 rounded-full border border-gray-600"
                                style={{ backgroundColor: vav.color_hex || vav.attribute_values?.color_hex }} />
                            ) : null}
                            {vav.attribute_values?.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                  {v.sale_price ? (
                    <div className="text-right">
                      <span className="text-white font-medium">${v.sale_price}</span>
                      <span className="text-gray-600 line-through ml-1 text-xs">${v.regular_price}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300">{v.regular_price ? `$${v.regular_price}` : '—'}</span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    v.stock_status === 'instock' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {v.stock_status === 'instock'
                      ? `In Stock${v.stock_quantity !== null ? ` (${v.stock_quantity})` : ''}`
                      : 'Out of Stock'}
                  </span>
                  <button 
                    onClick={() => {
                      setEditingVarId(v.id);
                      setEditVar({ ...v });
                    }}
                    className="p-2 bg-gray-800 hover:bg-indigo-500/20 hover:text-indigo-400 text-gray-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteVariation(v.id)}
                    className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen} 
        onClose={() => {
          setIsMediaPickerOpen(false);
          setActiveMediaTarget(null);
        }} 
        onSelect={(url) => {
          if (activeMediaTarget === 'new') {
            setNewVar((p: any) => ({ ...p, image_url: url }));
          } else if (activeMediaTarget === 'edit') {
            setEditVar((p: any) => ({ ...p, image_url: url }));
          }
        }} 
      />
    </div>
  );
}
