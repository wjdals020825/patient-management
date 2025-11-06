'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // ✅ 현재 URL 경로 감지

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <div className="d-flex">
      {/* ✅ activePath에는 현재 경로를 전달 */}
      <Sidebar  />
      <div className="flex-grow-1 p-3 bg-light" style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}
