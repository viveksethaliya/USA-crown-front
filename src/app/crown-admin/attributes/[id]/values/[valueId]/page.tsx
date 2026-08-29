'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Box, Loader2, Search, SlidersHorizontal, PackageX, ExternalLink } from 'lucide-react';

import { ADMIN_API } from '@/lib/config';
import { adminFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface VariationData {
  variation_id: number;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  is_published: boolean;
  product_id: number;
  product_name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AttributeValueVariationsPage() {
  const params = useParams();
  const attributeId = params.id as string;
  const valueId = params.valueId as string;

  const [variations, setVariations] = useState<VariationData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const getToken = (): string | null => localStorage.getItem('adminToken');

  const fetchVariations = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`${ADMIN_API}/attributes/values/${valueId}/variations?page=${page}&limit=50`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVariations(data.data || []);
        setPagination(data.pagination);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to load variations');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariations(currentPage);
  }, [valueId, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <Link 
          href="/crown-admin/attributes"
          className="inline-flex items-center gap-2 text-sm text-[#312f2c]/50 hover:text-[#d1a054] transition-colors mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attributes
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#312f2c] flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#d1a054]/10 text-[#d1a054] flex items-center justify-center border border-[#d1a054]/20">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              Assigned Variations
            </h2>
            <p className="text-[#312f2c]/55 text-sm mt-1 ml-13">
              Products actively using this attribute value
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 border border-[#312f2c]/10 rounded-xl shadow-sm overflow-hidden">
        {isLoading && variations.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : variations.length === 0 ? (
          <div className="py-24 text-center text-[#312f2c]/40 px-4">
            <PackageX className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-[#312f2c]/70 mb-2">No Variations Assigned</h3>
            <p className="text-sm">There are currently no products using this attribute value.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#312f2c]/5 border-b border-[#312f2c]/10 text-xs text-[#312f2c]/50 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Parent Product</th>
                    <th className="px-6 py-4">Variation SKU</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#312f2c]/5">
                  {variations.map(variation => (
                    <tr key={variation.variation_id} className="hover:bg-white/80 transition-colors group">
                      <td className="px-6 py-4 align-middle">
                        <Link 
                          href={`/crown-admin/products/${variation.product_id}`}
                          className="font-medium text-[#312f2c] hover:text-[#d1a054] flex items-center gap-2"
                        >
                          {variation.product_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 align-middle font-mono text-[#312f2c]/70 text-xs">
                        {variation.sku || 'No SKU'}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className={variation.sale_price ? 'line-through text-[#312f2c]/40 text-xs' : 'font-medium'}>
                            ${variation.regular_price?.toFixed(2) || '0.00'}
                          </span>
                          {variation.sale_price && (
                            <span className="font-bold text-[#d1a054]">
                              ${variation.sale_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${variation.is_published ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-[#312f2c]/5 text-[#312f2c]/40 border border-[#312f2c]/10'}`}>
                          {variation.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <Link
                          href={`/crown-admin/products/${variation.product_id}`}
                          className="inline-flex items-center gap-1.5 p-2 bg-[#312f2c]/5 hover:bg-[#d1a054]/10 hover:text-[#d1a054] text-[#312f2c]/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit Product"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#312f2c]/10 bg-[#312f2c]/[0.02]">
                <div className="text-sm text-[#312f2c]/50 font-medium">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} entries
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#312f2c]/10 bg-white text-[#312f2c] text-sm font-medium hover:bg-[#312f2c]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === pagination.totalPages || isLoading}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#312f2c]/10 bg-white text-[#312f2c] text-sm font-medium hover:bg-[#312f2c]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
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
