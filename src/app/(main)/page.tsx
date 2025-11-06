'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MainIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard'); // ✅ 최초 진입 시 자동 이동
  }, [router]);

  return null;
}
