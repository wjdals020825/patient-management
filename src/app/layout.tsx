'use client';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ReactNode, useEffect } from 'react';

// export const metadata = {
//   title: '병원 관리자 시스템',
//   description: '관리자 대시보드 및 환자 관리',
// };

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Bootstrap JS: 모달, Collapse, Dropdown 등 동적 UI 사용 가능
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <html lang="ko">
      <body>
        <AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
