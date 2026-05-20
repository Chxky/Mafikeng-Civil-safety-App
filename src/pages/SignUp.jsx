import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { saveUserData } from '../db/offline';
import { saveEmergencyContacts } from '../db/offline';
import { showToast } from '../utils/helpers';

const SUBURBS = [
  'Central Mahikeng',
  'Riviera Park',
  'Montshiwa',
  'Mmabatho',
  'Lotlamoreng',
  'Signal Hill',
  'Dinokana',
  'Lomanyaneng',
  'Impala Park',
  'Proclamation Hill',
  'Sehunelo',
  'Khayalami',
  'Noordgesig',
  'Other',
];

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
  'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  'Ward 11', 'Ward 12', 'Ward 13', 'Ward 14', 'Ward 15',
  'Ward 16', 'Ward 17', 'Ward 18', 'Ward 19', 'Ward 20',
  'Not Sure',
];

export default function SignUp() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    phone: '',
    streetAddress: '',
    suburb: '',
    ward: '',
    landmark: '',
  });
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relationship: '' });
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addEmergencyContact() {
    if (!emergencyContact.name.trim() || !emergencyContact.phone.trim()) {
      showToast?.('Please fill in contact name and phone', 'error');
      return;
    }
    setEmergencyContacts(prev => [...prev, { id: Date.now().toString(), ...emergencyContact }]);
    setEmergencyContact({ name: '', phone: '', relationship: '' });
    showToast?.('Contact added', 'success');
  }

  function removeEmergencyContact(id) {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  }

  async function handleSubmit() {
    if (!form.displayName.trim()) {
      showToast?.('Please enter your name', 'error');
      return;
    }
    if (!form.suburb) {
      showToast?.('Please select your suburb', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Save user profile
      const fullAddress = [form.streetAddress, form.suburb, 'Mahikeng'].filter(Boolean).join(', ');
      const profileData = {
        ...form,
        fullAddress,
        signedUpAt: new Date().toISOString(),
      };

      await saveUserData('profile', profileData);
      updateProfile({ ...profileData });

      // Save emergency contacts
      if (emergencyContacts.length > 0) {
        await saveEmergencyContacts(emergencyContacts);
      }

      showToast?.('Welcome to Mahikeng Civic Safety!', 'success');
      navigate('/');
    } catch (err) {
      showToast?.('Failed to save profile', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-safe min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-civic-600 to-civic-800 text-white px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Join Mahikeng</h1>
            <p className="text-civic-200 text-sm mt-0.5">Help build a safer community</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="px-4 py-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Your Details</h2>
            <p className="text-sm text-gray-500">Tell us about yourself</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Your Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Thabo Molefe"
              value={form.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number (optional)</label>
            <input
              type="tel"
              className="input"
              placeholder="+27 XX XXX XXXX"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Only shared with emergency contacts during SOS</p>
          </div>

          <button
            onClick={() => {
              if (!form.displayName.trim()) {
                showToast?.('Please enter your name', 'error');
                return;
              }
              setStep(2);
            }}
            className="btn-primary w-full mt-4"
          >
            Continue
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-sm text-gray-500 py-2"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Step 2: Address */}
      {step === 2 && (
        <div className="px-4 py-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Your Address</h2>
            <p className="text-sm text-gray-500">Helps us route reports to the right municipality area</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Suburb / Township *</label>
            <select
              className="input"
              value={form.suburb}
              onChange={(e) => updateField('suburb', e.target.value)}
            >
              <option value="">Select your area</option>
              {SUBURBS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 45 Station Road"
              value={form.streetAddress}
              onChange={(e) => updateField('streetAddress', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ward Number</label>
            <select
              className="input"
              value={form.ward}
              onChange={(e) => updateField('ward', e.target.value)}
            >
              <option value="">Select your ward</option>
              {WARDS.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nearby Landmark (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Near Shoprite, opposite the school"
              value={form.landmark}
              onChange={(e) => updateField('landmark', e.target.value)}
            />
          </div>

          {/* Address Preview */}
          {(form.streetAddress || form.suburb) && (
            <div className="bg-civic-50 rounded-xl p-3">
              <p className="text-xs font-medium text-civic-700 mb-1">YOUR ADDRESS</p>
              <p className="text-sm text-civic-800">
                {[form.streetAddress, form.suburb, 'Mahikeng'].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (!form.suburb) {
                showToast?.('Please select your suburb', 'error');
                return;
              }
              setStep(3);
            }}
            className="btn-primary w-full mt-4"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 3: Emergency Contacts */}
      {step === 3 && (
        <div className="px-4 py-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Emergency Contacts</h2>
            <p className="text-sm text-gray-500">People to notify when you activate SOS</p>
          </div>

          {/* Add Contact Form */}
          <div className="card space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Contact Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Mama Molefe"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
              <input
                type="tel"
                className="input"
                placeholder="+27 XX XXX XXXX"
                value={emergencyContact.phone}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Relationship</label>
              <select
                className="input"
                value={emergencyContact.relationship}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
              >
                <option value="">Select</option>
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="neighbor">Neighbor</option>
                <option value="spouse">Spouse / Partner</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button onClick={addEmergencyContact} className="btn-outline w-full text-sm">
              + Add Contact
            </button>
          </div>

          {/* Contact List */}
          {emergencyContacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">ADDED CONTACTS ({emergencyContacts.length})</p>
              {emergencyContacts.map(contact => (
                <div key={contact.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.phone} · {contact.relationship || 'Contact'}</p>
                  </div>
                  <button
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="p-2 text-danger-500 hover:bg-danger-50 rounded-xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Note */}
          <div className="bg-safety-50 rounded-xl p-3 flex items-start gap-2">
            <svg className="w-5 h-5 text-safety-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-safety-700">Your Privacy</p>
              <p className="text-xs text-safety-600 mt-0.5">
                Emergency contacts are encrypted and stored only on your device. They are never uploaded to any server.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full mt-4"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Setting up...
              </div>
            ) : (
              'Complete Sign Up'
            )}
          </button>

          <button
            onClick={handleSubmit}
            className="w-full text-center text-sm text-gray-500 py-2"
          >
            Skip — add contacts later
          </button>
        </div>
      )}
    </div>
  );
}
