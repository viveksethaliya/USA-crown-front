'use client';

import { useState } from 'react';
import { Search, Image as ImageIcon, X } from 'lucide-react';
import MediaPickerModal from '@/components/media/MediaPickerModal';

interface SeoFormBlockProps {
  seoTitle: string;
  seoDescription: string;
  seoOgImage: string;
  seoKeywords?: string;
  onChange: (field: 'seo_title' | 'seo_description' | 'seo_og_image' | 'seo_keywords', value: string) => void;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
}

export default function SeoFormBlock({
  seoTitle,
  seoDescription,
  seoOgImage,
  seoKeywords = '',
  onChange,
  titlePlaceholder = 'Leave blank to use the entity name',
  descriptionPlaceholder = 'Leave blank to use the site default description',
}: SeoFormBlockProps) {
  const [mediaOpen, setMediaOpen] = useState(false);

  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;
  const titleColor = titleLength === 0 ? '' : titleLength <= 60 ? 'text-green-600' : 'text-red-500';
  const descColor = descLength === 0 ? '' : descLength <= 160 ? 'text-green-600' : 'text-red-500';

  return (
    <>
      <div className="bg-white/50 border border-white/60 rounded-2xl shadow-inner p-6 sm:p-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 border-b border-[#312f2c]/10 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#312f2c] uppercase tracking-wider">Search Engine Optimization</h2>
            <p className="text-xs font-bold text-[#312f2c]/50 uppercase tracking-wider mt-0.5">
              Override global SEO defaults for this entity. Leave blank to inherit global settings.
            </p>
          </div>
        </div>

        <div className="space-y-6 max-w-3xl">
          {/* SEO Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">
                SEO Title
              </label>
              {titleLength > 0 && (
                <span className={`text-xs font-bold ${titleColor}`}>
                  {titleLength}/60 characters
                </span>
              )}
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => onChange('seo_title', e.target.value)}
              placeholder={titlePlaceholder}
              className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all placeholder:text-[#312f2c]/30"
            />
            <p className="text-xs text-[#312f2c]/40 font-medium">
              Ideal length: under 60 characters. This appears as the browser tab title and in Google search results.
            </p>
          </div>

          {/* SEO Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">
                Meta Description
              </label>
              {descLength > 0 && (
                <span className={`text-xs font-bold ${descColor}`}>
                  {descLength}/160 characters
                </span>
              )}
            </div>
            <textarea
              value={seoDescription}
              onChange={(e) => onChange('seo_description', e.target.value)}
              rows={3}
              placeholder={descriptionPlaceholder}
              className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all resize-none placeholder:text-[#312f2c]/30"
            />
            <p className="text-xs text-[#312f2c]/40 font-medium">
              Ideal length: under 160 characters. This appears as the snippet under your page title in Google results.
            </p>
          </div>

          {/* SEO Keywords */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">
                SEO Keywords
              </label>
            </div>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => onChange('seo_keywords', e.target.value)}
              placeholder="e.g. jewelry, rings, diamond, wholesale (comma separated)"
              className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d1a054]/40 font-medium text-[#312f2c] shadow-sm transition-all placeholder:text-[#312f2c]/30"
            />
            <p className="text-xs text-[#312f2c]/40 font-medium">
              Comma separated keywords. While less critical for modern Google, they are still used by some search engines and site search tools.
            </p>
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#312f2c]/70 uppercase tracking-wider">
              Social Share Image (OG Image)
            </label>
            <div className="flex items-center gap-3">
              {seoOgImage ? (
                <div className="relative group w-24 h-16 rounded-xl overflow-hidden border border-white shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={seoOgImage} alt="OG Preview" className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => onChange('seo_og_image', '')}
                    className="absolute inset-0 bg-[#312f2c]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-16 rounded-xl border-2 border-dashed border-[#312f2c]/20 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6 text-[#312f2c]/25" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => setMediaOpen(true)}
                  className="px-4 py-2.5 bg-white/70 hover:bg-white border border-white/80 rounded-xl text-sm font-bold text-[#312f2c] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {seoOgImage ? 'Change Image' : 'Select from Media Library'}
                </button>
                {seoOgImage && (
                  <p className="text-xs text-[#312f2c]/40 font-medium truncate max-w-xs">{seoOgImage}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-[#312f2c]/40 font-medium">
              Recommended: 1200×630px. Shown when the page is shared on social media (Facebook, Twitter, etc.)
            </p>
          </div>
        </div>
      </div>

      <MediaPickerModal
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          onChange('seo_og_image', url);
          setMediaOpen(false);
        }}
        title="Select OG Image"
      />
    </>
  );
}
