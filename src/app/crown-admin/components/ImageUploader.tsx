'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

import { ADMIN_API } from '@/lib/config';
const API = `${ADMIN_API}/upload`;

/**
 * Reusable image uploader component.
 * Props:
 *   folder     - storage subfolder: 'products', 'brands', 'categories', etc.
 *   onUploaded - callback(url, path) called after successful upload
 *   multiple   - whether to allow multiple files at once (default: false)
 */
interface ImageUploaderProps {
  folder?: string;
  onUploaded?: (url: string, path: string) => void;
  multiple?: boolean;
}

interface UploadingFile {
  id: string;
  name: string;
  done: boolean;
  error: string | null;
  url?: string;
}

export default function ImageUploader({ folder = 'misc', onUploaded, multiple = false }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]); // Array of { name, progress, error }
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setUploading(prev => [...prev, { id, name: file.name, done: false, error: null }]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        setUploading(prev => prev.map(u => u.id === id ? { ...u, error: data.error, done: true } : u));
        return;
      }

      // Call parent callback with the public URL
      if (onUploaded) onUploaded(data.url, data.path);
      setUploading(prev => prev.map(u => u.id === id ? { ...u, done: true, url: data.url } : u));

      // Clear successful uploads from the queue after a moment
      setTimeout(() => {
        setUploading(prev => prev.filter(u => u.id !== id || u.error));
      }, 2000);

    } catch (err: any) {
      setUploading(prev => prev.map(u => u.id === id ? { ...u, error: err.message, done: true } : u));
    }
  }, [folder, onUploaded]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    const processFile = (file: File) => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        const id = Math.random().toString(36).slice(2);
        setUploading(prev => [...prev, { id, name: file.name, done: true, error: 'Invalid file type. Only images and PDFs are allowed.' }]);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        const id = Math.random().toString(36).slice(2);
        setUploading(prev => [...prev, { id, name: file.name, done: true, error: 'File size exceeds the 2MB limit.' }]);
        return;
      }
      uploadFile(file);
    };

    if (!multiple) {
      if (fileArray[0]) processFile(fileArray[0]);
    } else {
      fileArray.forEach(processFile);
    }
  }, [multiple, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const clearError = (id: string) => setUploading(prev => prev.filter(u => u.id !== id));

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/30 bg-gray-900/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-600'}`} />
        <p className={`text-sm font-medium ${isDragging ? 'text-blue-300' : 'text-gray-400'}`}>
          {isDragging ? 'Drop to upload' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          or <span className="text-blue-400 hover:text-blue-300">click to browse</span> · Max 2 MB · Images & PDF
        </p>
      </div>

      {/* Upload Queue */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(u => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
              u.error
                ? 'bg-red-500/5 border-red-500/30 text-red-400'
                : u.done
                ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-900 border-gray-800 text-gray-400'
            }`}>
              {!u.done ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : u.error ? (
                <X className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ImageIcon className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="flex-1 truncate">{u.name}</span>
              {u.error && (
                <>
                  <span className="text-xs">{u.error}</span>
                  <button onClick={() => clearError(u.id)} className="ml-2 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {!u.error && u.done && <span className="text-xs">Uploaded!</span>}
              {!u.done && <span className="text-xs">Uploading...</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
