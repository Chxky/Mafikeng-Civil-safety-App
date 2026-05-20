import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SOSButton from '../components/SOSButton';
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

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/report')}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-civic-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-civic-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Report Issue</span>
          </button>

          <button
            onClick={() => navigate('/my-reports')}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-safety-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-safety-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">My Reports</span>
          </button>

          <button
            onClick={() => navigate('/safety')}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Safety Feed</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Crime Map</span>
          </button>

          <button
            onClick={() => navigate('/leaders')}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Leaders</span>
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Sign Up</span>
          </button>

          <button
            onClick={() => window.location.href = 'tel:10111'}
            className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95 border-danger-200 bg-danger-50"
          >
            <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-danger-700">SAPS 10111</span>
          </button>
        </div>
      </div>

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
