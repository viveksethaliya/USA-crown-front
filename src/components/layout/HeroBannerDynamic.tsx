'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/cart';

export default function HeroBannerDynamic() {
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

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

  if (loading || !banner) return null;

  const heightMap = {
    small: '200px',
    medium: '400px',
    large: '600px'
  };

  const fullHeight = heightMap[banner.length as keyof typeof heightMap] || '400px';
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const justifyContent = alignMap[banner.alignment as keyof typeof alignMap] || 'center';
  const opacity = (banner.opacity ?? 50) / 100;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isMinimized ? '48px' : fullHeight,
      backgroundImage: `url(${banner.background_image || '/web-phts/a-17.jpg'})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMinimized ? 'center' : justifyContent,
      padding: '0 5%',
      transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      cursor: isMinimized ? 'pointer' : 'default'
    }}
    onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      {/* Background Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: isMinimized ? 'rgba(28, 33, 53, 0.95)' : `rgba(0, 0, 0, ${opacity})`,
        transition: 'background-color 0.4s ease'
      }}></div>

      {isMinimized ? (
        <div style={{
          position: 'relative',
          zIndex: 1,
          color: '#fff',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          letterSpacing: '0.5px'
        }}>
          <span>Show Special Offer</span>
          <span style={{ fontSize: '1.2rem' }}>+</span>
        </div>
      ) : (
        <>
          {/* Dismiss Button */}
          <button 
            onClick={() => setIsMinimized(true)}
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
            aria-label="Minimize banner"
          >
            ✕
          </button>
          
          {/* Content */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            color: '#fff',
            textAlign: banner.alignment as 'left' | 'center' | 'right',
            maxWidth: '800px',
            width: '100%',
            opacity: isMinimized ? 0 : 1,
            transition: 'opacity 0.3s ease 0.2s'
          }}>
            {banner.title && (
              <h2 className="heroTitle" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {banner.title}
              </h2>
            )}
            
            {banner.content && (
              <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', marginBottom: '2rem', lineHeight: 1.6, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {banner.content}
              </p>
            )}
            
            {banner.button_text && banner.button_link && (
              <Link href={banner.button_link} className="ctaButton" style={{
                display: 'inline-block',
                padding: '14px 36px',
                backgroundColor: 'var(--color-gold)',
                color: '#fff',
                textDecoration: 'none',
                border: 'none',
                fontSize: '1.1rem',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                {banner.button_text}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

