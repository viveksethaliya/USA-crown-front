export default function BasicInfoTab({ product, onChange, brands }: { product: any, onChange: (field: string, value: any) => void, brands: any[] }) {
  return (
    <div className="space-y-6">
      {/* Core Fields */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Core Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Product Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL Slug <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => onChange('slug', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-gray-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Product Type</label>
            <select
              value={product.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">Grouped</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
            <input
              type="text"
              value={product.sku}
              onChange={(e) => onChange('sku', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Brand</label>
            <select
              value={product.brand_id}
              onChange={(e) => onChange('brand_id', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="">No Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Short Description</label>
          <textarea
            rows={2}
            value={product.short_description}
            onChange={(e) => onChange('short_description', e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Full Description</label>
          <textarea
            rows={6}
            value={product.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pricing</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Regular Price ($)</label>
            <input type="number" step="0.01" value={product.regular_price}
              onChange={(e) => onChange('regular_price', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sale Price ($)</label>
            <input type="number" step="0.01" value={product.sale_price}
              onChange={(e) => onChange('sale_price', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sale Start</label>
            <input type="date" value={product.sale_start}
              onChange={(e) => onChange('sale_start', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sale End</label>
            <input type="date" value={product.sale_end}
              onChange={(e) => onChange('sale_end', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tax Status</label>
            <select value={product.tax_status} onChange={(e) => onChange('tax_status', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
              <option value="taxable">Taxable</option>
              <option value="shipping">Shipping Only</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tax Class</label>
            <input type="text" value={product.tax_class} placeholder="e.g. reduced-rate"
              onChange={(e) => onChange('tax_class', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Inventory</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Stock Status</label>
            <select value={product.stock_status} onChange={(e) => onChange('stock_status', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
              <option value="onbackorder">On Backorder</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
            <input type="number" value={product.stock_quantity}
              onChange={(e) => onChange('stock_quantity', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Low Stock Alert</label>
            <input type="number" value={product.low_stock_amount}
              onChange={(e) => onChange('low_stock_amount', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
          </div>
        </div>
        <div className="flex gap-6">
          {[
            { field: 'backorders_allowed', label: 'Allow Backorders' },
            { field: 'sold_individually', label: 'Sold Individually' },
            { field: 'is_featured', label: 'Featured Product' },
            { field: 'allow_reviews', label: 'Allow Reviews' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={product[field]}
                onChange={(e) => onChange(field, e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-950 text-blue-500 focus:ring-blue-500" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Shipping (Jewelry Dimensions)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { field: 'weight_g', label: 'Weight (g)', step: '0.0001' },
            { field: 'length_in', label: 'Length (in)', step: '0.0001' },
            { field: 'width_in', label: 'Width (in)', step: '0.001' },
            { field: 'height_in', label: 'Height (in)', step: '0.001' },
          ].map(({ field, label, step }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
              <input type="number" step={step} value={product[field]}
                onChange={(e) => onChange(field, e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Visibility</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Catalog Visibility</label>
            <select value={product.visibility} onChange={(e) => onChange('visibility', e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
              <option value="visible">Visible (shop + search)</option>
              <option value="catalog">Catalog Only</option>
              <option value="search">Search Only</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Purchase Note</label>
          <textarea rows={2} value={product.purchase_note}
            onChange={(e) => onChange('purchase_note', e.target.value)}
            placeholder="Optional note sent to customer after purchase"
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none" />
        </div>
      </div>
    </div>
  );
}
