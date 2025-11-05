'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUserWithEmail, HospitalUser } from '../../firebase/userService';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const handleLogin = async (): Promise<void> => {
    // 1️⃣ 입력값 검증
    if (!email.trim() || !password.trim()) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!email.includes('@')) {
      alert('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (password.length < 6) {
      alert('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    // 2️⃣ 로그인 시도
    const user: HospitalUser | null = await loginUserWithEmail(email, password);

    if (user) {
      alert(`환영합니다, ${user.name}님!`);
      setEmail('');
      setPassword('');
      router.push('/dashboard');
    } else {
      // 로그인 실패 시 input 초기화
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4 fw-bold">로그인</h3>
        <input
          className="form-control mb-3"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="form-control mb-3"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} className="btn btn-primary w-100 mt-2">
          로그인
        </button>
        <div className="text-center mt-3">
          <Link href="/register" className="text-decoration-none">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
