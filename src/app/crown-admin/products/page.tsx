'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Package, Loader2, Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight, Download, Upload, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, Pagination } from '@/types/admin';

import { ADMIN_API as API } from '@/lib/config';

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
          fetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API}/tags`, { headers: { 'Authorization': `Bearer ${token}` } })
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

      const res = await fetch(`${API}/products?${params}`, {
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
      await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProducts(pagination.page);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/products/export`, {
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
    const res = await fetch(`${API}/products/template`, {
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
      const res = await fetch(`${API}/products/import`, {
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

  return (
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
            <button onClick={() => setImportResult(null)} className="text-[#312f2c]/40 hover:text-[#312f2c] ml-4">✕</button>
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
                          {product.is_published ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-[#312f2c]/30" />
                          )}
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
  );
}
