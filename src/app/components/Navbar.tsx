'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand fw-bold" href="/">
          🏥 Hospital System
        </Link>
        <div>
          <Link href="/login" className="btn btn-outline-light me-2">
            로그인
          </Link>
          <Link href="/register" className="btn btn-light">
            회원가입
          </Link>
        </div>
      </div>
    </nav>
  );
}
