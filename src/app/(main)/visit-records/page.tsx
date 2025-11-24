'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Table, Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../context/AuthContext';

interface Patient {
  id: string;
  chartNo: string;
  name: string;
  firstVisit: string;
  hospitalId: string;
}

interface Visit {
  id: string;
  chartNo: string;
  name: string;
  visitDate: string;
  type: string;
  memo?: string;
  hospitalId: string;
}

export default function VisitRecordsPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // 검색 관련 상태
  const [searchType, setSearchType] = useState<'chartNo' | 'name'>('chartNo');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [memo, setMemo] = useState('');

  // 오늘 날짜 포맷
  const today = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '');
  const selectedDate = date.toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '');

  // ✅ Firestore 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.hospitalId) return;
      setLoading(true);

      try {
        const qPatients = query(
          collection(db, 'PatientList'),
          where('hospitalId', '==', user.hospitalId)
        );
        const qVisits = query(
          collection(db, 'VisitRecords'),
          where('hospitalId', '==', user.hospitalId)
        );

        const [patientsSnap, visitsSnap] = await Promise.all([
          getDocs(qPatients),
          getDocs(qVisits),
        ]);

        setPatients(
          patientsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Patient[]
        );
        setVisits(
          visitsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Visit[]
        );
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredVisits = visits.filter((v) => v.visitDate === selectedDate);

  // ✅ 내원기록 추가
  const handleAddVisit = async () => {
    if (!user?.hospitalId) return alert('로그인 정보가 없습니다.');
    if (!selectedPatient) return alert('환자를 선택해주세요.');

    const visitDate = today;
    const type = visitDate === selectedPatient.firstVisit ? '초진' : '재진';

    try {
      const newRecord = {
        chartNo: selectedPatient.chartNo,
        name: selectedPatient.name,
        visitDate,
        type,
        memo,
        hospitalId: user.hospitalId,
      };

      const docRef = await addDoc(collection(db, 'VisitRecords'), newRecord);
      setVisits((prev) => [...prev, { id: docRef.id, ...newRecord } as Visit]);
      setShowAddModal(false);
      setSelectedPatient(null);
      setMemo('');
      alert('내원 기록이 추가되었습니다 ✅');
    } catch (error) {
      console.error('내원기록 추가 오류:', error);
      alert('추가 중 오류가 발생했습니다.');
    }
  };

  // ✅ 환자 검색
const handleSearch = () => {
  const trimmed = searchTerm.trim();
  if (!trimmed) {
    setSearchResults([]);
    return;
  }

  // 차트번호 검색
  if (searchType === 'chartNo') {
    // 🔥 입력값에서 숫자만 추출
    const cleanTerm = trimmed.replace(/\D/g, '');
    if (!cleanTerm) {
      setSearchResults([]);
      return;
    }

    const results = patients.filter((p) => {
      const chart = (p.chartNo ?? '').toString();
      // 혹시라도 DB에 이상한 값 들어갔을 대비해서 숫자만 추출
      const cleanChart = chart.replace(/\D/g, '');
      return cleanChart.includes(cleanTerm);
    });

    setSearchResults(results);
    return;
  }

  // 이름 검색
  const results = patients.filter((p) =>
    (p.name ?? '').includes(trimmed)
  );
  setSearchResults(results);
};
const isAddValid = selectedPatient !== null && memo.trim() !== '';

  if (loading) return <p className="text-center mt-5">로딩 중...</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>내원 기록</h2>
        {selectedDate === today && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            + 내원 추가
          </Button>
        )}
      </div>

      <div className="d-flex flex-column flex-lg-row gap-4">
        <div className="flex-shrink-0">
          <Calendar
            onChange={(value) => setDate(value as Date)}
            value={date}
            maxDate={new Date()} // 🔒 미래 날짜 선택 불가
            className="border rounded shadow-sm p-3"
          />
        </div>

        <div className="flex-grow-1">
          <h5 className="mb-3">
            {selectedDate} 내원 환자 ({filteredVisits.length}명)
          </h5>

          <Table striped bordered hover responsive>
            <thead className="table-dark text-center">
              <tr>
                <th>차트번호</th>
                <th>이름</th>
                <th>내원유형</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => {
                      setSelectedVisit(v);
                      setShowDetailModal(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{v.chartNo}</td>
                    <td>{v.name}</td>
                    <td>{v.type}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>해당 날짜에 내원 환자가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* 상세 모달 */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>내원 상세 정보</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <>
              <p><strong>차트번호:</strong> {selectedVisit.chartNo}</p>
              <p><strong>이름:</strong> {selectedVisit.name}</p>
              <p><strong>내원일자:</strong> {selectedVisit.visitDate}</p>
              <p><strong>유형:</strong> {selectedVisit.type}</p>
              <p><strong>메모:</strong> {selectedVisit.memo || '기록 없음'}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 내원 추가 모달 */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>새 내원 기록 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* 검색 옵션 */}
            <Form.Group className="mb-3">
              <Form.Label>검색 조건</Form.Label>
            <Form.Select
  value={searchType}
  onChange={(e) => {
    const value = e.target.value as 'chartNo' | 'name';
    setSearchType(value);

    setSearchTerm('');
    setSearchResults([]);
    setSelectedPatient(null);
  }}
>
  
  <option value="chartNo">차트번호로 검색</option>
  <option value="name">이름으로 검색</option>
</Form.Select>
            </Form.Group>

            {/* 검색창 */}
            <InputGroup className="mb-3">
              <Form.Control
    type={searchType === 'chartNo' ? 'number' : 'text'}  // 🔥 여기 추가
    placeholder={
      searchType === 'chartNo'
        ? '차트번호를 입력하세요'
        : '이름을 입력하세요'
    }
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
              <Button variant="outline-primary" onClick={handleSearch}>
                검색
              </Button>
            </InputGroup>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>검색 결과</Form.Label>
                <Form.Select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const found = searchResults.find((p) => p.id === e.target.value);
                    setSelectedPatient(found || null);
                  }}
                >
                  <option value="">환자 선택...</option>
                  {searchResults.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.chartNo})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {selectedPatient && (
              <p>
                <strong>초진일자:</strong> {selectedPatient.firstVisit}
              </p>
            )}

            <Form.Group>
              <Form.Label>메모</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            취소
          </Button>
        <Button
  variant="primary"
  onClick={handleAddVisit}
  disabled={!isAddValid}
>
  추가하기
</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
