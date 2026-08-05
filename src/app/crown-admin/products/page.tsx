'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Package, Loader2, Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight, Download, Upload, FileText, Eye, EyeOff, HelpCircle, X, CheckCheck, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, Pagination } from '@/types/admin';

import { ADMIN_API as API } from '@/lib/config';
import { adminFetch } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 100, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showImportHelp, setShowImportHelp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchFilters = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      try {
        const [catRes, tagRes] = await Promise.all([
          adminFetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          adminFetch(`${API}/tags`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (catRes.ok) {
          const catJson = await catRes.json();
          setCategories(catJson.data || catJson || []);
        }
        if (tagRes.ok) {
          const tagJson = await tagRes.json();
          setTags(tagJson.data || tagJson || []);
        }
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchProducts = useCallback(async (page: number = 1, append: boolean = false) => {
    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: '100' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter) params.set('type', typeFilter);
      if (publishFilter !== '') params.set('is_published', publishFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (stockFilter) params.set('stock_status', stockFilter);

      const res = await adminFetch(`${API}/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();

      if (append) {
        setProducts(prev => {
          const newIds = new Set((json.data || []).map((p: any) => p.id));
          return [...prev.filter(p => !newIds.has(p.id)), ...(json.data || [])];
        });
      } else {
        setProducts(json.data || []);
      }

      setPagination(json.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load products');
    } finally {
      if (append) setIsFetchingMore(false);
      else setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, publishFilter, categoryFilter, tagFilter, stockFilter]);

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;

    if (scrollHeight - scrollTop <= clientHeight + 150) {
      if (!isLoading && !isFetchingMore && pagination.page < pagination.totalPages) {
        fetchProducts(pagination.page + 1, true);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all variations and images.`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await adminFetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete product');
      }
      fetchProducts(pagination.page);
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleTogglePublish = async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_published: newValue } : p));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`${API}/products/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_published: newValue })
      });
      if (!res.ok) {
        // Revert on failure
        setProducts(prev => prev.map(p => p.id === id ? { ...p, is_published: currentValue } : p));
        toast.error('Failed to update product visibility');
      } else {
        toast.success(newValue ? 'Product published' : 'Product hidden');
      }
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_published: currentValue } : p));
      toast.error('Failed to update product visibility');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`${API}/products/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Products exported successfully!');
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await adminFetch(`${API}/products/template`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminFetch(`${API}/products/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (res.ok) {
        setImportResult(json);
        toast.success(json.message);
        fetchProducts(1);
      } else {
        toast.error(json.error || 'Import failed.');
      }
    } catch (error) {
      toast.error('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const stockBadge = (status?: string) => {
    if (status === 'instock') return 'bg-[#d1a054]/10 text-[#d1a054] border border-[#d1a054]/20';
    if (status === 'outofstock') return 'bg-[#312f2c]/8 text-[#312f2c]/60 border border-[#312f2c]/15';
    return 'bg-[#312f2c]/5 text-[#312f2c]/50 border border-[#312f2c]/10';
  };

  const typeBadge = (type: string) => {
    return 'bg-[#312f2c]/6 text-[#312f2c]/60 border border-[#312f2c]/10';
  };

  const categoryOptions = useMemo(() => {
    const catMap = new Map();
    categories.forEach(c => catMap.set(c.id, { ...c, children: [] }));
    const rootCats: any[] = [];
    categories.forEach(c => {
      if (c.parent_id && catMap.has(c.parent_id)) {
        catMap.get(c.parent_id).children.push(catMap.get(c.id));
      } else {
        rootCats.push(catMap.get(c.id));
      }
    });
    const options: { id: string; name: string; formattedName: string }[] = [];
    const traverse = (node: any, depth: number) => {
      const prefix = depth > 0 ? '— '.repeat(depth) : '';
      options.push({ id: node.id, name: node.name, formattedName: `${prefix}${node.name}` });
      node.children.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).forEach((child: any) => traverse(child, depth + 1));
    };
    rootCats.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).forEach(root => traverse(root, 0));
    return options;
  }, [categories]);



  // Render modal via portal so it escapes all overflow/transform ancestors
  const importHelpPortal =
    showImportHelp && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="absolute inset-0 bg-[#312f2c]/50 backdrop-blur-sm" onClick={() => setShowImportHelp(false)} />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#f4f2eb] rounded-3xl shadow-2xl border border-white/60">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#f4f2eb]/95 backdrop-blur-md border-b border-[#312f2c]/10 px-8 py-5 flex items-start justify-between rounded-t-3xl">
                <div>
                  <h2 className="text-xl font-bold text-[#312f2c]">CSV Import Guide</h2>
                  <p className="text-[#312f2c]/55 text-sm mt-0.5">How to build a compatible CSV for bulk product upload</p>
                </div>
                <button onClick={() => setShowImportHelp(false)} className="p-2 text-[#312f2c]/40 hover:text-[#312f2c] hover:bg-[#312f2c]/8 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-8">

                {/* Quick Start */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#d1a054] flex items-center justify-center text-white text-xs font-bold">1</div>
                    <h3 className="font-bold text-[#312f2c]">Quick Start</h3>
                  </div>
                  <div className="bg-[#d1a054]/8 border border-[#d1a054]/20 rounded-2xl p-4 text-sm text-[#312f2c]/80 space-y-2">
                    <p>Click <strong>Template</strong> to download a ready-made example CSV with a variable parent product and one variation row. Edit that file, add your rows, then click <strong>Import CSV</strong>.</p>
                    <p>If you are migrating from WooCommerce, export your products from WP → WooCommerce → Products → Export and upload that CSV directly — no changes needed.</p>
                  </div>
                </section>

                {/* File format */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#d1a054] flex items-center justify-center text-white text-xs font-bold">2</div>
                    <h3 className="font-bold text-[#312f2c]">File Format</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-[#312f2c]/75">
                    {[
                      ['File type', 'UTF-8 encoded CSV (.csv). Excel exports as CSV UTF-8 work fine.'],
                      ['First row', 'Must be the column header row. Do not add blank rows above it.'],
                      ['Delimiter', 'Comma (,). Do not use semicolons or tabs.'],
                      ['Max file size', 'No hard limit, but very large files (50k+ rows) may time out. Split into batches of 5,000 rows if needed.'],
                      ['Re-import safety', 'Safe to re-import the same file. Rows with an ID column are upserted — they update the existing product without creating duplicates.'],
                    ].map(([label, desc]) => (
                      <li key={label} className="flex gap-3">
                        <span className="shrink-0 font-bold text-[#312f2c] w-32">{label}</span>
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Product types */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#d1a054] flex items-center justify-center text-white text-xs font-bold">3</div>
                    <h3 className="font-bold text-[#312f2c]">Product Types (Type column)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { type: 'simple', desc: 'A single standalone product with one price and one stock level.' },
                      { type: 'variable', desc: 'A parent product with multiple variations (e.g. different sizes, metals). Must be followed by variation rows.' },
                      { type: 'variation', desc: 'A child row that belongs to a variable parent. Set the Parent column to id:PARENT_ID.' },
                    ].map(({ type, desc }) => (
                      <div key={type} className="bg-white/60 border border-[#312f2c]/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <code className="text-xs font-bold bg-[#312f2c]/8 px-2 py-0.5 rounded-lg">{type}</code>
                        </div>
                        <p className="text-xs text-[#312f2c]/65">{desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Parent / variation structure */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#d1a054] flex items-center justify-center text-white text-xs font-bold">4</div>
                    <h3 className="font-bold text-[#312f2c]">Variable Products — Row Structure</h3>
                  </div>
                  <div className="bg-[#312f2c]/5 border border-[#312f2c]/10 rounded-2xl p-4 font-mono text-xs space-y-1 overflow-x-auto">
                    <p className="text-[#d1a054] font-bold"># Parent row</p>
                    <p>ID,Type,Name,SKU,Regular price,Categories,Attribute 1 name,Attribute 1 value(s)</p>
                    <p>1001,variable,Gold Ring,,, Rings &gt; Gold,Metal Type,&quot;14K Yellow Gold, 14K White Gold&quot;</p>
                    <p className="mt-2 text-[#d1a054] font-bold"># Variation rows (one per combination)</p>
                    <p>ID,Type,Name,SKU,Regular price,Parent,Attribute 1 name,Attribute 1 value(s)</p>
                    <p>2001,variation,Gold Ring - 14K Yellow Gold,GR-YG,49.99,id:1001,Metal Type,14K Yellow Gold</p>
                    <p>2002,variation,Gold Ring - 14K White Gold,GR-WG,54.99,id:1001,Metal Type,14K White Gold</p>
                  </div>
                  <p className="text-xs text-[#312f2c]/55 mt-2">The <strong>Parent</strong> column on variation rows must be <code className="bg-[#312f2c]/8 px-1 rounded">id:PARENT_ID</code> where PARENT_ID is the value in the <strong>ID</strong> column of the parent row.</p>
                </section>

                {/* Supported columns */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#d1a054] flex items-center justify-center text-white text-xs font-bold">5</div>
                    <h3 className="font-bold text-[#312f2c]">Supported Columns</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      ['ID', 'WooCommerce product ID used as the upsert key. Optional for new products.'],
                      ['Type', 'simple / variable / variation'],
                      ['Name', 'Product title. Required for parent rows.'],
                      ['SKU', 'Stock keeping unit. Optional.'],
                      ['GTIN, UPC, EAN, or ISBN', 'Global trade item number.'],
                      ['Regular price', 'Numeric, e.g. 49.99'],
                      ['Sale price', 'Numeric. Leave blank for no sale.'],
                      ['Date sale price starts / ends', 'ISO date, e.g. 2025-01-01'],
                      ['Published', '1 = live, 0 = draft'],
                      ['Is featured?', '1 = yes'],
                      ['Visibility in catalog', 'visible / catalog / search / hidden'],
                      ['In stock?', '1 = in stock, 0 = out of stock'],
                      ['Stock', 'Quantity on hand. Numeric.'],
                      ['Low stock amount', 'Alert threshold.'],
                      ['Backorders allowed?', '1 = yes. Combined with Stock to set onbackorder status.'],
                      ['Weight (g)', 'Numeric grams.'],
                      ['Length / Width / Height (in)', 'Numeric inches.'],
                      ['Categories', 'Comma-separated paths, e.g. Rings > Gold Rings, Bracelets'],
                      ['Tags', 'Comma-separated tag names.'],
                      ['Brands', 'Single brand name. Created if it does not exist.'],
                      ['Images', 'Comma-separated image URLs. Stored as-is — not re-uploaded.'],
                      ['Attribute 1-14 name', 'Attribute name, e.g. Metal Type'],
                      ['Attribute 1-14 value(s)', 'On parent: all values comma-separated. On variation: one value.'],
                      ['Attribute 1-14 visible', '1 = show on product page'],
                      ['Cross-sells', 'Comma-separated id:XXXXX tokens.'],
                      ['Upsells', 'Comma-separated id:XXXXX tokens.'],
                      ['Parent', 'variation rows only: id:PARENT_ID'],
                      ['Position', 'Sort order. Numeric.'],
                      ['Product Swatch Type', 'color / image / text etc.'],
                    ].map(([col, desc]) => (
                      <div key={col} className="flex items-start gap-2 bg-white/50 border border-[#312f2c]/8 rounded-xl px-3 py-2.5">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="text-[11px] font-bold text-[#312f2c]">{col}</code>
                          <p className="text-[11px] text-[#312f2c]/55 mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Not supported */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-[#312f2c]">Not Supported / Ignored Columns</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      ['Tax status / Tax class', 'Saved to the database but not enforced during checkout calculations.'],
                      ['Shipping class', 'Column is read but shipping class logic is not implemented.'],
                      ['Download limit / Download expiry days', 'Downloadable products are not supported.'],
                      ['Grouped products', 'Grouped product type is accepted but grouped product linking is not implemented.'],
                      ['External URL / Button text', 'External products are not supported.'],
                      ['Product Swatch Type Options', 'Column is ignored. Configure swatches manually after import.'],
                      ['Purchase note', 'Stored in the database but not displayed to customers at this time.'],
                      ['Sold individually?', 'Stored in the database but cart does not enforce single-unit limits.'],
                      ['Image re-hosting', 'Images are stored as the original URL, not copied to your storage bucket. If the source URL goes offline the image will break.'],
                    ].map(([col, desc]) => (
                      <div key={col} className="flex items-start gap-3 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="text-[11px] font-bold text-amber-800">{col}</code>
                          <p className="text-[11px] text-amber-700/80 mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tips */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-[#d1a054]" />
                    <h3 className="font-bold text-[#312f2c]">Tips & Common Mistakes</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-[#312f2c]/75">
                    {[
                      'Keep the ID column populated when re-importing. Without it every row creates a new product instead of updating the existing one.',
                      'Variation rows must come after their parent row in the file, but the importer will also find parents already in the database.',
                      'Category paths use " > " (space â€º space). Example: Rings > Gold Rings. New categories are created automatically.',
                      'For Backorders, set Backorders allowed? = 1 and leave Stock blank or 0. The importer will set stock_status to onbackorder.',
                      'Boolean columns accept 1 (yes) or 0 (no). Any other value defaults to the column default.',
                      'Image URLs must be publicly accessible. Signed or expiring URLs will break once the token expires.',
                      'For large catalogs (10,000+ rows), split into batches of 5,000 rows per file to avoid request timeouts.',
                    ].map((tip, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#d1a054]/15 border border-[#d1a054]/30 flex items-center justify-center text-[#d1a054] text-[10px] font-bold">{i + 1}</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>

              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-[#f4f2eb]/95 backdrop-blur-md border-t border-[#312f2c]/10 px-8 py-4 flex items-center justify-between rounded-b-3xl">
                <p className="text-xs text-[#312f2c]/40">Use the <strong>Template</strong> button to download a working example file.</p>
                <button onClick={() => setShowImportHelp(false)} className="px-5 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-xl text-sm font-bold transition-colors">
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {importHelpPortal}
      <div className="flex flex-col h-full gap-6 -m-4 sm:m-0">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Products</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">{pagination.total} products total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleDownloadTemplate}
            title="Download import template CSV"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-white/60 text-[#312f2c]/70 border border-white/60 shadow-sm rounded-lg text-sm transition-all font-medium"
          >
            <FileText className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-white/60 text-[#312f2c]/70 border border-white/60 shadow-sm rounded-lg text-sm transition-all font-medium disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import CSV
          </button>
          <button
            onClick={() => setShowImportHelp(true)}
            title="CSV import guide"
            className="flex items-center gap-1.5 px-2.5 py-2 bg-white hover:bg-white/60 text-[#d1a054] border border-white/60 shadow-sm rounded-lg text-sm transition-all font-medium"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-white/60 text-[#312f2c]/70 border border-white/60 shadow-sm rounded-lg text-sm transition-all font-medium disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <Link
            href="/crown-admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#d1a054] hover:bg-[#c29148] hover:-translate-y-0.5 hover:shadow-lg text-[#f0ede5] rounded-xl font-bold transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {importResult && (
        <div className="mx-4 sm:mx-0 shrink-0 bg-white/60 border border-white/80 rounded-2xl shadow-sm p-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[#312f2c]">{importResult.message}</p>
            <button onClick={() => setImportResult(null)} className="text-[#312f2c]/40 hover:text-[#312f2c] ml-4">âœ•</button>
          </div>
          {importResult.errors?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600 font-medium text-xs">{importResult.errors.length} errors — click to expand</summary>
              <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {importResult.errors.map((e: any, i: number) => (
                  <li key={i} className="text-xs text-red-700 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-medium">
                    <strong>{e.name || 'Row'}:</strong> {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Main Glass Panel */}
      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm flex flex-col overflow-hidden p-4 sm:p-6">

        {/* Filters Row */}
        <div className="shrink-0 flex flex-col gap-3 mb-6">
          <div className="flex items-center bg-white/60 p-1.5 border border-white/60 rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#d1a054]/40">
            <Search className="w-5 h-5 text-[#312f2c]/40 ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#312f2c] font-medium placeholder:text-[#312f2c]/40 px-3 py-1.5 w-full outline-none text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[#312f2c]/40 hidden md:block mr-1" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/60 border border-white/60 shadow-sm rounded-xl px-3 py-2 text-[#312f2c] font-medium text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px] transition-all"
            >
              <option value="">All Categories</option>
              {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.formattedName}</option>)}
            </select>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-white/60 border border-white/60 shadow-sm rounded-xl px-3 py-2 text-[#312f2c] font-medium text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px] transition-all"
            >
              <option value="">All Tags</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white/60 border border-white/60 shadow-sm rounded-xl px-3 py-2 text-[#312f2c] font-medium text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px] transition-all"
            >
              <option value="">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">Grouped</option>
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-white/60 border border-white/60 shadow-sm rounded-xl px-3 py-2 text-[#312f2c] font-medium text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px] transition-all"
            >
              <option value="">All Stock Status</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
              <option value="onbackorder">On Backorder</option>
            </select>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value)}
              className="bg-white/60 border border-white/60 shadow-sm rounded-xl px-3 py-2 text-[#312f2c] font-medium text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px] transition-all"
            >
              <option value="">All Visibility</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white/50 border border-white/60 rounded-2xl shadow-inner relative"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="sticky top-0 bg-[#f4f2eb] z-20 shadow-sm">
                <tr className="border-b border-[#312f2c]/10 text-[10px] font-bold uppercase tracking-widest text-[#312f2c]/50">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4 hidden md:table-cell">SKU</th>
                  <th className="p-4 hidden lg:table-cell">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 hidden md:table-cell">Type</th>
                  <th className="p-4 hidden lg:table-cell">Tags</th>
                  <th className="p-4">Published</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/5">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-[#312f2c]/40 font-medium">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      No products found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  <>
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-white/60 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="relative group/image">
                              <div className="w-12 h-12 rounded-xl bg-white border border-[#312f2c]/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm cursor-pointer">
                                {product.product_images?.[0]?.url ? (
                                  <img src={product.product_images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-[#312f2c]/20" />
                                )}
                              </div>

                              {/* Large Hover Popup */}
                              {product.product_images?.[0]?.url && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-[99] opacity-0 invisible group-hover/image:opacity-100 group-hover/image:visible transition-all duration-200 pointer-events-none w-64 h-64 bg-white/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white p-2">
                                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                                    <img src={product.product_images[0].url} alt={product.name} className="w-full h-full object-contain" />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-bold text-[#312f2c] text-sm">{product.name}</p>
                              {product.brands && (
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#312f2c]/40 mt-1">{product.brands.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#312f2c]/60 font-mono text-xs hidden md:table-cell font-medium">
                          {product.sku || '-'}
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          {product.sale_price ? (
                            <div className="flex flex-col">
                              <span className="text-[#312f2c] font-bold text-sm">${product.sale_price}</span>
                              <span className="text-[#312f2c]/40 line-through text-xs font-medium">${product.regular_price}</span>
                            </div>
                          ) : (
                            <span className="text-[#312f2c] font-bold text-sm">${product.regular_price || '—'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${stockBadge(product.stock_status)}`}>
                            {product.stock_status === 'instock' ? 'In Stock' :
                              product.stock_status === 'outofstock' ? 'Out of Stock' : 'Backorder'}
                            {product.stock_quantity !== null && ` (${product.stock_quantity})`}
                          </span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${typeBadge(product.type)}`}>
                            {product.type}
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell max-w-[200px]">
                          <div className="flex flex-wrap gap-1.5">
                            {product.product_tags && product.product_tags.length > 0 ? (
                              product.product_tags.map((pt: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-white/80 border border-[#312f2c]/10 text-[#312f2c]/60 rounded-md text-[10px] uppercase font-bold shadow-sm whitespace-nowrap">
                                  {pt.tags?.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#312f2c]/30 text-xs font-bold">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleTogglePublish(product.id, product.is_published ?? true)}
                            title={product.is_published ? 'Click to hide product' : 'Click to publish product'}
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a054] ${
                              product.is_published ? 'bg-emerald-500' : 'bg-[#312f2c]/20'
                            }`}
                          >
                            <span
                              className={`inline-block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                product.is_published ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`block text-[10px] font-bold mt-1 uppercase tracking-wide ${
                            product.is_published ? 'text-emerald-600' : 'text-[#312f2c]/35'
                          }`}>
                            {product.is_published ? 'Live' : 'Hidden'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/crown-admin/products/${product.id}`}
                              className="p-2 bg-white hover:bg-[#d1a054] text-[#312f2c]/60 hover:text-white border border-[#312f2c]/10 hover:border-[#d1a054] rounded-lg transition-all shadow-sm"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="p-2 bg-white hover:bg-red-500 text-[#312f2c]/60 hover:text-white border border-[#312f2c]/10 hover:border-red-500 rounded-lg transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Infinite Scroll Loader */}
                    {isFetchingMore && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center">
                          <div className="flex items-center justify-center gap-3 text-[#312f2c]/50 font-bold text-sm">
                            <Loader2 className="w-5 h-5 animate-spin text-[#d1a054]" />
                            Loading more products...
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
