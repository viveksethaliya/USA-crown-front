'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/cart';
import styles from './Footer.module.css';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch(apiUrl('/api/store/newsletter/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
      <div className={styles.newsletterInputWrap}>
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') { setStatus('idle'); setMessage(''); }
          }}
          className={styles.newsletterInput}
          required
        />
        <button
          type="submit"
          className={styles.newsletterBtn}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Subscribing...' : 'SUBSCRIBE'}
        </button>
      </div>
      {message && (
        <p className={`${styles.newsletterMsg} ${status === 'error' ? styles.newsletterMsgError : styles.newsletterMsgSuccess}`}>
          {message}
        </p>
      )}
    </form>
  );
}
