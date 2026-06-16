import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getCivicReports,
  updateReportStatus,
  getDashboardStats,
  getSafetyIncidents,
  removeIncident,
  getDepartmentNotifications,
} from '../db/mockApi';
import { getTransportRoutes, getTripHistory } from '../db/transportApi';
import { getDisasterReports, getWeatherWarnings } from '../db/disasterApi';
import {
  CATEGORIES,
  STATUSES,
  URGENCY_LEVELS,
  DEPARTMENTS,
  // eslint-disable-next-line no-unused-vars
  CATEGORY_TO_DEPARTMENT,
  showToast,
  timeAgo,
  formatDate,
} from '../utils/helpers';

export default function AdminDashboard() {
  const { user } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [reportsRes, incidentsRes, statsRes, notifRes] = await Promise.all([
      getCivicReports(),
      getSafetyIncidents(),
      getDashboardStats(),
      getDepartmentNotifications(),
    ]);
    setReports(reportsRes.data || []);
    setIncidents(incidentsRes.data || []);
    setStats(statsRes.data);
    setNotifications(notifRes.data || []);
    setLoading(false);
  }

  async function handleStatusChange(reportId, newStatus) {
    const response = prompt('Add a response note (optional):');
    if (response === null) return;

    setUpdatingId(reportId);
    const { error } = await updateReportStatus(reportId, newStatus, response || undefined);
    if (error) {
      showToast?.('Failed to update status', 'error');
    } else {
      showToast?.(`Report ${newStatus.replace('_', ' ')}`, 'success');
      await loadData();
    }
    setUpdatingId(null);
  }

  async function handleRemoveIncident(incidentId) {
    if (!confirm('Remove this incident? This action cannot be undone.')) return;

    const { error } = await removeIncident(incidentId, user?.id, 'Removed by moderator');
    if (error) {
      showToast?.('Failed to remove incident', 'error');
    } else {
      showToast?.('Incident removed', 'success');
      await loadData();
    }
  }

  // Filter reports
  const filteredReports = reports.filter(r => {
    if (filterDept && r.department !== filterDept) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterUrgency && r.urgency !== filterUrgency) return false;
    return true;
  });

  const [transportRoutes, setTransportRoutes] = useState([]);
  const [tripHistories, setTripHistories] = useState({});
  const [disasterReports, setDisasterReports] = useState([]);
  const [weatherWarnings, setWeatherWarnings] = useState([]);

  useEffect(() => {
    if (activeTab === 'transport') loadTransportData();
    if (activeTab === 'disaster') loadDisasterData();
  }, [activeTab]);

  async function loadTransportData() {
    const { data: routes } = await getTransportRoutes();
    setTransportRoutes(routes || []);
    const history = {};
    for (const route of (routes || [])) {
      const { data: trips } = await getTripHistory(route.id);
      history[route.id] = trips || [];
    }
    setTripHistories(history);
  }

  async function loadDisasterData() {
    const [reportsRes, warningsRes] = await Promise.all([
      getDisasterReports(),
      getWeatherWarnings(),
    ]);
    setDisasterReports(reportsRes.data || []);
    setWeatherWarnings(warningsRes.data || []);
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'departments', label: 'Departments', icon: '🏛️' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'incidents', label: 'Incidents', icon: '🚨' },
    { id: 'transport', label: 'Transport', icon: '🚌' },
    { id: 'disaster', label: 'Disaster', icon: '🛡️' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-civic-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Government Header */}
      <div className="bg-gradient-to-r from-civic-800 to-civic-600 text-white px-4 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Mahikeng Local Municipality</h1>
            <p className="text-xs text-civic-200">Service Delivery Dashboard</p>
          </div>
        </div>
        <p className="text-xs text-civic-300 mt-2">Ngaka Modiri Molema District • North West Province</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-2 sticky top-0 z-30">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-civic-600 text-civic-700'
                  : 'border-transparent text-gray-400'
              }`}
            >
              <span className="block text-base mb-0.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="px-4 py-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-civic-700">{stats.totalReports}</p>
              <p className="text-xs text-gray-500">Total Reports</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-safety-600">{stats.resolutionRate}%</p>
              <p className="text-xs text-gray-500">Resolution Rate</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-warning-600">{stats.byStatus.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.avgResolutionDays}d</p>
              <p className="text-xs text-gray-500">Avg Resolution</p>
            </div>
          </div>

          {/* Department Performance */}
          <div className="card">
            <h3 className="font-bold text-sm mb-3">Department Performance</h3>
            <div className="space-y-3">
              {Object.entries(DEPARTMENTS).map(([key, dept]) => {
                const deptStats = stats.byDepartment?.[key] || { total: 0, pending: 0, resolved: 0 };
                const rate = deptStats.total > 0 ? ((deptStats.resolved / deptStats.total) * 100).toFixed(0) : 0;

                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">{dept.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 truncate">{dept.shortName}</span>
                        <span className="text-xs text-gray-400">{deptStats.total} reports</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-safety-500 h-2 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-10 text-right">{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="card">
            <h3 className="font-bold text-sm mb-3">Recent Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No notifications yet</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map(n => {
                  const dept = DEPARTMENTS[n.department];
                  return (
                    <div key={n.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm">{dept?.icon || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-civic-500 mt-1"></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h3 className="font-bold text-sm mb-3">By Category</h3>
            <div className="space-y-2">
              {Object.entries(stats.byCategory || {}).map(([cat, catStats]) => {
                const catInfo = CATEGORIES[cat];
                const rate = catStats.total > 0 ? ((catStats.resolved / catStats.total) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-base w-7 text-center">{catInfo?.icon || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium">{catInfo?.label || cat}</span>
                        <span className="text-xs text-gray-400">{catStats.resolved}/{catStats.total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-safety-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="px-4 py-4 space-y-3">
          <h2 className="font-bold text-sm text-gray-700">Municipal Departments</h2>
          {Object.entries(DEPARTMENTS).map(([key, dept]) => {
            const deptStats = stats?.byDepartment?.[key] || { total: 0, pending: 0, resolved: 0 };
            const rate = deptStats.total > 0 ? ((deptStats.resolved / deptStats.total) * 100).toFixed(0) : 0;

            return (
              <div
                key={key}
                className={`card border-l-4 ${dept.border} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => {
                  setFilterDept(key);
                  setActiveTab('reports');
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{dept.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm">{dept.name}</h3>
                      <p className="text-xs text-gray-400">{dept.head}</p>
                    </div>
                  </div>
                  <span className={`badge ${dept.bg} ${dept.color}`}>{deptStats.total}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-warning-600">{deptStats.pending}</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-safety-600">{deptStats.resolved}</p>
                    <p className="text-xs text-gray-400">Resolved</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-civic-600">{rate}%</p>
                    <p className="text-xs text-gray-400">Rate</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-safety-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{dept.phone}</span>
                  <span>{dept.email}</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {dept.categories.map(cat => (
                    <span key={cat} className="badge bg-gray-100 text-gray-500 text-xs">
                      {CATEGORIES[cat]?.icon} {CATEGORIES[cat]?.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="px-4 py-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="input text-xs py-1.5 px-2 min-w-0"
            >
              <option value="">All Departments</option>
              {Object.entries(DEPARTMENTS).map(([key, dept]) => (
                <option key={key} value={key}>{dept.shortName}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input text-xs py-1.5 px-2 min-w-0"
            >
              <option value="">All Status</option>
              {Object.entries(STATUSES).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="input text-xs py-1.5 px-2 min-w-0"
            >
              <option value="">All Urgency</option>
              {Object.entries(URGENCY_LEVELS).map(([key, u]) => (
                <option key={key} value={key}>{u.label}</option>
              ))}
            </select>
          </div>

          {(filterDept || filterStatus || filterUrgency) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400">{filteredReports.length} results</span>
              <button
                onClick={() => { setFilterDept(''); setFilterStatus(''); setFilterUrgency(''); }}
                className="text-xs text-civic-600 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Report Cards */}
          <div className="space-y-3">
            {filteredReports.map(report => {
              const cat = CATEGORIES[report.category];
              const status = STATUSES[report.status];
              const urgency = URGENCY_LEVELS[report.urgency];
              const dept = DEPARTMENTS[report.department];

              return (
                <div key={report.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat?.icon || '📋'}</span>
                      <div>
                        <h3 className="text-sm font-semibold">{report.title}</h3>
                        <p className="text-xs text-gray-400">{report.address}</p>
                      </div>
                    </div>
                    <span className={`badge text-xs ${status?.bg} ${status?.color}`}>
                      {status?.label}
                    </span>
                  </div>

                  {/* Department badge */}
                  {dept && (
                    <div className={`inline-flex items-center gap-1 badge text-xs ${dept.bg} ${dept.color} mb-2`}>
                      {dept.icon} {dept.shortName}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge text-xs ${urgency?.bg} ${urgency?.color}`}>
                      {urgency?.label}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(report.created_at)}</span>
                  </div>

                  {report.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{report.description}</p>
                  )}

                  {report.municipality_response && (
                    <div className="bg-gray-50 rounded-lg p-2 mb-3">
                      <p className="text-xs text-gray-500 font-medium">Response:</p>
                      <p className="text-xs text-gray-600">{report.municipality_response}</p>
                    </div>
                  )}

                  {/* Status Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {report.status !== 'acknowledged' && report.status !== 'in_progress' && report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report.id, 'acknowledged')}
                        disabled={updatingId === report.id}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        Acknowledge
                      </button>
                    )}
                    {report.status !== 'in_progress' && report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report.id, 'in_progress')}
                        disabled={updatingId === report.id}
                        className="btn-outline text-xs py-1.5 px-3 text-purple-600 border-purple-200"
                      >
                        In Progress
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange(report.id, 'resolved')}
                        disabled={updatingId === report.id}
                        className="btn-safety text-xs py-1.5 px-3"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No reports match your filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="px-4 py-4">
          <h2 className="font-bold text-sm text-gray-700 mb-3">Safety Incidents</h2>
          <div className="space-y-3">
            {incidents.map(incident => (
              <div key={incident.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">Community Member</p>
                    <p className="text-xs text-gray-400">{incident.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-safety-100 text-safety-700 text-xs">
                      ✓ {incident.confirmations}
                    </span>
                    <span className="badge bg-danger-100 text-danger-700 text-xs">
                      ⚑ {incident.flags}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{incident.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{timeAgo(incident.created_at)}</span>
                  <button
                    onClick={() => handleRemoveIncident(incident.id)}
                    className="text-xs text-danger-600 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {incidents.length === 0 && (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No safety incidents</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transport Tab */}
      {activeTab === 'transport' && (
        <div className="px-4 py-4 space-y-4">
          <h2 className="font-bold text-sm text-gray-700">Scholar Transport Routes</h2>
          {transportRoutes.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400 text-sm">No transport routes</p>
            </div>
          ) : transportRoutes.map(route => (
            <div key={route.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm">{route.name}</h3>
                  <p className="text-xs text-gray-400">{route.school}</p>
                </div>
                <span className="badge bg-blue-100 text-blue-700 text-xs">{route.vehicle_registration || 'No vehicle'}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                <p>👤 Driver: {route.driver_name || 'Unknown'}</p>
                <p>📞 {route.driver_phone || 'No phone'}</p>
              </div>
              {tripHistories[route.id]?.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Recent Trips</p>
                  <div className="space-y-1">
                    {tripHistories[route.id].slice(0, 5).map(trip => (
                      <div key={trip.id} className="flex items-center justify-between text-xs text-gray-500">
                        <span className={`font-medium ${trip.status === 'arrived' ? 'text-safety-600' : trip.status === 'delayed' ? 'text-warning-600' : 'text-civic-600'}`}>
                          {trip.status.replace('_', ' ')}
                        </span>
                        <span>{trip.started_at ? formatDate(trip.started_at) : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Disaster Management Tab */}
      {activeTab === 'disaster' && (
        <div className="px-4 py-4 space-y-4">
          {/* Active Warnings */}
          <div>
            <h3 className="font-bold text-sm text-gray-700 mb-3">Active Weather Warnings</h3>
            {weatherWarnings.length === 0 ? (
              <div className="card text-center py-4">
                <p className="text-xs text-gray-400">No active warnings</p>
              </div>
            ) : weatherWarnings.map(w => (
              <div key={w.id} className={`card border-l-4 mb-3 ${w.severity === 'warning' ? 'border-l-danger-500' : w.severity === 'watch' ? 'border-l-warning-500' : 'border-l-yellow-500'}`}>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-sm capitalize">{w.event_type?.replace(/_/g, ' ')}</h4>
                  <span className={`badge text-xs ${w.severity === 'warning' ? 'bg-danger-100 text-danger-700' : w.severity === 'watch' ? 'bg-warning-100 text-warning-700' : 'bg-yellow-100 text-yellow-700'}`}>{w.severity}</span>
                </div>
                <p className="text-xs text-gray-600">{w.description}</p>
                <p className="text-xs text-gray-400 mt-1">{w.affected_areas}</p>
              </div>
            ))}
          </div>

          {/* Damage Reports */}
          <div>
            <h3 className="font-bold text-sm text-gray-700 mb-3">Damage Reports</h3>
            {disasterReports.length === 0 ? (
              <div className="card text-center py-4">
                <p className="text-xs text-gray-400">No damage reports</p>
              </div>
            ) : disasterReports.map(r => (
              <div key={r.id} className="card mb-3">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-sm capitalize">{r.disaster_type?.replace(/_/g, ' ')}</h4>
                  <span className={`badge text-xs ${r.status === 'active' ? 'bg-danger-100 text-danger-700' : r.status === 'assessed' ? 'bg-warning-100 text-warning-700' : 'bg-safety-100 text-safety-700'}`}>{r.status}</span>
                </div>
                <p className="text-xs text-gray-600">{r.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>📍 {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</span>
                  <span>🕐 {timeAgo(r.created_at)}</span>
                </div>
                {r.needs_evacuation && <span className="badge bg-danger-100 text-danger-700 text-xs mt-2">🚨 Evacuation needed</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Mahikeng Local Municipality • Ngaka Modiri Molema District
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Municipal Manager: Mr. T.D. Mokgosi • Tel: 018 381 8100
        </p>
      </div>
    </div>
  );
}
