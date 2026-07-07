'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/cart';

export default function HeroBannerDynamic() {
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    async function fetchBanner() {
      try {
        const res = await fetch(apiUrl('/api/store/catalog/hero-banner'));
        if (res.ok) {
          const data = await res.json();
          if (data && data.is_active) {
            setBanner(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch hero banner:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanner();
  }, []);

  if (loading || !banner || !isVisible) return null;

  const heightMap = {
    small: '200px',
    medium: '400px',
    large: '600px'
  };

  const height = heightMap[banner.length as keyof typeof heightMap] || '400px';
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const justifyContent = alignMap[banner.alignment as keyof typeof alignMap] || 'center';
  const opacity = (banner.opacity ?? 50) / 100;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: height,
      backgroundImage: `url(${banner.background_image || '/web-phts/a-17.jpg'})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: justifyContent,
      padding: '0 5%'
    }}>
      {/* Dismiss Button */}
      <button 
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.4)',
          border: '2px solid rgba(255,255,255,0.3)',
          color: 'white',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.2rem',
          lineHeight: 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        aria-label="Close banner"
      >
        ✕
      </button>
      {/* Background Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: `rgba(0, 0, 0, ${opacity})`
      }}></div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        color: '#fff',
        textAlign: banner.alignment as 'left' | 'center' | 'right',
        maxWidth: '800px',
        width: '100%'
      }}>
        {banner.title && (
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {banner.title}
          </h2>
        )}
        
        {banner.content && (
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginBottom: '1.5rem', lineHeight: 1.6, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {banner.content}
          </p>
        )}
        
        {banner.button_text && banner.button_link && (
          <Link href={banner.button_link} style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: 'var(--color-gold)',
            color: '#fff',
            textDecoration: 'none',
            border: '2px solid #fff',
            borderRadius: '4px',
            fontSize: '1.1rem',
            fontWeight: 600,
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {banner.button_text}
          </Link>
        )}
      </div>
    </div>
  );
}
