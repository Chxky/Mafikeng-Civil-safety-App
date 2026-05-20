import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSafetyIncidents, submitIncident, confirmIncident } from '../db/mockApi';
import { useAuth } from '../hooks/useAuth';
import { INCIDENT_TYPES, timeAgo, showToast } from '../utils/helpers';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';

export default function SafetyFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Form state
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    try {
      const { data } = await getSafetyIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!incidentType || !description.trim()) {
      showToast?.('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const pos = await getCurrentPosition().catch(() => ({ lat: -25.8653, lng: 25.6441 }));
      const addr = await reverseGeocode(pos.lat, pos.lng);

      await submitIncident({
        user_token_id: user?.id,
        incident_type: incidentType,
        description: description.trim(),
        latitude: pos.lat,
        longitude: pos.lng,
        address: addr,
        photo_urls: [],
        is_anonymous: true,
      });

      showToast?.('Incident reported anonymously', 'success');
      setShowReportForm(false);
      setIncidentType('');
      setDescription('');
      loadIncidents();
    } catch (err) {
      showToast?.('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(incidentId, type) {
    if (!user?.id) return;
    try {
      await confirmIncident(incidentId, user.id, type);
      loadIncidents();
    } catch (err) {
      console.error('Confirmation failed:', err);
    }
  }

  const incidentEntries = Object.entries(INCIDENT_TYPES);

  const filteredIncidents = filterType === 'all'
    ? incidents
    : incidents.filter(i => i.incident_type === filterType);

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">Safety Feed</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/map')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              title="View on map"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-danger text-sm py-2 px-3"
            >
              Report
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
              filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {incidentEntries.slice(0, 5).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                filterType === key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Report Incident</h2>
                <button
                  onClick={() => setShowReportForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Your identity will be hidden as "Community Member"</p>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Incident type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Incident Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {incidentEntries.map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setIncidentType(key)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                        incidentType === key
                          ? 'border-danger-500 bg-danger-50 text-danger-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">What happened?</label>
                <textarea
                  className="input min-h-[120px] resize-none"
                  placeholder="Describe what you observed. Be specific but protect identities."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Privacy notice */}
              <div className="bg-civic-50 rounded-xl p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-civic-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-civic-700">Privacy Protected</p>
                  <p className="text-xs text-civic-600 mt-0.5">
                    Your report is anonymous. Location is fuzzed to the nearest intersection on the public map.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !incidentType || !description.trim()}
                className="btn-danger w-full"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Report Anonymously'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Feed */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-gray-400 font-medium">No incidents reported</p>
            <p className="text-sm text-gray-400 mt-1">Your community is safe</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map(incident => {
              const typeInfo = INCIDENT_TYPES[incident.incident_type] || INCIDENT_TYPES.other;

              return (
                <div key={incident.id} className="feed-card">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{typeInfo.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Community Member</span>
                        {incident.is_verified && (
                          <span className="badge bg-safety-100 text-safety-700">Verified</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {incident.address || 'Mahikeng'} · {timeAgo(incident.created_at)}
                      </p>
                    </div>
                    <span className={`badge ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-3">{incident.description}</p>

                  {/* Photos */}
                  {incident.photo_urls?.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {incident.photo_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Incident photo ${i + 1}`}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleConfirm(incident.id, 'confirm')}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-safety-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{incident.confirmations} Confirm</span>
                    </button>

                    <button
                      onClick={() => handleConfirm(incident.id, 'flag')}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-danger-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                      </svg>
                      <span>{incident.flags} Flag</span>
                    </button>

                    <button
                      onClick={() => navigate(`/map?incident=${incident.id}`)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-civic-600 transition-colors ml-auto"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span>Map</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
