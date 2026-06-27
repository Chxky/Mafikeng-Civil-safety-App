import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
// eslint-disable-next-line no-unused-vars
import { compressImage, CATEGORIES, URGENCY_LEVELS, DEPARTMENTS, CATEGORY_TO_DEPARTMENT, isOnline, showToast } from '../utils/helpers';
import { submitReport, uploadPhoto } from '../db/api';
import { addPendingReport, saveDraft, getDrafts, removeDraft } from '../db/offline';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useNetwork } from '../hooks/useNetwork';
import Icon from '../components/Icon';

export default function Report() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isOnline: online } = useNetwork();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const mapRef = useRef(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drafts, setDrafts] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  // Power outage fields
  const [outageType, setOutageType] = useState('unknown');
  const [estimatedRestoration, setEstimatedRestoration] = useState('');
  const [isBusinessAlert, setIsBusinessAlert] = useState(false);

  useEffect(() => {
    loadDrafts();
    detectLocation();
  }, []);

  async function loadDrafts() {
    const savedDrafts = await getDrafts();
    setDrafts(savedDrafts);
  }

  async function detectLocation() {
    setLoadingLocation(true);
    try {
      const pos = await getCurrentPosition();
      setLocation(pos);
      const addr = await reverseGeocode(pos.lat, pos.lng);
      setAddress(addr);
    } catch (err) {
      console.error('Location detection failed:', err);
    } finally {
      setLoadingLocation(false);
    }
  }

  function handlePhotoCapture(e) {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 3) {
      showToast?.('Maximum 3 photos allowed', 'error');
      return;
    }

    files.forEach(async (file) => {
      const compressed = await compressImage(file);
      setPhotos(prev => [...prev, compressed]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(compressed);
    });
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!category) {
      showToast?.('Please select a category', 'error');
      return;
    }

    setSubmitting(true);
    let report = null;

    try {
      // Upload photos if any
      let uploadedUrls = [];
      if (photos.length > 0) {
        const uploads = await Promise.all(
          photos.map((file, i) => uploadPhoto(file, `${category}/${Date.now()}-${i}`))
        );
        uploadedUrls = uploads.filter(u => !u.error).map(u => u.data.url);
      }

      report = {
        user_token_id: user?.id,
        category,
        title: title || `${CATEGORIES[category]?.label || 'Issue'} report`,
        description,
        latitude: location?.lat || -25.8653,
        longitude: location?.lng || 25.6441,
        address,
        urgency,
        photo_urls: uploadedUrls,
        video_urls: [],
      };

      // Add power outage specific fields
      if (category === 'electricity') {
        report.outage_type = outageType;
        report.estimated_restoration = estimatedRestoration || null;
        report.is_business_alert = isBusinessAlert;
      }
      if (online) {
        await submitReport(report);
        showToast?.(t('report_submitted'), 'success');
      } else {
        // Save to offline queue
        await addPendingReport({
          ...report,
          id: `offline-${Date.now()}`,
        });
        showToast?.(t('report_saved_offline'), 'info');
      }

      // Reset form
      setCategory('');
      setTitle('');
      setDescription('');
      setUrgency('normal');
      setPhotos([]);
      setPhotoPreview([]);
      setStep(1);

      navigate('/my-reports');
    } catch (err) {
      showToast?.(t('report_submit_failed'), 'error');
      await saveDraft({
        id: `draft-${Date.now()}`,
        ...report,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function loadDraft(draft) {
    setCategory(draft.category || '');
    setTitle(draft.title || '');
    setDescription(draft.description || '');
    setUrgency(draft.urgency || 'normal');
    setPhotoPreview(draft.photo_urls || []);
    if (draft.latitude && draft.longitude) {
      setLocation({ lat: draft.latitude, lng: draft.longitude });
    }
    setAddress(draft.address || '');
    setShowDrafts(false);
    setStep(2);
    await removeDraft(draft.id);
    loadDrafts();
  }

  const categoryEntries = Object.entries(CATEGORIES);
  const urgencyEntries = Object.entries(URGENCY_LEVELS);

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="p-1" aria-label="Back">
                <Icon name="arrowLeft" className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <h1 className="text-lg font-bold">{t('report_issue')}</h1>
          </div>
          {drafts.length > 0 && (
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="text-sm text-civic-600 font-medium"
            >
              {t('drafts')} ({drafts.length})
            </button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-civic-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Drafts Panel */}
      {showDrafts && (
        <div className="px-4 py-3 bg-civic-50 border-b border-civic-100">
          <p className="text-xs font-medium text-civic-700 mb-2">{t('saved_drafts')}</p>
          <div className="space-y-2">
            {drafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => loadDraft(draft)}
                className="w-full text-left card py-2 px-3"
              >
                <p className="text-sm font-medium">{draft.title || t('untitled_report')}</p>
                <p className="text-xs text-gray-500">{CATEGORIES[draft.category]?.label || t('no_category')}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="px-4 py-6">
          <h2 className="text-xl font-bold mb-1">{t('whats_the_issue')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('select_category')}</p>

          <div className="grid grid-cols-2 gap-3">
            {categoryEntries.map(([key, cat]) => (
              <button
                key={key}
                onClick={() => {
                  setCategory(key);
                  setStep(2);
                }}
                className={`card flex flex-col items-center gap-3 py-6 active:scale-95 transition-transform ${
                  category === key ? 'ring-2 ring-civic-500 bg-civic-50' : ''
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center`}>
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="px-4 py-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">{t('add_details')}</h2>
            <p className="text-sm text-gray-500">{t('help_municipality')}</p>
          </div>

          {/* Selected category badge */}
          <div className="flex items-center gap-2">
            <span className={`badge ${CATEGORIES[category]?.bg} ${CATEGORIES[category]?.color}`}>
              {CATEGORIES[category]?.icon} {CATEGORIES[category]?.label}
            </span>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-civic-600"
            >
              {t('change')}
            </button>
          </div>

          {/* Department routing info */}
          {(() => {
            const deptKey = CATEGORY_TO_DEPARTMENT[category];
            const dept = DEPARTMENTS[deptKey];
            if (!dept) return null;
            return (
              <div className={`rounded-xl border p-3 ${dept.border} ${dept.bg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{dept.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('routed_to')}</p>
                    <p className={`text-sm font-bold ${dept.color}`}>{dept.name}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{dept.phone} • {dept.email}</p>
              </div>
            );
          })()}

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t('title')}</label>
            <input
              type="text"
              className="input"
              placeholder={t('title_placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t('description')}</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder={t('description_placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t('urgency_level')}</label>
            <div className="grid grid-cols-2 gap-2">
              {urgencyEntries.map(([key, level]) => (
                <button
                  key={key}
                  onClick={() => setUrgency(key)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                    urgency === key
                      ? `${level.bg} ${level.color} border-current`
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Power Outage Fields (only when electricity selected) */}
          {category === 'electricity' && (
            <div className="space-y-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-bold text-purple-800">{t('power_outage_details')}</span>
              </div>

              {/* Outage Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('outage_type')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'scheduled', label: t('load_shedding'), icon: '📅' },
                    { key: 'unscheduled', label: t('fault'), icon: '🔧' },
                    { key: 'unknown', label: t('unknown'), icon: '❓' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setOutageType(opt.key)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        outageType === opt.key
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Restoration */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">{t('estimated_restoration')}</label>
                <input
                  type="datetime-local"
                  value={estimatedRestoration}
                  onChange={(e) => setEstimatedRestoration(e.target.value)}
                  className="input text-sm"
                />
              </div>

              {/* Business Alert */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBusinessAlert}
                  onChange={(e) => setIsBusinessAlert(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-purple-600"
                />
                <div>
                  <span className="text-xs font-medium text-gray-700">{t('business_alert')}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{t('business_alert_desc')}</p>
                </div>
              </label>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t('location')}</label>
            <div className="card">
              {loadingLocation ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 border-2 border-civic-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500">{t('detecting_location')}</span>
                </div>
              ) : location ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="locationPin" className="w-5 h-5 text-safety-500" />
                    <span className="text-sm font-medium">{address || t('location_detected')}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                  </p>
                  <button
                    onClick={detectLocation}
                    className="text-xs text-civic-600 mt-2"
                  >
                    {t('refresh_location')}
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-2">{t('location_not_available')}</p>
                  <button onClick={detectLocation} className="btn-outline text-sm py-2 px-4">
                    {t('detect_location')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('photos')} ({photos.length}/3)
            </label>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {photoPreview.map((preview, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img
                    src={preview}
                    alt={`Photo ${i + 1}`}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}

              {photos.length < 3 && (                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-civic-400 hover:text-civic-500 transition-colors flex-shrink-0"
                    aria-label="Add photo"
                  >
                    <Icon name="camera" className="w-8 h-8" />
                    <span className="text-xs">{t('add')}</span>
                  </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
              multiple
            />
          </div>

          {/* Submit */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !category}
              className="btn-primary w-full"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {online ? t('submitting') : t('saving')}
                </div>
              ) : (
                online ? t('submit_report') : t('save_offline')
              )}
            </button>

            {!online && (
              <p className="text-xs text-center text-gray-500">
                {t('offline_report_auto')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
