'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Search, ImageIcon, CheckCircle2, UploadCloud } from 'lucide-react';
import ImageUploader from '@/app/crown-admin/components/ImageUploader';
import { ADMIN_API as API } from '@/lib/config';

interface MediaFile {
  id: string;
  name: string;
  folder: string;
  url: string;
  path: string;
  metadata: {
    mimetype: string;
  };
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, path: string) => void;
  title?: string;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect, title = "Select from Media Library" }: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchMedia();
  }, [isOpen]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/upload`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only show images
        setFiles(data.filter((f: any) => f.metadata?.mimetype?.startsWith('image/')));
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onSelect(selectedFile.url, selectedFile.path || `${selectedFile.folder || 'root'}/${selectedFile.name}`);
      onClose();
      setSelectedFile(null); // Reset
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const folders = ['all', ...Array.from(new Set(files.map(f => f.folder || 'root')))];

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || (f.folder || 'root') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#312f2c]/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#f0ede5]/95 backdrop-blur-2xl border border-white/60 rounded-3xl w-full max-w-[90vw] xl:max-w-7xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#312f2c]/10 bg-white/40">
          <h3 className="text-xl font-bold text-[#312f2c]">{title}</h3>
          <button onClick={onClose} className="p-2 text-[#312f2c]/40 hover:text-[#312f2c] bg-white/50 hover:bg-white/80 rounded-xl transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-[#312f2c]/10 bg-white/20">
          <div className="flex-1 flex items-center bg-white/80 border border-white shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#d1a054]/40 transition-all">
            <Search className="w-5 h-5 text-[#312f2c]/40 ml-3" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#312f2c] font-medium placeholder:text-[#312f2c]/40 px-3 py-2.5 w-full outline-none text-sm"
            />
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="bg-white/80 border border-white shadow-sm text-[#312f2c] font-medium rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#d1a054]/40 outline-none text-sm min-w-[150px] transition-all"
          >
            {folders.map(folder => (
              <option key={folder} value={folder}>
                {folder === 'all' ? 'All Folders' : (folder === 'root' ? 'Root' : `/${folder}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col relative">
          {showUploader && (
            <div className="mb-6 bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
              <ImageUploader
                folder="library"
                multiple={true}
                onUploaded={() => {
                  fetchMedia();
                }}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#312f2c]/50">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">No images found in the library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredFiles.map(file => {
                const isSelected = selectedFile?.id === file.id;

                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`group relative aspect-square bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isSelected ? 'border-[#d1a054] ring-2 ring-[#d1a054] shadow-lg shadow-[#d1a054]/20 scale-[0.98]' : 'border-white/80 shadow-sm hover:border-[#d1a054]/40 hover:shadow-md hover:-translate-y-1'
                      }`}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className={`object-cover w-full h-full transition-all duration-500 ${isSelected ? 'opacity-100 scale-105' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'}`}
                      loading="lazy"
                    />

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#d1a054] text-white rounded-full p-1 shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#312f2c]/90 via-[#312f2c]/60 to-transparent p-2 pt-8">
                      <p className="text-[10px] text-white font-medium truncate text-left">{file.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-[#312f2c]/10 bg-white/40 flex justify-between items-center shrink-0">
          <div className="text-sm font-medium text-[#312f2c]/60 truncate max-w-[200px] sm:max-w-md">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'No image selected'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploader(!showUploader)}
              className={`p-2.5 rounded-xl transition-all shadow-sm ${showUploader ? 'bg-[#312f2c] text-white hover:bg-[#312f2c]/90' : 'bg-white/80 border border-white text-[#312f2c] hover:bg-white'}`}
              title="Upload Files"
            >
              <UploadCloud className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[#312f2c]/60 hover:text-[#312f2c] hover:bg-white/60 rounded-xl transition-colors font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedFile}
              className="px-6 py-2.5 bg-[#d1a054] hover:bg-[#c29148] text-white rounded-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-lg"
            >
              Assign Image
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
