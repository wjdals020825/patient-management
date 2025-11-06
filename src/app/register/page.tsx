'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerUserWithEmail } from '../../firebase/userService';

export default function RegisterPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('');

  const handleRegister = async (): Promise<void> => {
    // 1️⃣ 입력값 검증
    if (!email.trim() || !password.trim() || !name.trim() || !hospitalName.trim()) {
      alert('모든 항목을 입력해주세요.');
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

    // 2️⃣ 회원가입 시도
    try {
      await registerUserWithEmail(email, password, name, hospitalName);
      alert('회원가입이 완료되었습니다!');

      // 입력 초기화
      setEmail('');
      setPassword('');
      setName('');
      setHospitalName('');

      window.location.href = '/login';
    } catch (error: unknown) {
      // Firebase Auth 오류 처리
      if (error instanceof Error && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'auth/email-already-in-use') {
          alert('이미 사용 중인 이메일입니다.');
        } else {
          alert('회원가입 중 오류가 발생했습니다.');
        }
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '500px' }}>
        <h3 className="text-center mb-4 fw-bold">회원가입</h3>
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
        <input
          className="form-control mb-3"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="form-control mb-3"
          placeholder="병원명"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
        />
        <button onClick={handleRegister} className="btn btn-success w-100 mt-2">
          회원가입 완료
        </button>
        <div className="text-center mt-3">
          <Link href="/login" className="text-decoration-none">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
