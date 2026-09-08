'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, FileText, Globe } from 'lucide-react';
import { apiUrl } from '@/lib/cart';
import { adminFetch } from '@/lib/api';
import SeoFormBlock from '@/components/SeoFormBlock';
import { toast } from 'react-hot-toast';

interface PageSeoRow {
  route_path: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  is_noindex: boolean;
}

export default function StaticPageSeoScreen() {
  const [loading, setLoading] = useState(true);
  const [savingRoute, setSavingRoute] = useState<string | null>(null);
  const [rows, setRows] = useState<PageSeoRow[]>([]);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const fetchSeo = async () => {
    try {
      const res = await adminFetch(apiUrl('/api/admin/page-seo'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRows(data);
      }
    } catch (err) {
      console.error('Error fetching page SEO:', err);
      toast.error('Failed to load static page SEO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeo();
  }, []);

  const handleUpdateField = (route_path: string, field: keyof PageSeoRow, value: any) => {
    setRows(prev => prev.map(row => 
      row.route_path === route_path ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = async (routePath: string) => {
    const row = rows.find(r => r.route_path === routePath);
    if (!row) return;

    setSavingRoute(routePath);
    try {
      const res = await adminFetch(apiUrl('/api/admin/page-seo'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          route_path: row.route_path,
          seo_title: row.seo_title || null,
          seo_description: row.seo_description || null,
          seo_og_image: row.seo_og_image || null,
          is_noindex: row.is_noindex
        })
      });

      if (res.ok) {
        toast.success(`Saved SEO for ${routePath}`);
      } else {
        const err = await res.json();
        toast.error(err.error || `Failed to save SEO for ${routePath}`);
      }
    } catch (err) {
      console.error('Error saving SEO:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSavingRoute(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 -m-4 sm:m-0">
      <div className="shrink-0 px-4 sm:px-0 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#312f2c] tracking-wide flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#d1a054]" />
            Static Page SEO
          </h1>
          <p className="text-sm text-[#312f2c]/60 mt-1">
            Controls how static pages appear in search results. Page content is managed by your developer.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-sm flex flex-col overflow-hidden p-4 sm:p-6">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            
            <div className="bg-[#f0ede5]/50 border border-[#312f2c]/10 rounded-2xl p-4 mb-6 shadow-inner">
              <h3 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider mb-2">Note on Duplicate Metadata</h3>
              <ul className="text-xs text-[#312f2c]/70 list-disc list-inside space-y-1">
                <li><strong className="text-[#312f2c]">/</strong>, <strong className="text-[#312f2c]">/apply</strong>, <strong className="text-[#312f2c]">/calculator</strong>, and <strong className="text-[#312f2c]">/resale-certificate</strong> currently share the exact same title and description.</li>
                <li><strong className="text-[#312f2c]">/about</strong> and <strong className="text-[#312f2c]">/contact</strong> share the same description.</li>
              </ul>
              <p className="text-xs text-[#312f2c]/70 mt-2">You can use this screen to author unique titles and descriptions for them.</p>
            </div>

            <div className="space-y-4">
              {rows.map((row) => {
                const isExpanded = expandedRoute === row.route_path;
                const hasAuthoredContent = !!row.seo_title || !!row.seo_description || !!row.seo_og_image || row.is_noindex;
                
                return (
                  <div key={row.route_path} className="bg-white/50 border border-white/60 rounded-2xl shadow-sm overflow-hidden transition-all">
                    {/* Header Row */}
                    <div 
                      className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/40"
                      onClick={() => setExpandedRoute(isExpanded ? null : row.route_path)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#312f2c]">{row.route_path === '/' ? '/ (Homepage)' : row.route_path}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            {!hasAuthoredContent ? (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                Uses Literal Fallback
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                Authored Values Active
                              </span>
                            )}
                            {row.is_noindex && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                Hidden from Search
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button className="text-sm font-bold text-[#d1a054] hover:text-[#c29148] transition-colors">
                        {isExpanded ? 'Collapse' : 'Edit'}
                      </button>
                    </div>

                    {/* Expanded Editor */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-black/5 bg-white/30">
                        <div className="mb-6 bg-white/50 border border-white/60 rounded-2xl shadow-inner p-6 sm:p-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-sm font-bold text-[#312f2c] uppercase tracking-wider">Hide this page from search engines</h2>
                              <p className="text-xs text-[#312f2c]/60 mt-1">If enabled, Google will not index this page in search results (noindex).</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={row.is_noindex}
                                onChange={(e) => handleUpdateField(row.route_path, 'is_noindex', e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-[#312f2c]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d1a054]"></div>
                            </label>
                          </div>
                        </div>

                        <SeoFormBlock
                          seoTitle={row.seo_title || ''}
                          seoDescription={row.seo_description || ''}
                          seoOgImage={row.seo_og_image || ''}
                          hideKeywords={true}
                          onChange={(field, value) => {
                            if (field !== 'seo_keywords') {
                              handleUpdateField(row.route_path, field as keyof PageSeoRow, value);
                            }
                          }}
                          titlePlaceholder="Leave blank to use the literal fallback"
                          descriptionPlaceholder="Leave blank to use the literal fallback"
                        />

                        <div className="flex justify-end pt-4 mt-4">
                          <button
                            type="button"
                            onClick={() => handleSave(row.route_path)}
                            disabled={savingRoute === row.route_path}
                            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#d1a054] hover:bg-[#c29148] hover:-translate-y-0.5 hover:shadow-lg text-[#f0ede5] rounded-xl font-bold transition-all disabled:opacity-50"
                          >
                            {savingRoute === row.route_path ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />}
                            {savingRoute === row.route_path ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
