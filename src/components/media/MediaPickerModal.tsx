'use client';

import { useState, useEffect } from 'react';
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

  if (!isOpen) return null;

  const folders = ['all', ...Array.from(new Set(files.map(f => f.folder || 'root')))];

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || (f.folder || 'root') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-gray-800 bg-gray-950/50">
          <div className="flex-1 flex items-center bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <Search className="w-5 h-5 text-gray-500 ml-3" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white px-3 py-2 w-full outline-none"
            />
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {folders.map(folder => (
              <option key={folder} value={folder}>
                {folder === 'all' ? 'All Folders' : (folder === 'root' ? 'Root' : `/${folder}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
          {showUploader && (
            <div className="mb-6 bg-gray-950 p-4 rounded-xl border border-gray-800">
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>No images found in the library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredFiles.map(file => {
                const isSelected = selectedFile?.id === file.id;

                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`group relative aspect-square bg-gray-950 border-2 rounded-xl overflow-hidden transition-all ${isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-800 hover:border-gray-600'
                      }`}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className={`object-cover w-full h-full transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                      loading="lazy"
                    />

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1 shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                      <p className="text-[10px] text-white font-medium truncate text-left">{file.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/50 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'No image selected'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploader(!showUploader)}
              className={`p-2 rounded-lg transition-colors ${showUploader ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:text-white'}`}
              title="Upload Files"
            >
              <UploadCloud className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedFile}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Assign Image
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
