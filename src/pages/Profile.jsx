import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNetwork } from '../hooks/useNetwork';
import { getCivicReports, getDashboardStats } from '../db/mockApi';
import { getEmergencyContacts, saveEmergencyContacts } from '../db/offline';
import { showToast } from '../utils/helpers';
import { requestNotificationPermission, subscribeToPush, unsubscribeFromPush, isSubscribed } from '../utils/notifications';

export default function Profile() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [myReportsCount, setMyReportsCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [contactsData, reportsRes, statsRes, subscribed] = await Promise.all([
        getEmergencyContacts(),
        getCivicReports({ userTokenId: user?.id }),
        getDashboardStats(),
        isSubscribed(),
      ]);
      setPushEnabled(subscribed);
      setContacts(contactsData);
      setMyReportsCount(reportsRes.data?.length || 0);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  }

  async function handleTogglePush() {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(user?.id);
        setPushEnabled(false);
        showToast?.('Notifications disabled', 'info');
      } else {
        const { granted, error } = await requestNotificationPermission();
        if (!granted) {
          showToast?.(error || 'Permission denied', 'error');
          setPushLoading(false);
          return;
        }
        const { error: subError } = await subscribeToPush(user?.id);
        if (subError) {
          showToast?.(subError, 'error');
        } else {
          setPushEnabled(true);
          showToast?.('Notifications enabled', 'success');
        }
      }
    } catch (err) {
      showToast?.('Failed to update notifications', 'error');
    }
    setPushLoading(false);
  }

  async function handleAddContact() {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      showToast?.('Please fill in all fields', 'error');
      return;
    }

    const updated = [...contacts, { id: Date.now().toString(), ...newContact }];
    await saveEmergencyContacts(updated);
    setContacts(updated);
    setNewContact({ name: '', phone: '' });
    setShowAddContact(false);
    showToast?.('Emergency contact added', 'success');
  }

  async function removeContact(id) {
    const updated = contacts.filter(c => c.id !== id);
    await saveEmergencyContacts(updated);
    setContacts(updated);
    showToast?.('Contact removed', 'info');
  }

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-br from-civic-600 to-civic-800 text-white px-4 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.displayName || 'Community Member'}</h1>
            <p className="text-civic-200 text-sm">Anonymous Account</p>
            <p className="text-civic-300 text-xs mt-0.5">ID: {user?.id?.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{myReportsCount}</p>
            <p className="text-xs text-civic-200">Reports</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{contacts.length}</p>
            <p className="text-xs text-civic-200">Contacts</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{isOnline ? '🟢' : '🔴'}</p>
            <p className="text-xs text-civic-200">Status</p>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Emergency Contacts</h2>
          <button
            onClick={() => setShowAddContact(true)}
            className="text-sm text-civic-600 font-medium"
          >
            + Add
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          These contacts will be notified when you activate SOS. Stored encrypted on your device only.
        </p>

        {contacts.length === 0 ? (
          <div className="card text-center py-6">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-gray-400 text-sm mb-3">No emergency contacts</p>
            <button
              onClick={() => setShowAddContact(true)}
              className="btn-primary text-sm"
            >
              Add Contact
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map(contact => (
              <div key={contact.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.phone}</p>
                </div>
                <button
                  onClick={() => removeContact(contact.id)}
                  className="p-2 hover:bg-danger-50 rounded-xl text-danger-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Add Emergency Contact</h2>
                <button onClick={() => setShowAddContact(false)} className="p-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+27 XX XXX XXXX"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <button onClick={handleAddContact} className="btn-primary w-full">
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="px-4 pb-6">
        <h2 className="section-title">Settings</h2>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/my-reports')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-civic-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-civic-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <span className="text-sm font-medium">My Reports</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/patrol')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-safety-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-safety-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Patrol Mode</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/leaders')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zm-13.5 0a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Community Leaders</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
              </div>
              <span className="text-sm font-medium">Admin Dashboard</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/ussd')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium">USSD/SMS Bot</span>
                <p className="text-xs text-gray-400">For feature phones</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="px-4 mt-4">
        <h3 className="section-title">Notifications</h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-civic-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-civic-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-gray-400">SOS alerts and report updates</p>
              </div>
            </div>
            <button
              onClick={handleTogglePush}
              disabled={pushLoading}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                pushEnabled ? 'bg-safety-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-transform ${
                pushEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Info */}
      <div className="px-4 pb-8">
        <div className="bg-civic-50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-civic-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <h3 className="font-semibold text-sm text-civic-800">POPI Act Compliant</h3>
              <p className="text-xs text-civic-600 mt-1">
                Your data is encrypted and minimized. Safety reports are anonymous.
                Emergency contacts are stored only on your device. Location data is fuzzed
                on public maps to protect your exact address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
