import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCivicReports } from '../db/mockApi';
import { getPendingReports } from '../db/offline';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES, STATUSES, URGENCY_LEVELS, timeAgo, formatDateTime } from '../utils/helpers';

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [pendingOffline, setPendingOffline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const [apiRes, offlineRes] = await Promise.all([
        getCivicReports({ userTokenId: user?.id }),
        getPendingReports(),
      ]);
      setReports(apiRes.data || []);
      setPendingOffline(offlineRes || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  const allReports = [
    ...pendingOffline.map(r => ({ ...r, _offline: true })),
    ...reports,
  ];

  const filteredReports = filter === 'all'
    ? allReports
    : allReports.filter(r => r.status === filter);

  const statusCounts = {
    all: allReports.length,
    pending: allReports.filter(r => r.status === 'pending').length,
    acknowledged: allReports.filter(r => r.status === 'acknowledged').length,
    in_progress: allReports.filter(r => r.status === 'in_progress').length,
    resolved: allReports.filter(r => r.status === 'resolved').length,
  };

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">My Reports</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-civic-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {key === 'all' ? 'All' : STATUSES[key]?.label || key} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p className="text-gray-400 font-medium">No reports found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? 'Start by reporting an issue' : `No ${STATUSES[filter]?.label?.toLowerCase() || ''} reports`}
            </p>
            <button
              onClick={() => navigate('/report')}
              className="btn-primary mt-4 text-sm"
            >
              Report an Issue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(report => {
              const cat = CATEGORIES[report.category] || CATEGORIES.other;
              const status = STATUSES[report.status] || STATUSES.pending;
              const urgency = URGENCY_LEVELS[report.urgency] || URGENCY_LEVELS.normal;
              const isExpanded = expandedId === report.id;

              return (
                <div
                  key={report.id}
                  className="card overflow-hidden"
                >
                  {/* Main content */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-lg">{cat.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-gray-900">
                            {report.title}
                          </h3>
                          <span className={`badge ${status.bg} ${status.color} flex-shrink-0`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {report.address || 'Mahikeng'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {report._offline && (
                            <span className="badge bg-warning-100 text-warning-700">
                              📡 Offline
                            </span>
                          )}
                          <span className={`badge ${urgency.bg} ${urgency.color}`}>
                            {urgency.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {timeAgo(report.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details with status timeline */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                      {report.description && (
                        <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                      )}

                      {/* Photos */}
                      {report.photo_urls?.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto">
                          {report.photo_urls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Report photo ${i + 1}`}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      {/* Status Timeline */}
                      <div className="status-timeline">
                        {['pending', 'acknowledged', 'in_progress', 'resolved'].map((statusKey, idx) => {
                          const statusInfo = STATUSES[statusKey];
                          const isCurrentOrPast = ['pending', 'acknowledged', 'in_progress', 'resolved']
                            .indexOf(report.status) >= idx;

                          return (
                            <div key={statusKey} className="relative pb-4 last:pb-0">
                              <div
                                className={`status-dot ${
                                  isCurrentOrPast ? statusInfo.dot : 'bg-gray-200'
                                }`}
                              />
                              <div className="ml-2">
                                <p className={`text-sm font-medium ${
                                  isCurrentOrPast ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                  {statusInfo.label}
                                </p>
                                {statusKey === report.status && report.municipality_response && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {report.municipality_response}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Metadata */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                        <span>Reported {formatDateTime(report.created_at)}</span>
                        <span>ID: {report.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
