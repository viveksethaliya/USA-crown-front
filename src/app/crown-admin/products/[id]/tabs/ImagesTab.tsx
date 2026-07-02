'use client';

import { useState } from 'react';
import { Trash2, ImageIcon, Star, Library } from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';
import MediaPickerModal from '../../../../../components/media/MediaPickerModal';

const API = 'http://localhost:5000/api/admin';

export default function ImagesTab({ productId, images, setImages }: { productId: string, images: any[], setImages: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Called by ImageUploader after a successful upload
  const handleUploaded = async (url: string, storagePath: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      // Save the URL reference to the product_images table
      const res = await fetch(`${API}/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          url,
          alt_text: '',
          position: images.length
        })
      });
      const data = await res.json();
      if (res.ok) {
        setImages(prev => [...prev, { ...data, _storagePath: storagePath }]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMediaSelected = async (url: string, path: string) => {
    // Attempt to parse out alt_text from url if we want to fetch it, but let's just pass empty
    // so user can edit it in the product tab.
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API}/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          url,
          alt_text: '',
          position: images.length
        })
      });
      const data = await res.json();
      if (res.ok) {
        setImages(prev => [...prev, { ...data, _storagePath: path }]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetMain = async (image: any) => {
    setIsDeleting(image.id); // using same loading state to prevent double clicks
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API}/products/${productId}/images/${image.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ position: 0 })
      });
      
      // Update locally
      setImages(prev => {
        const currentMain = prev.find(img => img.position === 0);
        return prev.map(img => {
          if (img.id === image.id) return { ...img, position: 0 };
          if (currentMain && img.id === currentMain.id) return { ...img, position: image.position };
          return img;
        });
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDelete = async (image: any) => {
    if (!confirm('Remove this image from the product?')) return;
    setIsDeleting(image.id);
    const token = localStorage.getItem('adminToken');
    try {
      // 1. Remove DB record
      await fetch(`${API}/products/${productId}/images/${image.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // 2. Try to delete from Supabase Storage too (optional — only if path known)
      if (image._storagePath || image.storage_path) {
        await fetch(`${API}/upload`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ path: image._storagePath || image.storage_path })
        });
      }

      setImages(prev => prev.filter(img => img.id !== image.id));
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const sortedImages = [...images].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Assign Images</h3>
            <p className="text-xs text-gray-500 mt-1">
              Upload new images or pick existing ones from your Media Library.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMediaPickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 transition-colors font-medium text-sm"
          >
            <Library className="w-4 h-4" /> Browse Media Library
          </button>
        </div>
        
        <div className="pt-2">
          <ImageUploader
            folder="products"
            multiple={true}
            onUploaded={handleUploaded}
          />
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Product Images
          </h3>
          <span className="text-xs text-gray-600">{images.length} image{images.length !== 1 ? 's' : ''}</span>
        </div>

        {sortedImages.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No images yet. Upload files above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sortedImages.map((img, idx) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden bg-gray-800 aspect-square border border-gray-700 hover:border-gray-500 transition-all"
              >
                {/* Image */}
                <img
                  src={img.url}
                  alt={img.alt_text || `Product image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextSibling) {
                      (target.nextSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                {/* Fallback */}
                <div className="hidden absolute inset-0 items-center justify-center text-gray-600">
                  <ImageIcon className="w-8 h-8" />
                </div>

                {/* Main image badge */}
                {idx === 0 && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                    <Star className="w-3 h-3" /> Main
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  {idx !== 0 && (
                    <button
                      onClick={() => handleSetMain(img)}
                      disabled={isDeleting === img.id}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {isDeleting === img.id ? '...' : 'Set Main'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img)}
                    disabled={isDeleting === img.id}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting === img.id ? '...' : 'Remove'}
                  </button>
                </div>

                {/* Position number */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-300 text-xs">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen} 
        onClose={() => setIsMediaPickerOpen(false)} 
        onSelect={handleMediaSelected} 
      />
    </div>
  );
}
