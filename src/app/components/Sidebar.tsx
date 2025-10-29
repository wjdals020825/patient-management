'use client';
import { Dispatch, SetStateAction } from 'react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: Dispatch<SetStateAction<string>>;
}

export default function Sidebar({ activeMenu, setActiveMenu }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'patient-register', label: '환자 등록' },
    { id: 'visit-records', label: '내원 기록' },
    { id: 'settings', label: '환경설정' },
  ];

  return (
    <div className="bg-light vh-100 p-3" style={{ width: '220px' }}>
      <h4>병원 관리자</h4>
      <ul className="nav flex-column mt-4">
        {menuItems.map((item) => (
          <li key={item.id} className="nav-item">
            <button
              className={`btn btn-link nav-link ${activeMenu === item.id ? 'fw-bold' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
