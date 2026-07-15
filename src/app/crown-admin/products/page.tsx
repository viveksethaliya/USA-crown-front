'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Package, Loader2, Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight, Download, Upload, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, Pagination } from '@/types/admin';

import { ADMIN_API as API } from '@/lib/config';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
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
      } catch(err) {
        console.error('Failed to load filters', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchProducts = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
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
      setProducts(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, publishFilter, categoryFilter, tagFilter, stockFilter]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Products</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">{pagination.total} products total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden file input */}
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleDownloadTemplate}
            title="Download import template CSV"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#312f2c]/5 text-[#312f2c]/60 border border-[#312f2c]/10 rounded-lg text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#312f2c]/5 text-[#312f2c]/60 border border-[#312f2c]/10 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import CSV
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#312f2c]/5 text-[#312f2c]/60 border border-[#312f2c]/10 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <Link
            href="/crown-admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg shadow-sm transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div className="bg-white border border-[#312f2c]/10 rounded-xl p-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium text-[#312f2c]">{importResult.message}</p>
            <button onClick={() => setImportResult(null)} className="text-[#312f2c]/40 hover:text-[#312f2c] ml-4">✕</button>
          </div>
          {importResult.errors?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600 text-xs">{importResult.errors.length} errors — click to expand</summary>
              <ul className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                {importResult.errors.map((e: any, i: number) => (
                  <li key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                    <strong>{e.name || 'Row'}:</strong> {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center bg-white/60 p-2 border border-[#312f2c]/10 rounded-xl">
          <Search className="w-5 h-5 text-[#312f2c]/35 ml-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-4 py-1 w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#312f2c]/35 hidden md:block" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px]"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px]"
          >
            <option value="">All Tags</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px]"
          >
            <option value="">All Types</option>
            <option value="simple">Simple</option>
            <option value="variable">Variable</option>
            <option value="grouped">Grouped</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px]"
          >
            <option value="">All Stock Status</option>
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
            <option value="onbackorder">On Backorder</option>
          </select>
          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value)}
            className="bg-white/60 border border-[#312f2c]/10 rounded-lg px-3 py-2 text-[#312f2c] text-sm focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none flex-1 min-w-[120px]"
          >
            <option value="">All Visibility</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#312f2c]/5 border-b border-[#312f2c]/10 text-xs uppercase tracking-wider text-[#312f2c]/40">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium hidden md:table-cell">SKU</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium hidden md:table-cell">Type</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Tags</th>
                  <th className="p-4 font-medium">Published</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312f2c]/8">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-[#312f2c]/40">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-[#312f2c]/4 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#312f2c]/8 flex items-center justify-center text-[#312f2c]/40 flex-shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#312f2c] text-sm leading-tight">{product.name}</p>
                            {product.brands && (
                              <p className="text-xs text-[#312f2c]/45 mt-0.5">{product.brands.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[#312f2c]/50 font-mono text-xs hidden md:table-cell">
                        {product.sku || '-'}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {product.sale_price ? (
                          <div>
                            <span className="text-[#312f2c] font-medium">${product.sale_price}</span>
                            <span className="text-[#312f2c]/35 line-through ml-2 text-sm">${product.regular_price}</span>
                          </div>
                        ) : (
                          <span className="text-[#312f2c]">${product.regular_price || '—'}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockBadge(product.stock_status)}`}>
                          {product.stock_status === 'instock' ? 'In Stock' :
                           product.stock_status === 'outofstock' ? 'Out of Stock' : 'Backorder'}
                          {product.stock_quantity !== null && ` (${product.stock_quantity})`}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge(product.type)}`}>
                          {product.type}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell max-w-[150px] truncate">
                        <div className="flex flex-wrap gap-1">
                          {product.product_tags && product.product_tags.length > 0 ? (
                            product.product_tags.map((pt: any, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 bg-[#312f2c]/5 text-[#312f2c]/70 rounded text-[10px] uppercase font-semibold">
                                {pt.tags?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#312f2c]/30 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {product.is_published ? (
                          <CheckCircle className="w-5 h-5 text-[#d1a054]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[#312f2c]/25" />
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Link
                          href={`/crown-admin/products/${product.id}`}
                          className="inline-flex p-2 bg-[#312f2c]/6 hover:bg-[#d1a054]/12 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 bg-[#312f2c]/6 hover:bg-red-500/10 hover:text-red-600 text-[#312f2c]/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#312f2c]/10">
                <p className="text-sm text-[#312f2c]/50">
                  Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchProducts(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 bg-[#312f2c]/6 text-[#312f2c]/50 hover:text-[#312f2c] rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="flex items-center px-3 text-sm text-[#312f2c]/50">
                    Page {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchProducts(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 bg-[#312f2c]/6 text-[#312f2c]/50 hover:text-[#312f2c] rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
