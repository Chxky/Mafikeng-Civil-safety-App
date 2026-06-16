import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMonitoringPoints, getWaterQualityReadings, getLatestReadings, submitWaterIssue } from '../db/waterQualityApi';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { showToast, timeAgo } from '../utils/helpers';

const ISSUE_TYPES = [
  { key: 'discoloured_water', label: 'Discoloured Water', icon: '🟤' },
  { key: 'no_water', label: 'No Water', icon: '🚱' },
  { key: 'bad_taste', label: 'Bad Taste', icon: '🤢' },
  { key: 'bad_smell', label: 'Bad Smell', icon: '👃' },
  { key: 'other', label: 'Other', icon: '📋' },
];

function getSafetyColor(reading) {
  if (!reading) return 'gray';
  const issues = [];
  if (reading.ph_level < 6.5 || reading.ph_level > 8.5) issues.push('pH');
  if (reading.turbidity_ntu > 5) issues.push('turbidity');
  if (reading.e_coli_per_100ml > 10) issues.push('E. coli');
  if (reading.chlorine_mg_per_l < 0.2 || reading.chlorine_mg_per_l > 2) issues.push('chlorine');
  return issues.length === 0 ? 'safe' : 'warning';
}

export default function WaterQualityScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [points, setPoints] = useState([]);
  const [latestReadings, setLatestReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [pointReadings, setPointReadings] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [showReport, setShowReport] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [pointsRes, readingsRes] = await Promise.all([getMonitoringPoints(), getLatestReadings()]);
    setPoints(pointsRes.data || []);
    setLatestReadings(readingsRes.data || []);
    setLoading(false);
  }

  async function selectPoint(point) {
    setSelectedPoint(point);
    const { data } = await getWaterQualityReadings(point.id);
    setPointReadings(data || []);
  }

  async function handleSubmitIssue() {
    if (!issueType) { showToast?.('Select an issue type', 'error'); return; }
    setSubmitting(true);
    try {
      const pos = await getCurrentPosition();
      const addr = await reverseGeocode(pos.lat, pos.lng);
      const { error } = await submitWaterIssue({ user_token: user?.id, issue_type: issueType, description: issueDesc, latitude: pos.lat, longitude: pos.lng, address: addr });
      if (error) { showToast?.(error, 'error'); } else { showToast?.('Water issue reported', 'success'); setShowReport(false); setIssueType(''); setIssueDesc(''); }
    } catch { showToast?.('Location unavailable', 'error'); }
    setSubmitting(false);
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'map', label: 'Reading Points', icon: '📍' },
    { id: 'report', label: 'Report Issue', icon: '⚠️' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💧</span>
          <div>
            <h1 className="text-lg font-bold">Water Quality</h1>
            <p className="text-xs opacity-80">Monitoring & Community Reporting</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-blue-700' : 'text-white/60 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="px-4 py-4 space-y-4">
          {loading ? (
            <div className="card animate-pulse"><div className="h-32 bg-gray-200 rounded-lg"></div></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-blue-600">{latestReadings.filter(r => getSafetyColor(r) === 'safe').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Safe Points</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-gray-600">{latestReadings.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Points</p>
                </div>
              </div>

              <h3 className="font-bold text-sm">Monitoring Points</h3>
              {points.map(point => {
                const reading = latestReadings.find(r => r.monitoring_point_id === point.id);
                const safety = getSafetyColor(reading);
                return (
                  <div key={point.id} className="card cursor-pointer hover:shadow-md" onClick={() => { selectPoint(point); setActiveTab('map'); }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${safety === 'safe' ? 'bg-safety-500' : safety === 'warning' ? 'bg-warning-500' : 'bg-gray-300'}`}></span>
                        <h4 className="font-bold text-sm">{point.name}</h4>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{point.point_type.replace(/_/g, ' ')}</span>
                    </div>
                    {reading && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <span className="text-gray-400">pH</span>
                          <p className="font-medium">{reading.ph_level?.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <span className="text-gray-400">Turbidity</span>
                          <p className="font-medium">{reading.turbidity_ntu?.toFixed(1)} NTU</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <span className="text-gray-400">E. coli</span>
                          <p className="font-medium">{reading.e_coli_per_100ml}/100mL</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Last reading: {reading ? timeAgo(reading.reading_time) : 'No data'}</p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="px-4 py-4 space-y-4">
          {selectedPoint && (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">{selectedPoint.name}</h3>
                <button onClick={() => setSelectedPoint(null)} className="text-xs text-blue-600 font-medium">Back to all</button>
              </div>
              <p className="text-xs text-gray-500 mb-3 capitalize">{selectedPoint.point_type.replace(/_/g, ' ')}</p>
              {pointReadings.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No readings available</p>
              ) : (
                <div className="space-y-2">
                  {pointReadings.slice(0, 10).map(r => (
                    <div key={r.id} className={`p-3 rounded-lg ${r.is_safe ? 'bg-safety-50' : 'bg-danger-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${r.is_safe ? 'text-safety-700' : 'text-danger-700'}`}>{r.is_safe ? '✅ Safe' : '⚠️ Unsafe'}</span>
                        <span className="text-xs text-gray-400">{timeAgo(r.reading_time)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-xs text-gray-600">
                        <span>pH: {r.ph_level?.toFixed(1)}</span>
                        <span>Turb: {r.turbidity_ntu?.toFixed(1)}</span>
                        <span>E.coli: {r.e_coli_per_100ml}</span>
                        <span>Cl: {r.chlorine_mg_per_l?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!selectedPoint && (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">📍</span>
              <p className="text-sm text-gray-500">Select a monitoring point from the Dashboard tab</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'report' && (
        <div className="px-4 py-4 space-y-4">
          <div className="card">
            <h3 className="font-bold text-sm mb-3">Report Water Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Issue Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ISSUE_TYPES.map(it => (
                    <button key={it.key} onClick={() => setIssueType(it.key)}
                      className={`py-3 px-3 rounded-xl text-sm font-medium border text-left ${issueType === it.key ? 'bg-blue-50 text-blue-700 border-blue-300' : 'border-gray-200 text-gray-500'}`}>
                      {it.icon} {it.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Describe the water issue..." className="input min-h-[80px] resize-none" />
              </div>
              <button onClick={handleSubmitIssue} disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'Submit Report'}</button>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-1">📞 Water Services</h4>
            <p className="text-xs text-blue-600">Report urgent water issues: 018 381 8300</p>
          </div>
        </div>
      )}
    </div>
  );
}
