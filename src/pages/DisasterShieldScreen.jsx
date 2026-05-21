import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getWeatherWarnings, getDisasterReports, submitDisasterReport, updateSafetyStatus } from '../db/disasterApi';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { showToast, timeAgo } from '../utils/helpers';
import DisasterMap from '../components/DisasterMap';
import VolunteerCoordinator from '../components/VolunteerCoordinator';
import PreparednessLibrary from '../components/PreparednessLibrary';

const DISASTER_TYPES = [
  { key: 'flood', label: 'Flood', icon: '🌊' },
  { key: 'veld_fire', label: 'Veld Fire', icon: '🔥' },
  { key: 'storm_damage', label: 'Storm Damage', icon: '🌪️' },
  { key: 'structural_collapse', label: 'Collapse', icon: '🏚️' },
  { key: 'other', label: 'Other', icon: '⚠️' },
];

const SEVERITY_COLORS = { warning: 'danger', watch: 'warning', advisory: 'yellow' };

export default function DisasterShieldScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('warnings');
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherWarnings().then(({ data }) => { setWarnings(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'warnings', label: 'Warnings', icon: '⚠️' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'response', label: 'Response', icon: '🤝' },
    { id: 'prepare', label: 'Prepare', icon: '📚' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className={`bg-gradient-to-r text-white px-4 py-4 sticky top-0 z-30 ${warnings.length > 0 ? 'from-danger-800 to-danger-600' : 'from-civic-800 to-civic-600'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="text-lg font-bold">Disaster Shield</h1>
            <p className="text-xs opacity-80">Early Warning & Community Resilience</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-civic-700' : 'text-white/60 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'warnings' && <WarningsTab />}
      {activeTab === 'map' && <MapTab userId={user?.id} />}
      {activeTab === 'response' && <VolunteerCoordinator userId={user?.id} />}
      {activeTab === 'prepare' && <div className="px-4 py-4"><PreparednessLibrary /></div>}
    </div>
  );
}

function WarningsTab() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherWarnings().then(({ data }) => { setWarnings(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-4 py-4"><div className="card animate-pulse"><div className="h-24 bg-gray-200 rounded-lg"></div></div></div>;

  return (
    <div className="px-4 py-4 space-y-3">
      {warnings.length === 0 ? (
        <div className="card text-center py-8">
          <span className="text-4xl block mb-3">✅</span>
          <p className="text-sm font-medium text-gray-700">No Active Warnings</p>
          <p className="text-xs text-gray-400 mt-1">Weather conditions are normal</p>
        </div>
      ) : warnings.map(w => {
        const color = SEVERITY_COLORS[w.severity] || 'yellow';
        return (
          <div key={w.id} className={`card border-l-4 border-l-${color}-500`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`badge bg-${color}-100 text-${color}-700 text-xs`}>{w.severity.toUpperCase()}</span>
                <h3 className="font-bold text-sm mt-1 capitalize">{w.event_type.replace(/_/g, ' ')}</h3>
              </div>
              <span className="text-xs text-gray-400">{w.source}</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{w.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>🕐 {new Date(w.start_time).toLocaleString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — {new Date(w.expiry_time).toLocaleString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {w.affected_areas && <p className="text-xs text-gray-500 mt-1">📍 {w.affected_areas}</p>}
            {w.recommended_actions && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700">Recommended Actions:</p>
                <p className="text-xs text-gray-600 mt-0.5">{w.recommended_actions}</p>
              </div>
            )}
          </div>
        );
      })}

      <div className="card bg-civic-50 border-civic-200">
        <p className="text-xs text-civic-700">📞 North West PDMC: 066 030 8026</p>
        <p className="text-xs text-civic-700 mt-1">📞 SAWS: 012 367 6041</p>
      </div>
    </div>
  );
}

function MapTab({ userId }) {
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ disaster_type: 'flood', description: '', urgency_level: 'damage_only', needs_evacuation: false });
  const [submitting, setSubmitting] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState(null);

  async function handleSubmitReport() {
    setSubmitting(true);
    try {
      const pos = await getCurrentPosition();
      const addr = await reverseGeocode(pos.lat, pos.lng);
      const { error } = await submitDisasterReport({ ...reportForm, latitude: pos.lat, longitude: pos.longitude, user_token: userId });
      if (error) showToast?.(error, 'error');
      else { showToast?.('Damage report submitted', 'success'); setShowReport(false); }
    } catch { showToast?.('Location unavailable', 'error'); }
    setSubmitting(false);
  }

  async function handleSafetyStatus(status) {
    try {
      const pos = await getCurrentPosition();
      await updateSafetyStatus(userId, null, status, pos.lat, pos.lng);
      setSafetyStatus(status);
      showToast?.(status === 'safe' ? 'Marked as safe' : 'Help request sent', 'success');
    } catch { showToast?.('Location unavailable', 'error'); }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => handleSafetyStatus('safe')} className={`flex-1 py-3 rounded-xl text-sm font-medium border ${safetyStatus === 'safe' ? 'bg-safety-100 text-safety-700 border-safety-300' : 'border-gray-200 text-gray-600'}`}>
          ✅ I'm Safe
        </button>
        <button onClick={() => handleSafetyStatus('need_help')} className={`flex-1 py-3 rounded-xl text-sm font-medium border ${safetyStatus === 'need_help' ? 'bg-danger-100 text-danger-700 border-danger-300' : 'border-gray-200 text-gray-600'}`}>
          🆘 Need Help
        </button>
      </div>
      <DisasterMap height="300px" />
      <button onClick={() => setShowReport(true)} className="btn-danger w-full">Report Disaster Damage</button>

      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Report Disaster Damage</h2>
                <button onClick={() => setShowReport(false)} className="p-2">✕</button>
              </div>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Disaster Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {DISASTER_TYPES.map(dt => (
                    <button key={dt.key} onClick={() => setReportForm(p => ({ ...p, disaster_type: dt.key }))}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border ${reportForm.disaster_type === dt.key ? 'bg-danger-50 text-danger-700 border-danger-300' : 'border-gray-200 text-gray-500'}`}>
                      {dt.icon} {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the damage..." className="input min-h-[80px] resize-none" />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ key: 'immediate_threat', label: 'Immediate' }, { key: 'damage_only', label: 'Damage' }, { key: 'information', label: 'Info' }].map(u => (
                    <button key={u.key} onClick={() => setReportForm(p => ({ ...p, urgency_level: u.key }))}
                      className={`py-2 rounded-lg text-xs font-medium border ${reportForm.urgency_level === u.key ? 'bg-danger-50 text-danger-700 border-danger-300' : 'border-gray-200 text-gray-500'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={reportForm.needs_evacuation} onChange={e => setReportForm(p => ({ ...p, needs_evacuation: e.target.checked }))} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Evacuation needed</span>
              </label>
              <button onClick={handleSubmitReport} disabled={submitting} className="btn-danger w-full">{submitting ? 'Submitting...' : 'Submit Report'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
