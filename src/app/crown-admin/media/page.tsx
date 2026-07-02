'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Trash2, FileText, Loader2, Search, Image as ImageIcon, Copy, ExternalLink, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface MediaFile {
  id: string;
  name: string;
  folder: string;
  url: string;
  updated_at: string;
  alt_text?: string;
  metadata: {
    mimetype: string;
    size: number;
  };
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [editingAltFile, setEditingAltFile] = useState<MediaFile | null>(null);
  const [altText, setAltText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/upload', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let hasError = false;
    let skippedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Enforce 2MB size limit
      if (file.size > 2 * 1024 * 1024) {
        skippedFiles.push(file.name);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'misc'); // Default folder

      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch('http://localhost:5000/api/admin/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (!res.ok) {
          const err = await res.json();
          console.error(`Failed to upload ${file.name}:`, err);
          hasError = true;
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        hasError = true;
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (skippedFiles.length > 0) {
      toast.error(`Skipped files exceeding 2MB limit:\n${skippedFiles.join(', ')}`);
    } else if (hasError) {
      toast.error('Some files failed to upload. Check console for details.');
    } else {
      toast.success('Files uploaded successfully');
    }
    await fetchMedia();
  };

  const handleSaveAltText = async () => {
    if (!editingAltFile) return;
    
    const path = editingAltFile.folder ? `${editingAltFile.folder}/${editingAltFile.name}` : editingAltFile.name;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/upload/metadata', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ file_path: path, alt_text: altText })
      });
      
      if (res.ok) {
        setFiles(prev => prev.map(f => f.id === editingAltFile.id ? { ...f, alt_text: altText } : f));
        setEditingAltFile(null);
        toast.success('Alt text updated successfully');
      } else {
        toast.error('Failed to save alt text');
      }
    } catch (error) {
      console.error('Alt text save error:', error);
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    const path = file.folder ? `${file.folder}/${file.name}` : file.name;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/upload', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path })
      });
      
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        toast.success('File deleted successfully');
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const folders = ['all', ...Array.from(new Set(files.map(f => f.folder || 'root')))];

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || (f.folder || 'root') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Media Library
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage product images, certificates, and other assets</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept="image/*,application/pdf"
            multiple
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all font-medium disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gray-900/50 p-4 border border-gray-800 rounded-xl backdrop-blur-sm">
        <div className="flex-1 flex items-center bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
          <Search className="w-5 h-5 text-gray-500 ml-3" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-white px-3 py-2 w-full outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <select 
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {folders.map(folder => (
            <option key={folder} value={folder}>
              {folder === 'all' ? 'All Folders' : (folder === 'root' ? 'Root' : `/${folder}`)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center shadow-xl">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No files found</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            Upload images and PDFs to start building your media library.
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredFiles.map(file => {
            const isImage = file.metadata?.mimetype?.startsWith('image/');
            const size = formatBytes(file.metadata?.size || 0);
            
            return (
              <div key={file.id} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all flex flex-col">
                <div className="aspect-square bg-gray-950 flex items-center justify-center relative overflow-hidden">
                  {isImage ? (
                    <img src={file.url} alt={file.name} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                  ) : (
                    <FileText className="w-12 h-12 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  )}
                  
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    {isImage && (
                      <button 
                        onClick={() => {
                          setEditingAltFile(file);
                          setAltText(file.alt_text || '');
                        }} 
                        className="p-2 bg-gray-800 hover:bg-indigo-600 text-white rounded-lg transition-colors" 
                        title="Edit Alt Text"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => copyToClipboard(file.url)} className="p-2 bg-gray-800 hover:bg-blue-600 text-white rounded-lg transition-colors" title="Copy URL">
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-emerald-600 text-white rounded-lg transition-colors" title="Open in new tab">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDelete(file)} className="p-2 bg-gray-800 hover:bg-red-600 text-white rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 border-t border-gray-800 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-white font-medium truncate" title={file.name}>{file.name}</p>
                    {isImage && file.alt_text && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate" title={file.alt_text}>Alt: {file.alt_text}</p>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono tracking-wider">{file.folder || 'root'}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/50">
                    <span className="text-[10px] text-gray-400">{size}</span>
                    <span className="text-[10px] text-gray-500">{new Date(file.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alt Text Modal */}
      {editingAltFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Edit Alt Text</h3>
                <button onClick={() => setEditingAltFile(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2 truncate">File: {editingAltFile.name}</p>
                <div className="aspect-video bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                  <img src={editingAltFile.url} alt="Preview" className="object-contain w-full h-full" />
                </div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Alt Text (SEO & Accessibility)</label>
                <input 
                  type="text" 
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. 14k Gold Engagement Ring"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setEditingAltFile(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAltText}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Save Alt Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
