import { auth, db } from './config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';

// HospitalUser 인터페이스 정의
export interface HospitalUser {
  uid: string;
  email: string;
  name: string;
  hospitalName: string;
  hospitalId: string;
}

// 병원 리스트 타입
export interface HospitalInfo {
  hospitalId: string;
  hospitalName: string;
}

// 회원가입 함수
export const registerUserWithEmail = async (
  email: string,
  password: string,
  name: string,
  hospitalName: string
): Promise<string> => {
  const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid: string = userCredential.user.uid;
  const hospitalId: string = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  // hospitalUser 저장
  const userData: HospitalUser = { uid, email, name, hospitalName,hospitalId};
  await setDoc(doc(db, 'hospitalUser', uid), userData);

  // hospitalList 저장
  const hospitalData: HospitalInfo = { hospitalId, hospitalName };
  await setDoc(doc(db, 'hospitalList', hospitalId), hospitalData);

  return uid;
};

// 로그인 함수
export const loginUserWithEmail = async (
  email: string,
  password: string
): Promise<HospitalUser | null> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid: string = userCredential.user.uid;

    const userSnap = await getDoc(doc(db, 'hospitalUser', uid));
    if (!userSnap.exists()) {
      alert('미가입된 회원입니다. 회원가입을 진행해주세요.');
      return null;
    }

    const userData = userSnap.data() as HospitalUser;
    return userData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ('code' in error) {
        // Firebase Auth 에러 코드 체크
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (error as any).code as string;
        if (code === 'auth/user-not-found') {
          alert('미가입된 회원입니다. 회원가입을 진행해주세요.');
        } else if (code === 'auth/wrong-password') {
          alert('비밀번호가 일치하지 않습니다.');
        } else if (code === 'auth/email-already-in-use') {
          alert('이미 사용 중인 이메일입니다.');
        } else {
          alert('로그인/회원가입 중 오류가 발생했습니다.');
        }
      }
    }
    return null;
  }
};
