import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { compressImage, CATEGORIES, URGENCY_LEVELS, isOnline, showToast } from '../utils/helpers';
import { submitReport } from '../db/mockApi';
import { addPendingReport, saveDraft, getDrafts, removeDraft } from '../db/offline';
import { useAuth } from '../hooks/useAuth';
import { useNetwork } from '../hooks/useNetwork';

export default function Report() {
  const { user } = useAuth();
  const { isOnline: online } = useNetwork();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
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
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);

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

    const report = {
      user_token_id: user?.id,
      category,
      title: title || `${CATEGORIES[category]?.label || 'Issue'} report`,
      description,
      latitude: location?.lat || -25.8653,
      longitude: location?.lng || 25.6441,
      address,
      urgency,
      photo_urls: photoPreview,
      video_urls: [],
    };

    try {
      if (online) {
        await submitReport(report);
        showToast?.('Report submitted successfully!', 'success');
      } else {
        // Save to offline queue
        await addPendingReport({
          ...report,
          id: `offline-${Date.now()}`,
        });
        showToast?.('Report saved offline. Will sync when connected.', 'info');
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
      showToast?.('Failed to submit report. Saved as draft.', 'error');
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
              <button onClick={() => setStep(step - 1)} className="p-1">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-bold">Report Issue</h1>
          </div>
          {drafts.length > 0 && (
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="text-sm text-civic-600 font-medium"
            >
              Drafts ({drafts.length})
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
          <p className="text-xs font-medium text-civic-700 mb-2">SAVED DRAFTS</p>
          <div className="space-y-2">
            {drafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => loadDraft(draft)}
                className="w-full text-left card py-2 px-3"
              >
                <p className="text-sm font-medium">{draft.title || 'Untitled Report'}</p>
                <p className="text-xs text-gray-500">{CATEGORIES[draft.category]?.label || 'No category'}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="px-4 py-6">
          <h2 className="text-xl font-bold mb-1">What's the issue?</h2>
          <p className="text-sm text-gray-500 mb-6">Select the category that best describes the problem</p>

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
            <h2 className="text-xl font-bold mb-1">Add Details</h2>
            <p className="text-sm text-gray-500">Help the municipality understand the issue</p>
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
              Change
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
            <input
              type="text"
              className="input"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Describe the issue in detail. Include landmarks or nearby addresses."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Urgency Level</label>
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

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
            <div className="card">
              {loadingLocation ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 border-2 border-civic-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500">Detecting location...</span>
                </div>
              ) : location ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-safety-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-sm font-medium">{address || 'Location detected'}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                  </p>
                  <button
                    onClick={detectLocation}
                    className="text-xs text-civic-600 mt-2"
                  >
                    Refresh location
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-2">Location not available</p>
                  <button onClick={detectLocation} className="btn-outline text-sm py-2 px-4">
                    Detect Location
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Photos ({photos.length}/3)
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

              {photos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-civic-400 hover:text-civic-500 transition-colors flex-shrink-0"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-xs">Add</span>
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
                  {online ? 'Submitting...' : 'Saving...'}
                </div>
              ) : (
                online ? 'Submit Report' : 'Save Offline'
              )}
            </button>

            {!online && (
              <p className="text-xs text-center text-gray-500">
                Report will be submitted automatically when you're back online
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
