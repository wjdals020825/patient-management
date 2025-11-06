'use client';
import { Card, Form, Button } from 'react-bootstrap';

export default function SettingsPage() {
  return (
    <div>
      <h2>환경설정</h2>
      <Card className="p-3 my-3" style={{ maxWidth: '400px' }}>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>이름</Form.Label>
            <Form.Control type="text" placeholder="이름 입력" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>비밀번호</Form.Label>
            <Form.Control type="password" placeholder="새 비밀번호 입력" />
          </Form.Group>
          <Button variant="success" type="submit">저장</Button>
        </Form>
      </Card>
    </div>
  );
}
