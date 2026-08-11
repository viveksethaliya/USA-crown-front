'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiscountsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/crown-admin/pricing-groups');
  }, [router]);
  return <div className="p-8 text-slate-500">Redirecting to Unified Pricing...</div>;
}
