'use client';
import Sidebar from '../components/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-3 bg-light" style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}
