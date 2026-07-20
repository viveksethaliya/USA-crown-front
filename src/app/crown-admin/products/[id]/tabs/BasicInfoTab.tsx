export default function BasicInfoTab({ product, onChange, brands }: { product: any, onChange: (field: string, value: any) => void, brands: any[] }) {
  const inputCls = "w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2.5 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all";
  const labelCls = "block text-sm font-medium text-[#312f2c]/60 mb-1";
  const sectionCls = "bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl p-6 space-y-5";
  const sectionTitleCls = "text-xs font-semibold text-[#312f2c]/45 uppercase tracking-wider pb-2 border-b border-[#312f2c]/8";

  return (
    <div className="space-y-6">
      {/* Core Fields */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Core Details</h3>
        <div>
          <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
          <input type="text" value={product.name} onChange={(e) => onChange('name', e.target.value)} className={inputCls} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>URL Slug <span className="text-red-500">*</span></label>
            <input type="text" value={product.slug} onChange={(e) => onChange('slug', e.target.value)} className={`${inputCls} font-mono text-sm text-[#312f2c]/60`} required />
          </div>
          <div>
            <label className={labelCls}>Product Type</label>
            <select value={product.type} onChange={(e) => onChange('type', e.target.value)} className={inputCls}>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">Grouped</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Measurement Unit</label>
            <select value={product.measurement_type || 'none'} onChange={(e) => onChange('measurement_type', e.target.value)} className={inputCls}>
              <option value="none">Piece (PC)</option>
              <option value="inch">Inch</option>
              <option value="plate">Plate</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>SKU</label>
            <input type="text" value={product.sku} onChange={(e) => onChange('sku', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Collection</label>
            <select value={product.brand_id} onChange={(e) => onChange('brand_id', e.target.value ? parseInt(e.target.value) : null)} className={inputCls}>
              <option value="">No Collection</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Short Description</label>
          <textarea rows={2} value={product.short_description} onChange={(e) => onChange('short_description', e.target.value)} className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={labelCls}>Full Description</label>
          <textarea rows={6} value={product.description} onChange={(e) => onChange('description', e.target.value)} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Pricing</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { field: 'regular_price', label: 'Regular Price ($)' },
            { field: 'sale_price', label: 'Sale Price ($)' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <input type="number" step="0.01" value={product[field]} onChange={(e) => onChange(field, e.target.value)} className={inputCls} />
            </div>
          ))}
          <div>
            <label className={labelCls}>Sale Start</label>
            <input type="date" value={product.sale_start} onChange={(e) => onChange('sale_start', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Sale End</label>
            <input type="date" value={product.sale_end} onChange={(e) => onChange('sale_end', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tax Status</label>
            <select value={product.tax_status} onChange={(e) => onChange('tax_status', e.target.value)} className={inputCls}>
              <option value="taxable">Taxable</option>
              <option value="shipping">Shipping Only</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tax Class</label>
            <input type="text" value={product.tax_class} placeholder="e.g. reduced-rate" onChange={(e) => onChange('tax_class', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Inventory</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Stock Status</label>
            <select value={product.stock_status} onChange={(e) => onChange('stock_status', e.target.value)} className={inputCls}>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
              <option value="onbackorder">On Backorder</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Quantity</label>
            <input type="number" value={product.stock_quantity} onChange={(e) => onChange('stock_quantity', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Low Stock Alert</label>
            <input type="number" value={product.low_stock_amount} onChange={(e) => onChange('low_stock_amount', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {[
            { field: 'backorders_allowed', label: 'Allow Backorders' },
            { field: 'sold_individually', label: 'Sold Individually' },
            { field: 'is_featured', label: 'Featured Product' },
            { field: 'allow_reviews', label: 'Allow Reviews' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 text-sm text-[#312f2c]/65 cursor-pointer">
              <input type="checkbox" checked={product[field]} onChange={(e) => onChange(field, e.target.checked)} className="w-4 h-4 rounded border-[#312f2c]/20 accent-[#d1a054]" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Shipping (Jewelry Dimensions)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { field: 'weight_g', label: 'Weight (g)', step: '0.0001' },
            { field: 'length_in', label: 'Length (in)', step: '0.0001' },
            { field: 'width_in', label: 'Width (in)', step: '0.001' },
            { field: 'height_in', label: 'Height (in)', step: '0.001' },
          ].map(({ field, label, step }) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <input type="number" step={step} value={product[field]} onChange={(e) => onChange(field, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>Visibility</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Catalog Visibility</label>
            <select value={product.visibility} onChange={(e) => onChange('visibility', e.target.value)} className={inputCls}>
              <option value="visible">Visible (shop + search)</option>
              <option value="catalog">Catalog Only</option>
              <option value="search">Search Only</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Purchase Note</label>
          <textarea rows={2} value={product.purchase_note} onChange={(e) => onChange('purchase_note', e.target.value)} placeholder="Optional note sent to customer after purchase" className={`${inputCls} resize-none`} />
        </div>
      </div>
    </div>
  );
}
