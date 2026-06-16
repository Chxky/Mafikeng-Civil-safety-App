import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCivicReports } from '../db/mockApi';
import { getPendingReports } from '../db/offline';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Icon from '../components/Icon';
import { CATEGORIES, STATUSES, URGENCY_LEVELS, timeAgo, formatDateTime } from '../utils/helpers';

export default function MyReports() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [pendingOffline, setPendingOffline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <Icon name="arrowLeft" className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">{t('my_reports')}</h1>
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
              {key === 'all' ? t('view_all') : STATUSES[key]?.label || key} ({count})
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
            <Icon name="documentText" className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
            <p className="text-gray-400 font-medium">{t('no_reports_found')}</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? t('start_reporting') : t('no_status_reports', { status: STATUSES[filter]?.label?.toLowerCase() || '' })}
            </p>
            <button
              onClick={() => navigate('/report')}
              className="btn-primary mt-4 text-sm"
            >
              {t('report_an_issue')}
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
                              📡 {t('offline')}
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
                        <span>{t('reported')} {formatDateTime(report.created_at)}</span>
                        <span>{t('report_id')}: {report.id.substring(0, 8)}</span>
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
