import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Report from './pages/Report';
import MyReports from './pages/MyReports';
import SafetyFeed from './pages/SafetyFeed';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import PatrolMode from './pages/PatrolMode';
import USSDBot from './pages/USSDBot';
import SignUp from './pages/SignUp';
import CommunityLeaders from './pages/CommunityLeaders';
import Toast from './components/Toast';
import CopyrightFooter from './components/CopyrightFooter';
import { syncPendingReports } from './db/offline';
import { submitReport } from './db/mockApi';
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
    <AuthProvider>
      <Router>
        <SyncManager />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/safety" element={<SafetyFeed />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/patrol" element={<PatrolMode />} />
            <Route path="/ussd" element={<USSDBot />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/leaders" element={<CommunityLeaders />} />
          </Routes>
        </Layout>
        <CopyrightFooter />
        <Toast />
      </Router>
    </AuthProvider>
  );
}
