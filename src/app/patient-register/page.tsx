'use client';
import { Table, Button, Card } from 'react-bootstrap';

export default function PatientRegisterPage() {
  return (
    <div>
      <h2>환자 등록</h2>
      <Card className="p-3 my-3">
        <Button variant="primary">엑셀 업로드</Button>
      </Card>

      <Card className="p-3">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>차트번호</th>
              <th>이름</th>
              <th>주민등록번호</th>
              <th>초진일자</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>001</td>
              <td>홍길동</td>
              <td>011222-1</td>
              <td>2025-10-29</td>
            </tr>
            <tr>
              <td>002</td>
              <td>김철수</td>
              <td>020101-2</td>
              <td>2025-10-29</td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
