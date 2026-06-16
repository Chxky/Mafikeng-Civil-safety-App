import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import OfflineBanner from './OfflineBanner';
import { useNetwork } from '../hooks/useNetwork';

export default function Layout({ children }) {
  const { isOnline } = useNetwork();
  const location = useLocation();
  const hideNav = ['/admin', '/ussd'].includes(location.pathname);

  return (
    <div className="page-container bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-civic-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to content
      </a>
      {!isOnline && <OfflineBanner />}
      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
