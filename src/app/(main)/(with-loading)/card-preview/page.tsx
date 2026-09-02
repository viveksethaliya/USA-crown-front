import React from 'react';
import Link from 'next/link';

// --- MOCK DATA ---
const MOCK_PRODUCTS = [
  {
    id: 1,
    sku: 'A-21',
    name: '3mm Die-Struck Block Initial',
    slug: '3mm-die-struck-block-initial',
    image: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/wc-import/pc-247-a216977faf.jpg',
    swatchAttributes: [{ type: 'color', value: '14Y', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-14y.webp' }],
    sizeRanges: [],
    priceRange: '$12.50',
    tags: [{ id: 1, name: 'best-seller' }],
    type: 'simple'
  },
  {
    id: 2,
    sku: 'CH-100-SUPER-LONG-SKU',
    name: 'Extremely Long Product Name That Will Wrap To Multiple Lines And Test Our Layout constraints',
    slug: 'extremely-long-name',
    image: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/wc-import/pc-103-b1316431c7.jpg',
    swatchAttributes: [
      { type: 'color', value: '14Y', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-14y.webp' },
      { type: 'color', value: '14W', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-14w.webp' },
      { type: 'color', value: '14P', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-14p.webp' },
      { type: 'color', value: '18Y', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-18y.webp' },
      { type: 'color', value: '18W', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-18w.webp' },
      { type: 'color', value: 'PLAT', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-plat.webp' },
      { type: 'color', value: 'SS', color_hex: '#cccccc' },
      { type: 'color', value: '10Y', image_url: 'https://wwzlxdqcuxjywpwmpllt.supabase.co/storage/v1/object/public/storage/attributes/metal-10y.webp' },
    ],
    sizeRanges: [{ name: 'Size', range: '5 - 10' }, { name: 'Length', range: '16 - 24' }],
    priceRange: '$150.00 - $350.00',
    tags: [{ id: 2, name: 'new' }],
    type: 'variable'
  }
];

// --- DIRECTION 1: "The Ledger" (Horizontal Spec Split) ---
const CardDirection1 = ({ product, isAuthenticated }: any) => {
  const visibleSwatches = product.swatchAttributes?.slice(0, 6) || [];
  const extraSwatches = Math.max(0, (product.swatchAttributes?.length || 0) - 6);
  
  return (
    <div className="group relative flex flex-col h-full bg-white border border-[#e2e8f0] rounded-md overflow-hidden hover:border-[#1a202c] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Outer Click Overlay */}
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`}></Link>
      
      {/* Image Block */}
      <div className="relative w-full aspect-square bg-[#f8fafc] p-3 shrink-0 border-b border-[#f1f5f9]">
        {product.tags?.[0] && (
          <span className="absolute top-2 left-2 z-20 bg-[#1a202c] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
            {product.tags[0].name.replace('-', ' ')}
          </span>
        )}
        <img 
          src={product.image} 
          alt={product.name} 
          loading="lazy" 
          decoding="async"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
        />
      </div>

      {/* Content Block */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-1 text-[11px] font-mono text-[#64748b] font-medium tracking-wider">{product.sku}</div>
          <h3 className="text-[13px] font-bold text-[#1e293b] leading-tight mb-3 group-hover:text-[#0f172a] group-hover:underline decoration-1 underline-offset-2">{product.name}</h3>
          
          <div className="space-y-2 mt-auto">
            {product.swatchAttributes?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap relative z-20">
                {visibleSwatches.map((s: any) => (
                  <Link key={s.value} href={`/products/${product.slug}?metal=${s.value}`} title={s.value} className="relative group/swatch rounded-[2px] border border-[#cbd5e1] hover:border-[#1a202c] overflow-hidden w-6 h-6 flex-shrink-0" aria-label={`${s.value} - view metal`}>
                    <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: s.image_url ? `url(${s.image_url})` : 'none', backgroundColor: s.color_hex || '#f1f5f9' }} />
                    <span className="sr-only">{s.value}</span>
                  </Link>
                ))}
                {extraSwatches > 0 && (
                  <div className="w-6 h-6 rounded-[2px] bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[9px] font-bold text-[#64748b]">
                    +{extraSwatches}
                  </div>
                )}
              </div>
            )}
            
            {product.sizeRanges?.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-[#f1f5f9]">
                {product.sizeRanges.map((sz: any) => (
                  <div key={sz.name} className="text-[11px] text-[#475569]"><span className="font-semibold text-[#1e293b]">{sz.name}:</span> {sz.range}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action / Price Bottom Block */}
        <div className="mt-4 pt-3 border-t border-[#e2e8f0] relative z-20 flex items-center justify-between">
          {isAuthenticated ? (
            <div className="text-[14px] font-bold text-[#1a202c]">{product.priceRange}</div>
          ) : (
            <Link href="/login" className="text-[11px] font-bold text-[#1e40af] hover:text-[#1e3a8a] flex items-center gap-1 group/login">
              Login to view pricing <span className="group-hover/login:translate-x-0.5 transition-transform">→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// --- DIRECTION 2: "The Spec Sheet" (Vertical Data List) ---
const CardDirection2 = ({ product, isAuthenticated }: any) => {
  const visibleSwatches = product.swatchAttributes?.slice(0, 6) || [];
  const extraSwatches = Math.max(0, (product.swatchAttributes?.length || 0) - 6);

  return (
    <div className="group relative flex flex-col h-full bg-[#fafafa] border-b-2 border-transparent hover:border-[#1a202c] hover:bg-white transition-colors duration-300">
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`}></Link>
      
      <div className="w-full aspect-[4/3] bg-white p-4 shrink-0 relative overflow-hidden">
        {product.tags?.[0] && (
          <span className="absolute top-0 right-0 z-20 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5">
            {product.tags[0].name.toUpperCase()}
          </span>
        )}
        <img 
          src={product.image} 
          alt={product.name} 
          loading="lazy" 
          decoding="async"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-[1.03] transition-transform duration-700 ease-out" 
        />
      </div>

      <div className="flex flex-col flex-1 px-4 py-3 border-t border-[#f0f0f0]">
        <div className="flex justify-between items-start mb-1.5 gap-2">
          <h3 className="text-[14px] font-semibold text-[#111] leading-snug group-hover:text-[#1e40af] transition-colors line-clamp-2">{product.name}</h3>
          <span className="text-[10px] font-mono font-bold text-[#888] bg-[#f0f0f0] px-1.5 py-0.5 rounded-sm whitespace-nowrap">{product.sku}</span>
        </div>
        
        <div className="flex-1 mt-3">
          <table className="w-full text-[11px]">
            <tbody>
              {product.swatchAttributes?.length > 0 && (
                <tr className="border-b border-[#f5f5f5]">
                  <td className="py-2 text-[#777] font-medium align-top w-[45px]">Metal</td>
                  <td className="py-2 relative z-20">
                    <div className="flex gap-1 flex-wrap">
                      {visibleSwatches.map((s: any) => (
                        <Link key={s.value} href={`/products/${product.slug}?metal=${s.value}`} className="group/sw border border-[#ddd] hover:border-[#333] w-5 h-5 block relative transition-colors" aria-label={s.value}>
                          <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: s.image_url ? `url(${s.image_url})` : 'none', backgroundColor: s.color_hex || '#f1f5f9' }} />
                        </Link>
                      ))}
                      {extraSwatches > 0 && <span className="text-[#888] text-[9px] self-center ml-0.5">+{extraSwatches}</span>}
                    </div>
                  </td>
                </tr>
              )}
              {product.sizeRanges?.map((sz: any) => (
                <tr key={sz.name} className="border-b border-[#f5f5f5] last:border-0">
                  <td className="py-2 text-[#777] font-medium align-top">{sz.name}</td>
                  <td className="py-2 font-medium text-[#333]">{sz.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-auto pt-4 relative z-20">
          {isAuthenticated ? (
            <div className="flex items-end justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#999] font-semibold">Wholesale</span>
              <span className="text-[15px] font-extrabold text-[#d97706] tracking-tight">{product.priceRange}</span>
            </div>
          ) : (
            <Link href="/login" className="block w-full text-center border border-[#1a202c] text-[#1a202c] text-[11px] font-bold py-2 hover:bg-[#1a202c] hover:text-white transition-colors">
              VIEW PRICING
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CardPreview() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-16">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-[#0f172a] mb-4">Product Card Redesign Proposal</h1>
          <p className="text-[#475569] max-w-2xl">
            Live preview of two design directions rendering the same product edge cases.
          </p>
        </div>

        {/* DIR 1 */}
        <div className="mb-20">
          <div className="mb-6 border-b border-[#cbd5e1] pb-4">
            <h2 className="text-2xl font-bold text-[#1e293b]">Direction 1: "The Ledger"</h2>
            <p className="text-[#64748b] mt-1 text-sm">Contained borders, horizontal spec flow, compact spacing, strong boundaries.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1200px]">
            {MOCK_PRODUCTS.map(p => <CardDirection1 key={`d1-${p.id}`} product={p} isAuthenticated={true} />)}
            {MOCK_PRODUCTS.map(p => <CardDirection1 key={`d1-anon-${p.id}`} product={p} isAuthenticated={false} />)}
          </div>
        </div>

        {/* DIR 2 */}
        <div>
          <div className="mb-6 border-b border-[#cbd5e1] pb-4">
            <h2 className="text-2xl font-bold text-[#1e293b]">Direction 2: "The Spec Sheet"</h2>
            <p className="text-[#64748b] mt-1 text-sm">Open bottom-bordered structure, tabular vertical specs, highly scannable SKU badge.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1200px]">
            {MOCK_PRODUCTS.map(p => <CardDirection2 key={`d2-${p.id}`} product={p} isAuthenticated={true} />)}
            {MOCK_PRODUCTS.map(p => <CardDirection2 key={`d2-anon-${p.id}`} product={p} isAuthenticated={false} />)}
          </div>
        </div>

      </div>
    </div>
  );
}
