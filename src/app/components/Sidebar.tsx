// src/components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-dark text-white p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <h4 className="mb-4">관리자 메뉴</h4>
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link
            href="/dashboard"
            className={`nav-link text-white ${pathname === '/dashboard' ? 'active fw-bold' : ''}`}
          >
            대시보드
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/patient-register"
            className={`nav-link text-white ${pathname === '/patient-register' ? 'active fw-bold' : ''}`}
          >
            환자 등록
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/visit-records"
            className={`nav-link text-white ${pathname === '/visit-records' ? 'active fw-bold' : ''}`}
          >
            내원 기록
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/settings"
            className={`nav-link text-white ${pathname === '/settings' ? 'active fw-bold' : ''}`}
          >
            환경 설정
          </Link>
        </li>
      </ul>
    </div>
  );
}
