import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function HelpDrawer({ isOpen, onClose, title, children }: HelpDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-[#312f2c]/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#312f2c]/10 bg-slate-50">
          <h2 className="text-lg font-bold text-[#312f2c]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-[#312f2c]/80 text-sm leading-relaxed prose prose-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
