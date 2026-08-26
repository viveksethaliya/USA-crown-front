'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function B2BRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/crown-admin/customers'); }, [router]);
  return null;
}
