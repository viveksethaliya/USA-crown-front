'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Package, Loader2, Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Pagination } from '@/types/admin';

const API = 'http://localhost:5000/api/admin';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter) params.set('type', typeFilter);
      if (publishFilter !== '') params.set('is_published', publishFilter);

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
  }, [debouncedSearch, typeFilter, publishFilter]);

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

  const stockBadge = (status?: string) => {
    if (status === 'instock') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (status === 'outofstock') return 'bg-red-500/10 text-red-400 border border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  const typeBadge = (type: string) => {
    if (type === 'variable') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (type === 'grouped') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-gray-700 text-gray-400 border border-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Products
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {pagination.total} products total
          </p>
        </div>
        <Link
          href="/crown-admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center bg-gray-900/50 p-2 border border-gray-800 rounded-xl backdrop-blur-sm">
          <Search className="w-5 h-5 text-gray-500 ml-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-white px-4 py-1 w-full outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="simple">Simple</option>
            <option value="variable">Variable</option>
            <option value="grouped">Grouped</option>
          </select>
          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium hidden md:table-cell">SKU</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium hidden md:table-cell">Type</th>
                  <th className="p-4 font-medium">Published</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm leading-tight">{product.name}</p>
                            {product.brands && (
                              <p className="text-xs text-gray-500 mt-0.5">{product.brands.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 font-mono text-xs hidden md:table-cell">
                        {product.sku || '-'}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {product.sale_price ? (
                          <div>
                            <span className="text-white font-medium">${product.sale_price}</span>
                            <span className="text-gray-600 line-through ml-2 text-sm">${product.regular_price}</span>
                          </div>
                        ) : (
                          <span className="text-white">${product.regular_price || '—'}</span>
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
                      <td className="p-4">
                        {product.is_published ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-600" />
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Link
                          href={`/crown-admin/products/${product.id}`}
                          className="inline-flex p-2 bg-gray-800 hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-colors"
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchProducts(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-400">
                    Page {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchProducts(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors"
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
