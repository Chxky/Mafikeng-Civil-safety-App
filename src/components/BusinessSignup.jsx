import { useState } from 'react';
import { createBusinessProfile } from '../db/powerApi';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { showToast } from '../utils/helpers';

const BUSINESS_TYPES = [
  { key: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
  { key: 'fresh_produce', label: 'Fresh Produce', icon: '🥬' },
  { key: 'guesthouse', label: 'Guesthouse / B&B', icon: '🏠' },
  { key: 'clothing', label: 'Clothing / Retail', icon: '👗' },
  { key: 'other', label: 'Other', icon: '🏪' },
];

export default function BusinessSignup({ userId, onComplete, onClose }) {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [alertRadius, setAlertRadius] = useState(2);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function detectLocation() {
    setLoadingLocation(true);
    try {
      const pos = await getCurrentPosition();
      setLocation(pos);
      const addr = await reverseGeocode(pos.lat, pos.lng);
      setAddress(addr);
    } catch {
      setLocation({ lat: -25.8653, lng: 25.6441 });
      setAddress('Mahikeng CBD');
    }
    setLoadingLocation(false);
  }

  async function handleSubmit() {
    if (!businessName || !businessType || !phone) {
      showToast?.('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (!location) await detectLocation();

      const { data, error } = await createBusinessProfile({
        user_token_id: userId,
        business_name: businessName,
        business_type: businessType,
        phone,
        latitude: location?.lat || -25.8653,
        longitude: location?.lng || 25.6441,
        address,
        alert_radius_km: alertRadius,
      });

      if (error) {
        showToast?.(error, 'error');
      } else {
        onComplete(data);
      }
    } catch (err) {
      showToast?.('Registration failed', 'error');
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Register Business</h2>
            <button onClick={onClose} className="p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress */}
          <div className="flex gap-2 mt-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-civic-500' : 'bg-gray-200'}`}></div>
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-civic-500' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Mmabatho Spaza Shop"
                className="input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Business Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map(type => (
                  <button
                    key={type.key}
                    onClick={() => setBusinessType(type.key)}
                    className={`py-3 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                      businessType === type.key
                        ? 'bg-civic-50 text-civic-700 border-civic-300'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 XX XXX XXXX"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">For SMS alerts when outages affect your area</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Business Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 45 Main Road, Mahikeng"
                className="input"
              />
              <button
                onClick={detectLocation}
                disabled={loadingLocation}
                className="text-xs text-civic-600 font-medium mt-1"
              >
                {loadingLocation ? 'Detecting...' : '📍 Use current location'}
              </button>
            </div>

            <button
              onClick={() => {
                if (!businessName || !businessType || !phone) {
                  showToast?.('Please fill in all required fields', 'error');
                  return;
                }
                if (!location) detectLocation();
                setStep(2);
              }}
              className="btn-primary w-full"
            >
              Next: Alert Settings
            </button>
          </div>
        )}

        {/* Step 2: Alert Settings */}
        {step === 2 && (
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Alert Radius</label>
              <p className="text-xs text-gray-400 mb-3">Get notified when outages are reported within this distance</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map(km => (
                  <button
                    key={km}
                    onClick={() => setAlertRadius(km)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                      alertRadius === km
                        ? 'bg-civic-50 text-civic-700 border-civic-300'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            </div>

            <div className="card bg-civic-50 border-civic-200">
              <h4 className="text-sm font-medium text-civic-800 mb-2">Alert Summary</h4>
              <div className="space-y-1 text-xs text-civic-600">
                <p>🏪 {businessName}</p>
                <p>📍 {address || 'Mahikeng'}</p>
                <p>📱 {phone}</p>
                <p>📡 Alert within {alertRadius}km</p>
              </div>
            </div>

            <div className="card bg-gray-50">
              <p className="text-xs text-gray-500">
                You'll receive push notifications and SMS when power outages are reported
                within {alertRadius}km of your business. Alerts include outage type and suggested actions.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn-outline flex-1"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Registering...' : 'Register Business'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
