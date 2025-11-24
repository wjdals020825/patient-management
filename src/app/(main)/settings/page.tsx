'use client';

import { useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../../../context/AuthContext';
import { updateUserPassword, updateUserName } from '../../../firebase/userService';


export default function SettingsPage() {
  const { user,setUser } = useAuth();

  // 🔹 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordCheck, setNewPasswordCheck] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 🔹 이름 변경 상태
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);


  const isPasswordValid =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length >= 6 &&
    newPassword === newPasswordCheck;

  const isNameValid =
    newName.trim().length > 0 &&
    newName.trim() !== (user?.name ?? '');

  // ✅ 비밀번호 변경
  const handleChangePassword = async () => {
    if (!isPasswordValid) {
      alert('입력값을 확인해주세요.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('새 비밀번호가 기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      alert('비밀번호가 성공적으로 변경되었습니다!');

      // 성공 시 초기화
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordCheck('');
    } catch (error) {
      // 실패 시에도 초기화
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordCheck('');

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/wrong-password') {
          alert('현재 비밀번호가 올바르지 않습니다.');
        } else {
          alert('비밀번호 변경 중 오류가 발생했습니다.');
        }
      } else {
        console.error(error);
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // ✅ 이름 변경
  const handleChangeName = async () => {
   
    if (!user) {
      alert('로그인 정보가 없습니다.');
      return;
    }

    if (!isNameValid) {
      alert('이름을 다시 확인해주세요.');
      return;
    }

    setNameLoading(true);
    try {
      await updateUserName(user.uid, newName.trim());
      setUser((prev) => prev ? { ...prev, name: newName } : prev);
      alert('이름이 변경되었습니다!');


    } catch (error) {
      console.log(error)
      if (error instanceof FirebaseError) {
        alert('이름 변경 중 오류가 발생했습니다.');
      } else {
        console.error(error);
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setNameLoading(false);
    }
     setNewName('');
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">환경 설정</h3>

      <div className="row g-4 align-items-stretch">
        {/* 🔹 왼쪽: 비밀번호 변경 */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-3">비밀번호 변경</h5>

            <input
              type="password"
              className="form-control mb-3"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <input
              type="password"
              className="form-control mb-3"
              placeholder="새 비밀번호 (6자리 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              className="form-control mb-4"
              placeholder="새 비밀번호 확인"
              value={newPasswordCheck}
              onChange={(e) => setNewPasswordCheck(e.target.value)}
            />

            <button
              className="btn btn-primary w-100"
              onClick={handleChangePassword}
              disabled={!isPasswordValid || passwordLoading}
            >
              {passwordLoading ? '변경 중...' : '비밀번호 변경하기'}
            </button>
          </div>
        </div>

        {/* 🔹 오른쪽: 이름 변경 */}
        <div className="col-12 col-md-6" >
          <div className="card shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-3">이름 변경</h5>

            <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
              현재 이름: <strong>{user?.name ?? '알 수 없음'}</strong>
            </p>

            <input
              type="text"
              className="form-control mb-4"
              placeholder="새 이름을 입력하세요"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <button
              className="btn btn-outline-success w-100"
              onClick={handleChangeName}
              disabled={!isNameValid || nameLoading}
            >
              {nameLoading ? '변경 중...' : '이름 변경하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
