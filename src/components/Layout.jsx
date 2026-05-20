import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import OfflineBanner from './OfflineBanner';
import { useNetwork } from '../hooks/useNetwork';

export default function Layout({ children }) {
  const { isOnline } = useNetwork();
  const location = useLocation();
  const hideNav = ['/admin', '/ussd'].includes(location.pathname);

  return (
    <div className="page-container bg-gray-50 min-h-screen">
      {!isOnline && <OfflineBanner />}
      <main className="flex-1">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
