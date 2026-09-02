import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Not Found</h1>
      <p style={{ color: '#666' }}>The page you requested could not be found.</p>
      <Link href="/" style={{ color: '#0066cc', textDecoration: 'underline' }}>
        &larr; Return to Home
      </Link>
    </div>
  );
}
