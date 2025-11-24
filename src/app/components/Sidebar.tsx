'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Modal, Button } from "react-bootstrap";
export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };
  const router = useRouter();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div
      className="bg-dark text-white p-3 d-flex flex-column justify-content-between"
      style={{
        width: collapsed ? 80 : 250,        // ✅ 숫자로 px 고정 → 토글해도 항상 같은 폭
        flexShrink: 0,                      // ✅ 메인 영역에 밀려서 줄어들지 않게
        minHeight: '100vh',
        transition: 'width 0.2s ease',
      }}
    >
      {/* 상단 영역 */}
      <div>
        {/* 로고 + 토글 버튼 */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          {/* 로고 */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-primary d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 32, height: 32, fontWeight: 700 }}
            >
              M
            </div>
            {!collapsed && (
              <div>
                <div className="fw-bold" style={{ lineHeight: 1 }}>
                  MediDesk
                </div>
                <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                  Hospital Admin
                </small>
              </div>
            )}
          </div>

          {/* 접기/펴기 토글 버튼 */}
          <button
            type="button"
            className="btn btn-sm btn-outline-light border-0"
            onClick={toggleCollapsed}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* 병원명 / 이름 / 로그아웃 (펼쳐진 상태) */}
        {!collapsed && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="me-2">
              <div className="fw-semibold text-truncate" style={{ maxWidth: 140 }}>
                {user?.hospitalName ?? '병원명 없음'}
              </div>
              <div className="text-white-50" style={{ fontSize: '0.85rem' }}>
                {user?.name ?? '사용자'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
      onClick={() => setShowLogoutModal(true)}  >
        
  
              로그아웃
            </button>
          </div>
        )}

        {/* 접힌 상태에서의 작은 로그아웃 버튼 (아이콘만) */}
        {collapsed && (
          <div className="d-flex justify-content-center mb-3">
            <button
              type="button"
              className="btn btn-outline-light btn-sm px-2"
              onClick={logout}
              title="로그아웃"
            >
              ⏻
            </button>
          </div>
        )}

        {!collapsed && <h4 className="mb-3">관리자 메뉴</h4>}

        {/* 메뉴 리스트 */}
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              href="/dashboard"
              className={`nav-link text-white d-flex align-items-center ${
                pathname === '/dashboard' ? 'active fw-bold' : ''
              }`}
            >
              <span className="me-2">📊</span>
              {!collapsed && <span>대시보드</span>}
            </Link>
          </li>

          <li className="nav-item">
            <Link
              href="/patient-register"
              className={`nav-link text-white d-flex align-items-center ${
                pathname === '/patient-register' ? 'active fw-bold' : ''
              }`}
            >
              <span className="me-2">📝</span>
              {!collapsed && <span>환자 등록</span>}
            </Link>
          </li>

          <li className="nav-item">
            <Link
              href="/visit-records"
              className={`nav-link text-white d-flex align-items-center ${
                pathname === '/visit-records' ? 'active fw-bold' : ''
              }`}
            >
              <span className="me-2">📅</span>
              {!collapsed && <span>내원 기록</span>}
            </Link>
          </li>

          <li className="nav-item">
            <Link
              href="/settings"
              className={`nav-link text-white d-flex align-items-center ${
                pathname === '/settings' ? 'active fw-bold' : ''
              }`}
            >
              <span className="me-2">⚙️</span>
              {!collapsed && <span>환경 설정</span>}
            </Link>
          </li>
        </ul>
      </div>

      <div />
       <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>로그아웃</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        정말 로그아웃 하시겠습니까?
      </Modal.Body>

      <Modal.Footer>
               <Button
          variant="danger"
          onClick={async () => {
            await logout();
            setShowLogoutModal(false);
            router.push('/login');
          }}
        >
          예
        </Button>
        <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
          아니오
        </Button>

 
      </Modal.Footer>
    </Modal>
    </div>
  
  );
  
}

