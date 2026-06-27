import { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './hooks/useLanguage';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CopyrightFooter from './components/CopyrightFooter';
import { ListSkeleton } from './components/Skeleton';

// Code-split all page components for better initial load performance
const Home = lazy(() => import('./pages/Home'));
const Report = lazy(() => import('./pages/Report'));
const MyReports = lazy(() => import('./pages/MyReports'));
const SafetyFeed = lazy(() => import('./pages/SafetyFeed'));
const MapView = lazy(() => import('./pages/MapView'));
const Profile = lazy(() => import('./pages/Profile'));

const PatrolMode = lazy(() => import('./pages/PatrolMode'));
const USSDBot = lazy(() => import('./pages/USSDBot'));
const SignUp = lazy(() => import('./pages/SignUp'));
const CommunityLeaders = lazy(() => import('./pages/CommunityLeaders'));
const PowerScreen = lazy(() => import('./pages/PowerScreen'));
const EduTransScreen = lazy(() => import('./pages/EduTransScreen'));
const DisasterShieldScreen = lazy(() => import('./pages/DisasterShieldScreen'));
const HealthcareScreen = lazy(() => import('./pages/HealthcareScreen'));
const WaterQualityScreen = lazy(() => import('./pages/WaterQualityScreen'));
const JobsScreen = lazy(() => import('./pages/JobsScreen'));
const MarketplaceScreen = lazy(() => import('./pages/MarketplaceScreen'));
const DocumentsScreen = lazy(() => import('./pages/DocumentsScreen'));
import { syncPendingReports } from './db/offline';
import { submitReport } from './db/api';
import { showToast } from './utils/helpers';


function SyncManager() {
  useEffect(() => {
    const handleOnline = async () => {
      const result = await syncPendingReports({ submitReport });
      if (result.success > 0) {
        showToast?.(`Synced ${result.success} offline report(s)`, 'success');
      }
    };
    window.addEventListener('online', handleOnline);
    // Also try on mount
    handleOnline();
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
    <LanguageProvider>
      <Router>
        <SyncManager />
        <Layout>
          <Suspense fallback={
            <div className="p-4 min-h-[60vh]">
              <div className="flex flex-col items-center justify-center mb-8 py-8">
                <div className="w-8 h-8 border-4 border-civic-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">Loading...</p>
              </div>
              <ListSkeleton count={4} />
            </div>
          }>
          <Routes>
            <Route path="/" element={<div className="animate-fade-in"><Home /></div>} />
            <Route path="/report" element={<div className="animate-fade-in"><Report /></div>} />
            <Route path="/my-reports" element={<div className="animate-fade-in"><MyReports /></div>} />
            <Route path="/safety" element={<div className="animate-fade-in"><SafetyFeed /></div>} />
            <Route path="/map" element={<div className="animate-fade-in"><MapView /></div>} />
            <Route path="/power" element={<div className="animate-fade-in"><PowerScreen /></div>} />
            <Route path="/edutrans" element={<div className="animate-fade-in"><EduTransScreen /></div>} />
            <Route path="/disaster" element={<div className="animate-fade-in"><DisasterShieldScreen /></div>} />
            <Route path="/profile" element={<div className="animate-fade-in"><Profile /></div>} />

            <Route path="/patrol" element={<div className="animate-fade-in"><PatrolMode /></div>} />
            <Route path="/ussd" element={<div className="animate-fade-in"><USSDBot /></div>} />
            <Route path="/signup" element={<div className="animate-fade-in"><SignUp /></div>} />
            <Route path="/leaders" element={<div className="animate-fade-in"><CommunityLeaders /></div>} />
            <Route path="/healthcare" element={<div className="animate-fade-in"><HealthcareScreen /></div>} />
            <Route path="/water" element={<div className="animate-fade-in"><WaterQualityScreen /></div>} />
            <Route path="/jobs" element={<div className="animate-fade-in"><JobsScreen /></div>} />
            <Route path="/marketplace" element={<div className="animate-fade-in"><MarketplaceScreen /></div>} />
            <Route path="/documents" element={<div className="animate-fade-in"><DocumentsScreen /></div>} />
          </Routes>
          </Suspense>
        </Layout>
        <CopyrightFooter />
        <PWAInstallPrompt />
        <Toast />
      </Router>
    </LanguageProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
