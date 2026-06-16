import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useNetwork } from '../hooks/useNetwork';
import { useTheme } from '../hooks/useTheme';
import { getCivicReports, getDashboardStats } from '../db/mockApi';
import { getEmergencyContacts, saveEmergencyContacts } from '../db/offline';
import { showToast } from '../utils/helpers';
import { requestNotificationPermission, subscribeToPush, unsubscribeFromPush, isSubscribed } from '../utils/notifications';
import LanguageSelector from '../components/LanguageSelector';
import Icon from '../components/Icon';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isOnline } = useNetwork();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [myReportsCount, setMyReportsCount] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <Icon name="user" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.displayName || t('community_member')}</h1>
            <p className="text-civic-200 text-sm">{t('anonymous_account')}</p>
            <p className="text-civic-300 text-xs mt-0.5">ID: {user?.id?.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{myReportsCount}</p>
            <p className="text-xs text-civic-200">{t('reports')}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{contacts.length}</p>
            <p className="text-xs text-civic-200">{t('contacts')}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{isOnline ? '🟢' : '🔴'}</p>
            <p className="text-xs text-civic-200">{t('status')}</p>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{t('emergency_contacts')}</h2>
          <button
            onClick={() => setShowAddContact(true)}
            className="text-sm text-civic-600 font-medium"
          >
            + {t('add')}
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {t('emergency_contacts_desc')}
        </p>

        {contacts.length === 0 ? (
          <div className="card text-center py-6">
            <Icon name="users" className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1} />
            <p className="text-gray-400 text-sm mb-3">{t('no_emergency_contacts')}</p>
            <button
              onClick={() => setShowAddContact(true)}
              className="btn-primary text-sm"
            >
              {t('add_contact')}
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
                  aria-label="Remove contact"
                >
                  <Icon name="trash" className="w-5 h-5" />
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
                <h2 className="text-lg font-bold">{t('add_emergency_contact')}</h2>
                <button onClick={() => setShowAddContact(false)} className="p-2" aria-label="Close">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-4 pt-4 pb-8 space-y-4 max-h-[75vh] overflow-y-auto pb-safe">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{t('contact_name')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('contact_name_placeholder')}
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{t('phone_number')}</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+27 XX XXX XXXX"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <button onClick={handleAddContact} className="btn-primary w-full">
                {t('add_contact')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="px-4 pb-6">
        <h2 className="section-title">{t('settings')}</h2>
        <div className="space-y-2">
          <LanguageSelector variant="inline" />
          <button
            onClick={toggleTheme}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
              </div>
              <span className="text-sm font-medium dark:text-gray-200">{isDark ? t('light_mode') : t('dark_mode')}</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${isDark ? 'bg-civic-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${isDark ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
            </div>
          </button>
          <button
            onClick={() => navigate('/my-reports')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-civic-100 flex items-center justify-center">
                <Icon name="documentText" className="w-5 h-5 text-civic-600" />
              </div>
              <span className="text-sm font-medium">{t('my_reports')}</span>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/patrol')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-safety-100 flex items-center justify-center">
                <Icon name="users" className="w-5 h-5 text-safety-600" />
              </div>
              <span className="text-sm font-medium">{t('patrol_mode')}</span>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/leaders')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Icon name="users" className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium">{t('community_leaders')}</span>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Icon name="chartBar" className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium">{t('admin_dashboard')}</span>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/ussd')}
            className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                <Icon name="devicePhone" className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <span className="text-sm font-medium">{t('ussd_bot')}</span>
                <p className="text-xs text-gray-400">{t('for_feature_phones')}</p>
              </div>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="px-4 mt-4">
        <h3 className="section-title">{t('notifications')}</h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-civic-100 flex items-center justify-center">
                <Icon name="bell" className="w-5 h-5 text-civic-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('push_notifications')}</p>
                <p className="text-xs text-gray-400">{t('push_notifications_desc')}</p>
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
            <Icon name="shield" className="w-6 h-6 text-civic-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm text-civic-800">{t('popi_compliant')}</h3>
              <p className="text-xs text-civic-600 mt-1">
                {t('popi_notice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
