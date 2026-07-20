'use client';

import React from 'react';
import Link from 'next/link';
import { useSessionStatus } from '@/lib/auth';

export default function HeroActionsClient() {
  const { isAuthenticated, sessionLoading } = useSessionStatus();

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ width: '150px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/products" className="primaryBtn" style={{ padding: '14px 32px', backgroundColor: 'var(--color-cta)', color: '#fff', textDecoration: 'none', display: 'inline-block', borderRadius: '4px', fontWeight: 'bold' }}>
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Link href="/login" className="primaryBtn" style={{ padding: '14px 32px', backgroundColor: 'var(--color-cta)', color: '#fff', textDecoration: 'none', display: 'inline-block', borderRadius: '4px', fontWeight: 'bold' }}>
        Member Login
      </Link>
      <Link href="/apply" className="secondaryBtn" style={{ padding: '14px 32px', backgroundColor: 'transparent', color: '#fff', border: '2px solid var(--color-accent1)', textDecoration: 'none', display: 'inline-block', borderRadius: '4px', fontWeight: 'bold' }}>
        Apply for Membership
      </Link>
    </div>
  );
}
