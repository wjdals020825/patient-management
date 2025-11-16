'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../context/AuthContext';

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

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

function formatDateK(date: Date): string {
  return date
    .toLocaleDateString('ko-KR') // 2025. 11. 16.
    .replace(/\. /g, '-')
    .replace('.', ''); // 2025-11-16
}

function getLast7Days(): string[] {
  const today = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    days.push(formatDateK(d));
  }
  return days;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const today = formatDateK(new Date());
  const last7Days = getLast7Days();

  // ==============================
  // 🔥 병원별 환자 / 내원기록 로드
  // ==============================
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.hospitalId) return;
      setLoading(true);

      try {
        // 병원별 환자 데이터
        const patientQuery = query(
          collection(db, 'PatientList'),
          where('hospitalId', '==', user.hospitalId)
        );
        const patientSnap = await getDocs(patientQuery);
        const patientData = patientSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Patient, 'id'>),
        }));

        // 병원별 내원 기록 데이터
        const visitQuery = query(
          collection(db, 'VisitRecords'),
          where('hospitalId', '==', user.hospitalId)
        );
        const visitSnap = await getDocs(visitQuery);
        const visitData = visitSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Visit, 'id'>),
        }));

        setPatients(patientData);
        setVisits(visitData);
      } catch (err) {
        console.error('대시보드 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ==============================
  // 🔥 KPI 계산
  // ==============================
  const totalPatients = patients.length;

  const todayVisits = visits.filter((v) => v.visitDate === today);
  const todayVisitCount = todayVisits.length;

  const todayNewPatients = patients.filter(
    (p) => p.firstVisit === today
  ).length;

  const todayReturnVisits = todayVisits.filter(
    (v) => v.type === '재진'
  ).length;

  // ==============================
  // 🔥 최근 7일 차트 데이터
  // ==============================
  const visitsPerDay = last7Days.map(
    (d) => visits.filter((v) => v.visitDate === d).length
  );
  const newPerDay = last7Days.map(
    (d) => visits.filter((v) => v.visitDate === d && v.type === '초진').length
  );
  const returnPerDay = last7Days.map(
    (d) => visits.filter((v) => v.visitDate === d && v.type === '재진').length
  );

  const baseChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  const totalVisitChartData = {
    labels: last7Days,
    datasets: [
      {
        label: '총 내원 수',
        data: visitsPerDay,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const newVisitChartData = {
    labels: last7Days,
    datasets: [
      {
        label: '신환(초진) 수',
        data: newPerDay,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const returnVisitChartData = {
    labels: last7Days,
    datasets: [
      {
        label: '재진 수',
        data: returnPerDay,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  // ==============================
  // 🔥 Render
  // ==============================
  if (loading)
    return (
      <div className="container mt-5 text-center">
        <h5>대시보드를 불러오는 중입니다...</h5>
      </div>
    );

  return (
    <div className="container mt-4">
      <h2 className="mb-4">대시보드</h2>

      {/* KPI 카드 */}
      <Row className="mb-4 g-3">
        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>총 환자 수</Card.Title>
              <Card.Text className="display-6 fw-bold">{totalPatients}</Card.Text>
              <small className="text-muted">전체 등록 환자</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>오늘 내원</Card.Title>
              <Card.Text className="display-6 fw-bold">{todayVisitCount}</Card.Text>
              <small className="text-muted">{today}</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>오늘 신환</Card.Title>
              <Card.Text className="display-6 fw-bold">{todayNewPatients}</Card.Text>
              <small className="text-muted">{today}</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>오늘 재진</Card.Title>
              <Card.Text className="display-6 fw-bold">{todayReturnVisits}</Card.Text>
              <small className="text-muted">{today}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 차트 */}
      <Row className="g-4">
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>최근 7일 총 내원 수</Card.Title>
              <Line data={totalVisitChartData} options={baseChartOptions} />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>최근 7일 신환 수</Card.Title>
              <Line data={newVisitChartData} options={baseChartOptions} />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>최근 7일 재진 수</Card.Title>
              <Line data={returnVisitChartData} options={baseChartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
