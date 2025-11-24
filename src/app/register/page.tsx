'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { registerUserWithEmail } from '../../firebase/userService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Hospital {
  id: string;          // 문서 ID
  hospitalId: string;  // 병원 고유 아이디 (코드)
  name: string;        // 병원 이름
}

export default function RegisterPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalDocId, setSelectedHospitalDocId] = useState<string>('');

  // 🔹 병원 목록 불러오기
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'hospitalList')); 
        const list: Hospital[] = snapshot.docs.map((doc) => {
         
          const data = doc.data() as { hospitalId: string; hospitalName: string };

          return {
            id: doc.id,
            hospitalId: data.hospitalId,
            name: data.hospitalName,
  
          };
        });
        setHospitals(list);
        console.log(setHospitals(list))
      } catch (err) {
        console.error('병원 목록 불러오기 오류:', err);
        alert('병원 목록을 불러오는 중 문제가 발생했습니다.');
      }
    };

    fetchHospitals();
  }, []);

  const handleRegister = async (): Promise<void> => {
    // 1️⃣ 입력값 검증
    if (!email.trim() || !password.trim() || !name.trim()) {
      alert('이메일, 비밀번호, 이름을 모두 입력해주세요.');
      return;
    }
    if (!selectedHospitalDocId) {
      alert('병원을 선택해주세요.');
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

    // 선택된 병원 정보 찾기
    const selectedHospital = hospitals.find((h) => h.id === selectedHospitalDocId);
    if (!selectedHospital) {
      alert('선택한 병원을 찾을 수 없습니다.');
      return;
    }

    try {
      await registerUserWithEmail(
        email,
        password,
        name,
        selectedHospital.hospitalId, // 병원 아이디
        selectedHospital.name        // 병원 이름
      );
      alert('회원가입이 완료되었습니다!');

      // 입력 초기화
      setEmail('');
      setPassword('');
      setName('');
      setSelectedHospitalDocId('');

      window.location.href = '/login';
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'auth/email-already-in-use') {
          alert('이미 사용 중인 이메일입니다.');
        } else {
          alert('회원가입 중 오류가 발생했습니다.');
        }
      } else {
        alert('회원가입 중 알 수 없는 오류가 발생했습니다.');
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

        {/* 🔹 병원 선택 드롭다운 */}
        <select
          className="form-control mb-3"
          value={selectedHospitalDocId}
          onChange={(e) => setSelectedHospitalDocId(e.target.value)}
        >
          <option value="">병원을 선택해주세요</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.hospitalId})
            </option>
          ))}
        </select>

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
