import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCivicReports, updateReportStatus, getDashboardStats, getSafetyIncidents, removeIncident } from '../db/mockApi';
import { CATEGORIES, STATUSES, URGENCY_LEVELS, timeAgo, showToast } from '../utils/helpers';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reportsRes, incidentsRes, statsRes] = await Promise.all([
        getCivicReports(),
        getSafetyIncidents(),
        getDashboardStats(),
      ]);
      setReports(reportsRes.data || []);
      setIncidents(incidentsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(reportId, newStatus) {
    setUpdatingId(reportId);
    try {
      const response = prompt('Add a response note (optional):');
      await updateReportStatus(reportId, newStatus, response || undefined);
      showToast?.(`Report status updated to ${STATUSES[newStatus]?.label}`, 'success');
      loadData();
    } catch (err) {
      showToast?.('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemoveIncident(incidentId) {
    if (!confirm('Remove this incident? This action cannot be undone.')) return;

    try {
      await removeIncident(incidentId, null, 'Removed by moderator');
      showToast?.('Incident removed', 'success');
      loadData();
    } catch (err) {
      showToast?.('Failed to remove incident', 'error');
    }
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-civic-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['overview', 'reports', 'incidents'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-civic-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="px-4 py-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-xs text-gray-500">Total Reports</p>
              <p className="text-3xl font-bold text-civic-600">{stats.totalReports}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Resolution Rate</p>
              <p className="text-3xl font-bold text-safety-600">{stats.resolutionRate}%</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-3xl font-bold text-warning-600">{stats.byStatus.pending}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Active Alerts</p>
              <p className="text-3xl font-bold text-danger-600">{stats.activeAlerts}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h3 className="font-bold text-sm mb-4">Category Performance</h3>
            <div className="space-y-3">
              {Object.entries(stats.byCategory || {}).map(([cat, data]) => {
                const catInfo = CATEGORIES[cat] || CATEGORIES.other;
                const rate = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(0) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{catInfo.icon}</span>
                        <span className="text-sm">{catInfo.label}</span>
                      </div>
                      <span className="text-sm font-medium">{rate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-safety-500 h-2 rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{data.total} total</span>
                      <span>{data.resolved} resolved</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Average Resolution Time */}
          <div className="card">
            <h3 className="font-bold text-sm mb-2">Average Resolution Time</h3>
            <p className="text-4xl font-bold text-civic-600">{stats.avgResolutionDays}</p>
            <p className="text-sm text-gray-500">days</p>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="px-4 py-4">
          <div className="space-y-3">
            {reports.map(report => {
              const cat = CATEGORIES[report.category] || CATEGORIES.other;
              const status = STATUSES[report.status] || STATUSES.pending;
              const urgency = URGENCY_LEVELS[report.urgency] || URGENCY_LEVELS.normal;

              return (
                <div key={report.id} className="card">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg">{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{report.title}</h3>
                      <p className="text-xs text-gray-500">{report.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${status.bg} ${status.color}`}>{status.label}</span>
                        <span className={`badge ${urgency.bg} ${urgency.color}`}>{urgency.label}</span>
                        <span className="text-xs text-gray-400">{timeAgo(report.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {report.description && (
                    <p className="text-xs text-gray-600 mb-3">{report.description}</p>
                  )}

                  {/* Status Update Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {report.status !== 'acknowledged' && (
                      <button
                        onClick={() => handleStatusChange(report.id, 'acknowledged')}
                        disabled={updatingId === report.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-civic-100 text-civic-700 font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                    {report.status !== 'in_progress' && report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report.id, 'in_progress')}
                        disabled={updatingId === report.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report.id, 'resolved')}
                        disabled={updatingId === report.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-safety-100 text-safety-700 font-medium"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  {report.municipality_response && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500">Response:</p>
                      <p className="text-xs text-gray-600">{report.municipality_response}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="px-4 py-4">
          <div className="space-y-3">
            {incidents.map(incident => {
              const typeInfo = CATEGORIES[incident.incident_type] || { label: 'Other', icon: '📋' };

              return (
                <div key={incident.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm">Community Member</span>
                      <p className="text-xs text-gray-500">{incident.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-gray-100 text-gray-600">{incident.confirmations} confirmed</span>
                      <span className="badge bg-danger-100 text-danger-600">{incident.flags} flags</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{incident.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{timeAgo(incident.created_at)}</span>
                    <button
                      onClick={() => handleRemoveIncident(incident.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-danger-100 text-danger-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
