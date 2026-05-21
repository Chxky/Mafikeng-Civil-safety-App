import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SOSButton from '../components/SOSButton';
import PowerWidget from '../components/PowerWidget';
import TransportWidget from '../components/TransportWidget';
import DisasterWidget from '../components/DisasterWidget';
import { useAuth } from '../hooks/useAuth';
import { getCivicReports, getDashboardStats } from '../db/mockApi';
import { CATEGORIES, STATUSES, timeAgo } from '../utils/helpers';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        getCivicReports(),
        getDashboardStats(),
      ]);
      setRecentReports(reportsRes.data?.slice(0, 5) || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-br from-civic-600 to-civic-800 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mahikeng</h1>
            <p className="text-civic-200 text-sm mt-0.5">
              {user?.displayName || 'Community Member'}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>

        {/* SOS Button */}
        <div className="flex justify-center -mb-16 relative z-10">
          <SOSButton />
        </div>
      </div>

      {/* Mahikeng Power Widget */}
      <PowerWidget />

      {/* Quick Stats */}
      {stats && (
        <div className="px-4 mt-20">
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-civic-600">{stats.totalReports}</p>
              <p className="text-xs text-gray-500 mt-1">Reports</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-safety-600">{stats.resolutionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Resolved</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-warning-600">{stats.totalIncidents}</p>
              <p className="text-xs text-gray-500 mt-1">Incidents</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Hub */}
      <div className="px-4 mt-6">
        <h2 className="section-title">Services Hub</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Power', icon: '⚡', path: '/power', color: 'bg-purple-100' },
            { label: 'Report', icon: '📝', path: '/report', color: 'bg-civic-100' },
            { label: 'Safety', icon: '🛡️', path: '/safety', color: 'bg-danger-100' },
            { label: 'Map', icon: '🗺️', path: '/map', color: 'bg-green-100' },
            { label: 'EduTrans', icon: '🚌', path: '/edutrans', color: 'bg-blue-100' },
            { label: 'Disaster', icon: '🛡️', path: '/disaster', color: 'bg-red-100' },
            { label: 'Leaders', icon: '👥', path: '/leaders', color: 'bg-amber-100' },
            { label: 'SAPS', icon: '📞', path: 'tel:10111', color: 'bg-danger-100', external: true },
          ].map(service => (
            <button
              key={service.label}
              onClick={() => service.external ? (window.location.href = service.path) : navigate(service.path)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:shadow-md transition-shadow active:scale-95"
            >
              <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center text-xl`}>
                {service.icon}
              </div>
              <span className="text-[11px] font-medium text-gray-600">{service.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module Widgets */}
      <TransportWidget />
      <DisasterWidget />

      {/* Emergency Hotline */}
      <div className="px-4 mt-6">
        <h2 className="section-title">Emergency Numbers</h2>
        <div className="card bg-danger-50 border-danger-200">
          <div className="space-y-3">
            {[
              { name: 'SAPS Emergency', number: '10111', desc: 'Police emergencies' },
              { name: 'Mahikeng SAPS Station', number: '018 381 8200', desc: 'Local police station' },
              { name: 'Ambulance / Fire', number: '10177', desc: 'Medical & fire emergencies' },
              { name: 'Municipality Hotline', number: '018 381 8200', desc: 'Service delivery issues' },
            ].map(emergency => (
              <button
                key={emergency.number}
                onClick={() => window.location.href = `tel:${emergency.number.replace(/\s/g, '')}`}
                className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-900">{emergency.name}</p>
                    <p className="text-xs text-gray-500">{emergency.desc}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-danger-600">{emergency.number}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Recent Reports</h2>
          <button
            onClick={() => navigate('/my-reports')}
            className="text-sm text-civic-600 font-medium"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">No reports yet</p>
            <button
              onClick={() => navigate('/report')}
              className="btn-primary mt-3 text-sm"
            >
              Report an Issue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReports.map(report => {
              const cat = CATEGORIES[report.category] || CATEGORIES.other;
              const status = STATUSES[report.status] || STATUSES.pending;

              return (
                <div key={report.id} className="feed-card">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg">{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {report.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {report.address || 'Mahikeng'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Municipality Scorecard Preview */}
      {stats && (
        <div className="px-4 mt-6 mb-6">
          <h2 className="section-title">Municipality Scorecard</h2>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Overall Resolution Rate</span>
              <span className="text-lg font-bold text-safety-600">{stats.resolutionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
              <div
                className="bg-safety-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${stats.resolutionRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Avg. Resolution</span>
                <p className="font-semibold">{stats.avgResolutionDays} days</p>
              </div>
              <div>
                <span className="text-gray-500">Active Alerts</span>
                <p className="font-semibold text-danger-600">{stats.activeAlerts}</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">BY CATEGORY</p>
              {Object.entries(stats.byCategory || {}).map(([cat, data]) => {
                const catInfo = CATEGORIES[cat] || CATEGORIES.other;
                const rate = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span>{catInfo.icon}</span>
                      <span className="text-xs text-gray-700">{catInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-safety-400 h-1.5 rounded-full"
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
