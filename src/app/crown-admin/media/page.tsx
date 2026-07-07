'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Trash2, FileText, Loader2, Search, Image as ImageIcon, Copy, ExternalLink, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ADMIN_API as API } from '@/lib/config';

interface MediaFile {
  id: string;
  name: string;
  folder: string;
  url: string;
  updated_at: string;
  alt_text?: string;
  metadata: { mimetype: string; size: number; };
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
      const res = await fetch(`${API}/upload`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFiles(await res.json());
    } catch (error) { console.error('Failed to fetch media:', error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsUploading(true);
    let hasError = false;
    let skippedFiles: string[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 2 * 1024 * 1024) { skippedFiles.push(file.name); continue; }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'misc');
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if (!res.ok) { const err = await res.json(); console.error(`Failed: ${file.name}`, err); hasError = true; }
      } catch (error) { console.error(error); hasError = true; }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (skippedFiles.length > 0) toast.error(`Skipped files exceeding 2MB:\n${skippedFiles.join(', ')}`);
    else if (hasError) toast.error('Some files failed to upload.');
    else toast.success('Files uploaded successfully');
    await fetchMedia();
  };

  const handleSaveAltText = async () => {
    if (!editingAltFile) return;
    const path = editingAltFile.folder ? `${editingAltFile.folder}/${editingAltFile.name}` : editingAltFile.name;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/upload/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ file_path: path, alt_text: altText })
      });
      if (res.ok) {
        setFiles(prev => prev.map(f => f.id === editingAltFile.id ? { ...f, alt_text: altText } : f));
        setEditingAltFile(null);
        toast.success('Alt text updated successfully');
      } else { toast.error('Failed to save alt text'); }
    } catch { toast.error('An error occurred'); }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    const path = file.folder ? `${file.folder}/${file.name}` : file.name;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ path })
      });
      if (res.ok) { setFiles(prev => prev.filter(f => f.id !== file.id)); toast.success('File deleted successfully'); }
      else toast.error('Failed to delete file');
    } catch { toast.error('An error occurred'); }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  };

  const folders = ['all', ...Array.from(new Set(files.map(f => f.folder || 'root')))];
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || (f.folder || 'root') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#312f2c]">Media Library</h2>
          <p className="text-[#312f2c]/55 text-sm mt-1">Manage product images, certificates, and other assets</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*,application/pdf" multiple />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg shadow-sm transition-all font-medium disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#ece9e1] p-4 border border-[#312f2c]/10 rounded-xl">
        <div className="flex-1 flex items-center bg-white border border-[#312f2c]/12 rounded-lg overflow-hidden">
          <Search className="w-5 h-5 text-[#312f2c]/35 ml-3" />
          <input type="text" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[#312f2c] placeholder:text-[#312f2c]/35 px-3 py-2 w-full outline-none text-sm" />
          {search && (
            <button onClick={() => setSearch('')} className="p-2 text-[#312f2c]/35 hover:text-[#312f2c]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}
          className="bg-white border border-[#312f2c]/12 text-[#312f2c] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d1a054]/40 outline-none text-sm">
          {folders.map(folder => (
            <option key={folder} value={folder}>
              {folder === 'all' ? 'All Folders' : (folder === 'root' ? 'Root' : `/${folder}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#d1a054]" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-[#312f2c]/6 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-[#312f2c]/30" />
          </div>
          <h3 className="text-lg font-medium text-[#312f2c] mb-2">No files found</h3>
          <p className="text-[#312f2c]/45 max-w-sm mx-auto mb-6">Upload images and PDFs to start building your media library.</p>
          <button onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg transition-colors inline-flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredFiles.map(file => {
            const isImage = file.metadata?.mimetype?.startsWith('image/');
            const size = formatBytes(file.metadata?.size || 0);
            return (
              <div key={file.id} className="group relative bg-[#ece9e1] border border-[#312f2c]/10 rounded-xl overflow-hidden hover:border-[#d1a054]/40 hover:shadow-sm transition-all flex flex-col">
                <div className="aspect-square bg-[#312f2c]/5 flex items-center justify-center relative overflow-hidden">
                  {isImage ? (
                    <img src={file.url} alt={file.name} className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />
                  ) : (
                    <FileText className="w-12 h-12 text-[#312f2c]/30 group-hover:text-[#312f2c]/50 transition-colors" />
                  )}
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-[#312f2c]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    {isImage && (
                      <button onClick={() => { setEditingAltFile(file); setAltText(file.alt_text || ''); }}
                        className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors" title="Edit Alt Text">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => copyToClipboard(file.url)}
                      className="p-2 bg-white/15 hover:bg-[#d1a054]/80 text-white rounded-lg transition-colors" title="Copy URL">
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={file.url} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors" title="Open in new tab">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDelete(file)}
                      className="p-2 bg-white/15 hover:bg-red-600 text-white rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 border-t border-[#312f2c]/8 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-[#312f2c] font-medium truncate" title={file.name}>{file.name}</p>
                    {isImage && file.alt_text && (
                      <p className="text-[10px] text-[#312f2c]/45 mt-1 truncate" title={file.alt_text}>Alt: {file.alt_text}</p>
                    )}
                    <p className="text-[10px] text-[#312f2c]/35 mt-1 uppercase font-mono tracking-wider">{file.folder || 'root'}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#312f2c]/8">
                    <span className="text-[10px] text-[#312f2c]/45">{size}</span>
                    <span className="text-[10px] text-[#312f2c]/35">{new Date(file.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alt Text Modal */}
      {editingAltFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#312f2c]/60 backdrop-blur-sm p-4">
          <div className="bg-[#f0ede5] border border-[#312f2c]/12 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#312f2c]">Edit Alt Text</h3>
                <button onClick={() => setEditingAltFile(null)} className="text-[#312f2c]/40 hover:text-[#312f2c] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-[#312f2c]/50 mb-2 truncate">File: {editingAltFile.name}</p>
                <div className="aspect-video bg-[#312f2c]/5 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-[#312f2c]/10">
                  <img src={editingAltFile.url} alt="Preview" className="object-contain w-full h-full" />
                </div>
                <label className="block text-sm font-medium text-[#312f2c]/65 mb-1">Alt Text (SEO & Accessibility)</label>
                <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. 14k Gold Engagement Ring"
                  className="w-full bg-white border border-[#312f2c]/12 rounded-lg px-4 py-2 text-[#312f2c] focus:ring-2 focus:ring-[#d1a054]/40 focus:outline-none transition-all"
                  autoFocus />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingAltFile(null)}
                  className="px-4 py-2 text-[#312f2c]/55 hover:text-[#312f2c] hover:bg-[#312f2c]/8 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveAltText}
                  className="px-4 py-2 bg-[#312f2c] hover:bg-[#312f2c]/85 text-[#f0ede5] rounded-lg transition-colors">
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
