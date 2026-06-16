import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSafetyIncidents, submitIncident, confirmIncident } from '../db/mockApi';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Icon from '../components/Icon';
import { INCIDENT_TYPES, timeAgo, showToast } from '../utils/helpers';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';

export default function SafetyFeed() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
          <h1 className="text-lg font-bold">{t('safety_feed')}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/map')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              title={t('view_on_map')}
            >
              <Icon name="map" className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-danger text-sm py-2 px-3"
            >
              {t('report_incident')}
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
                <h2 className="text-lg font-bold">{t('report_incident')}</h2>
                <button
                  onClick={() => setShowReportForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('identity_hidden')}</p>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Incident type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('incident_type')}</label>
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
                <label className="text-sm font-medium text-gray-700 mb-1 block">{t('what_happened')}</label>
                <textarea
                  className="input min-h-[120px] resize-none"
                  placeholder={t('what_happened_placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Privacy notice */}
              <div className="bg-civic-50 rounded-xl p-3 flex items-start gap-2">
                <Icon name="shield" className="w-5 h-5 text-civic-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-civic-700">{t('privacy_protected')}</p>
                  <p className="text-xs text-civic-600 mt-0.5">
                    {t('privacy_notice')}
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
                    {t('submitting')}
                  </div>
                ) : (
                  t('report_anonymously')
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
            <Icon name="shield" className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
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
                      <Icon name="checkCircle" className="w-5 h-5" />
                      <span>{incident.confirmations} Confirm</span>
                    </button>

                    <button
                      onClick={() => handleConfirm(incident.id, 'flag')}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-danger-600 transition-colors"
                    >
                      <Icon name="flag" className="w-5 h-5" />
                      <span>{incident.flags} Flag</span>
                    </button>

                    <button
                      onClick={() => navigate(`/map?incident=${incident.id}`)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-civic-600 transition-colors ml-auto"
                    >
                      <Icon name="locationPin" className="w-5 h-5" />
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
