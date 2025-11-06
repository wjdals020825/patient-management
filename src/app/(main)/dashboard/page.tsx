'use client';
import { Card } from 'react-bootstrap';

export default function DashboardPageContent() {
  return (
    <div>
      <h2>대시보드</h2>
      <div className="d-flex gap-3 my-4">
        <Card className="flex-fill text-center p-3">총 환자 수: 123</Card>
        <Card className="flex-fill text-center p-3">금일 내원: 5</Card>
        <Card className="flex-fill text-center p-3">금일 신환: 2</Card>
        <Card className="flex-fill text-center p-3">금일 재진: 3</Card>
      </div>
      <div className="my-4">[차트 영역 더미]</div>
    </div>
  );
}
