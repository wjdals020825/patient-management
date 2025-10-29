'use client';

import { useEffect } from 'react';

export default function BootstrapClient() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js')
      .then(() => console.log('✅ Bootstrap JS 로드 완료'))
      .catch((err) => console.error('Bootstrap JS 로드 실패:', err));
  }, []);

  return null;
}
