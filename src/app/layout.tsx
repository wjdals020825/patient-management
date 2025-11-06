// src/app/layout.tsx
'use client';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <html lang="ko">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
