'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login'); // 로그인 안 되어 있으면 이동
      // router.push('/dashboard');
    }
  }, [user, router]);

  if (!user) return <div>Loading...</div>; // 로그인 체크 중

  return (
    <div className="container mt-5">
      <h2>환영합니다, {user.name}님!</h2>
      <p>병원명: {user.hospitalName}</p>
      <button className="btn btn-danger mt-3" onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}
