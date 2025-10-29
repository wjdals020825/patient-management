'use client';
import { useEffect, useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import DashboardPageContent from '../dashboard/DashboardContent';
import PatientRegisterPage from '../patient-register/page';
import VisitRecordsPage from '../visit-records/page';
import SettingsPage from '../settings/page';

export default function MainLayout() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardPageContent />;
      case 'patient-register':
        return <PatientRegisterPage />;
      case 'visit-records':
        return <VisitRecordsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPageContent />;
    }
  };

  return (
    <div className="d-flex">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="flex-grow-1 p-3 bg-light" style={{ minHeight: '100vh' }}>
        {renderContent()}
      </div>
    </div>
  );
}
