// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/helpers';
import { fetchStatus, fetchSchedule } from '../api/esp';
// eslint-disable-next-line no-unused-vars
import { submitOutageReport, confirmOutage, getBusinessProfile, getBusinessAlerts } from '../db/powerApi';
// eslint-disable-next-line no-unused-vars
import { getCurrentPosition, reverseGeocode, fuzzLocation, getMahikengCenter } from '../utils/geolocation';
import { cacheSchedule, getCachedSchedule, cachePowerStatus, getCachedPowerStatus } from '../db/offline';
import ESPWidget from '../components/ESPWidget';
import BusinessSignup from '../components/BusinessSignup';
import Icon from '../components/Icon';

export default function PowerScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [schedule, setSchedule] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // Quick report state
  const [showReport, setShowReport] = useState(false);
  const [outageType, setOutageType] = useState('unknown');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Business state
  const [businessProfile, setBusinessProfile] = useState(null);
  const [businessAlerts, setBusinessAlerts] = useState([]);
  const [showBusinessSignup, setShowBusinessSignup] = useState(false);

  // Outage reports
  // eslint-disable-next-line no-unused-vars
  const [outageReports, setOutageReports] = useState([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);

    // Cache first
    const [cachedStatus, cachedSchedule] = await Promise.all([
      getCachedPowerStatus(),
      getCachedSchedule(),
    ]);
    if (cachedStatus) setStatus(cachedStatus);
    if (cachedSchedule) setSchedule(cachedSchedule);
    setLoading(false);

    // Fresh fetch
    const [statusRes, scheduleRes, profileRes] = await Promise.all([
      fetchStatus(),
      fetchSchedule(),
      getBusinessProfile(user?.id),
    ]);

    if (statusRes.data) {
      setStatus(statusRes.data);
      await cachePowerStatus(statusRes.data);
    }
    if (scheduleRes.data) {
      setSchedule(scheduleRes.data);
      await cacheSchedule(scheduleRes.data);
    }
    if (profileRes.data) {
      setBusinessProfile(profileRes.data);
      const alertsRes = await getBusinessAlerts(profileRes.data.id);
      setBusinessAlerts(alertsRes.data || []);
    }
  }

  async function handleQuickReport() {
    setSubmitting(true);
    try {
      const pos = await getCurrentPosition();
      const addr = await reverseGeocode(pos.lat, pos.lng);

      // eslint-disable-next-line no-unused-vars
      const { data, error } = await submitOutageReport({
        user_token_id: user?.id,
        outage_type: outageType,
        description: reportDesc || `Power outage reported via Mahikeng Power`,
        latitude: pos.lat,
        longitude: pos.lng,
        address: addr,
      });

      if (error) {
        showToast?.(error, 'error');
      } else {
        showToast?.('Outage report submitted!', 'success');
        setShowReport(false);
        setReportDesc('');
        setOutageType('unknown');
      }
    } catch (err) {
      showToast?.('Failed to get location', 'error');
    }
    setSubmitting(false);
  }

  const stage = status?.stage ?? 0;
  // eslint-disable-next-line no-unused-vars
  const isShedding = stage > 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'business', label: 'Business', icon: '🏪' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-civic-800 to-civic-700 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-lg font-bold">Mahikeng Power</h1>
              <p className="text-xs text-civic-300">Electricity Outage Intelligence</p>
            </div>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-medium"
          >
            + Report Outage
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-civic-700'
                  : 'text-civic-200 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="px-4 py-4 space-y-4">
          <ESPWidget />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowReport(true)}
              className="card text-center hover:shadow-md transition-shadow"
            >
              <span className="text-2xl block mb-1">🚨</span>
              <span className="text-sm font-medium">Report Outage</span>
            </button>
            <button
              onClick={() => navigate('/map?layer=outages')}
              className="card text-center hover:shadow-md transition-shadow"
            >
              <span className="text-2xl block mb-1">🗺️</span>
              <span className="text-sm font-medium">Outage Map</span>
            </button>
          </div>

          {/* Business Alerts */}
          {businessProfile && businessAlerts.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-sm mb-3">Recent Alerts</h3>
              <div className="space-y-2">
                {businessAlerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm">⚡</span>
                    <div>
                      <p className="text-xs text-gray-700">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(alert.sent_at).toLocaleString('en-ZA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="card bg-civic-50 border-civic-200">
            <h3 className="font-bold text-sm text-civic-800 mb-2">About Mahikeng Power</h3>
            <p className="text-xs text-civic-600">
              Real-time electricity outage intelligence for Mahikeng residents and businesses.
              Report outages, track load shedding schedules, and get instant alerts.
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-civic-500">
              <span>📞 Electricity: 018 381 8320</span>
              <span>🔌 Eskom: 086 003 7566</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="px-4 py-4">
          <div className="card text-center py-12">
            <span className="text-4xl block mb-3">🗺️</span>
            <p className="text-sm text-gray-500 mb-3">Outage map loads in the main Map view</p>
            <button
              onClick={() => navigate('/map?layer=outages')}
              className="btn-primary text-sm"
            >
              Open Outage Map
            </button>
          </div>
        </div>
      )}

      {/* Business Tab */}
      {activeTab === 'business' && (
        <div className="px-4 py-4 space-y-4">
          {businessProfile ? (
            <>
              {/* Business Profile Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Your Business</h3>
                  <span className="badge bg-safety-100 text-safety-700">Active</span>
                </div>
                <p className="text-sm font-medium">{businessProfile.business_name}</p>
                <p className="text-xs text-gray-400 capitalize">{businessProfile.business_type?.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">{businessProfile.address}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Alert radius: {businessProfile.alert_radius_km}km</p>
                  <p className="text-xs text-gray-500">Phone: {businessProfile.phone}</p>
                </div>
              </div>

              {/* Alert History */}
              <div className="card">
                <h3 className="font-bold text-sm mb-3">Alert History</h3>
                {businessAlerts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No alerts yet</p>
                ) : (
                  <div className="space-y-2">
                    {businessAlerts.map(alert => (
                      <div key={alert.id} className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-700">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.sent_at).toLocaleString('en-ZA')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">🏪</span>
              <h3 className="font-bold text-sm mb-2">Business Continuity Alerts</h3>
              <p className="text-xs text-gray-500 mb-4">
                Register your business to receive instant alerts when power outages
                are reported near your location.
              </p>
              <button
                onClick={() => setShowBusinessSignup(true)}
                className="btn-primary text-sm"
              >
                Register Business
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Report Power Outage</h2>
                <button onClick={() => setShowReport(false)} className="p-2">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Outage Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">What type of outage?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'scheduled', label: 'Load Shedding', icon: '📅' },
                    { key: 'unscheduled', label: 'Fault/Break', icon: '🔧' },
                    { key: 'unknown', label: 'Unknown', icon: '❓' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setOutageType(opt.key)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium border transition-colors ${
                        outageType === opt.key
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {opt.icon}<br />{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Details (optional)</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Any additional details about the outage..."
                  className="input min-h-[80px] resize-none"
                />
              </div>

              <button
                onClick={handleQuickReport}
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Outage Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Signup Modal */}
      {showBusinessSignup && (
        <BusinessSignup
          userId={user?.id}
          onComplete={(profile) => {
            setBusinessProfile(profile);
            setShowBusinessSignup(false);
            showToast?.('Business registered!', 'success');
          }}
          onClose={() => setShowBusinessSignup(false)}
        />
      )}
    </div>
  );
}
