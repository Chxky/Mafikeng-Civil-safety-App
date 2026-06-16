import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getJobListings, getSavedListings, toggleSavedListing, createJobAlert, getJobAlerts } from '../db/jobsApi';
import { showToast, formatDate } from '../utils/helpers';
import { DEPARTMENTS } from '../utils/helpers';

export default function JobsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [filterDept, setFilterDept] = useState('');
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertKeywords, setAlertKeywords] = useState('');
  const [showDetail, setShowDetail] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterType, filterDept]);

  async function loadData() {
    setLoading(true);
    const [listingsRes, savedRes, alertsRes] = await Promise.all([
      getJobListings({ type: filterType || undefined, department: filterDept || undefined }),
      getSavedListings(user?.id),
      getJobAlerts(user?.id),
    ]);
    setListings(listingsRes.data || []);
    setSaved(savedRes.data || []);
    setSavedIds(new Set((savedRes.data || []).map(s => s.listing_id)));
    setAlerts(alertsRes.data || []);
    setLoading(false);
  }

  async function handleToggleSave(listingId) {
    const { data } = await toggleSavedListing(user?.id, listingId);
    if (data?.saved) {
      setSavedIds(prev => new Set([...prev, listingId]));
      showToast?.('Saved!', 'success');
    } else {
      setSavedIds(prev => { const n = new Set(prev); n.delete(listingId); return n; });
      showToast?.('Removed from saved', 'success');
    }
  }

  async function handleCreateAlert() {
    if (!alertKeywords.trim()) { showToast?.('Enter keywords', 'error'); return; }
    const { error } = await createJobAlert({ user_token: user?.id, keywords: alertKeywords.split(',').map(k => k.trim()), listing_type: filterType || null });
    if (error) { showToast?.(error, 'error'); } else { showToast?.('Alert created!', 'success'); setShowAlertForm(false); setAlertKeywords(''); loadData(); }
  }

  const tabs = [
    { id: 'browse', label: 'Browse', icon: '📋' },
    { id: 'saved', label: 'Saved', icon: '⭐' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
  ];

  function ListingCard({ listing, isSaved }) {
    const dept = DEPARTMENTS[listing.department];
    return (
      <div className="card cursor-pointer hover:shadow-md" onClick={() => setShowDetail(listing)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{dept?.icon || '📋'}</span>
            <div>
              <h3 className="font-bold text-sm">{listing.title}</h3>
              <p className="text-xs text-gray-400">{dept?.name || listing.department} • {listing.location || 'Mahikeng'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`badge text-xs ${listing.listing_type === 'job' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {listing.listing_type === 'job' ? 'Job' : 'Tender'}
            </span>
            <button onClick={(e) => { e.stopPropagation(); handleToggleSave(listing.id); }} className="p-1">
              {isSaved ? '⭐' : '☆'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{listing.description}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Closes: {formatDate(listing.closing_date)}</span>
          {listing.salary_range && <span className="font-medium text-civic-600">{listing.salary_range}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📋</span>
          <div>
            <h1 className="text-lg font-bold">Jobs & Tenders</h1>
            <p className="text-xs opacity-80">Municipal career opportunities</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-amber-700' : 'text-white/60 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="px-4 py-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterType ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-gray-200 text-gray-500'}`}>All</button>
            <button onClick={() => setFilterType('job')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === 'job' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-gray-200 text-gray-500'}`}>💼 Jobs</button>
            <button onClick={() => setFilterType('tender')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === 'tender' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-gray-200 text-gray-500'}`}>📄 Tenders</button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse"><div className="h-16 bg-gray-200 rounded-lg"></div></div>)}</div>
          ) : listings.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-sm text-gray-500">No listings found</p>
            </div>
          ) : listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} isSaved={savedIds.has(listing.id)} />
          ))}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="px-4 py-4 space-y-4">
          {saved.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">⭐</span>
              <p className="text-sm text-gray-500">No saved listings</p>
              <p className="text-xs text-gray-400 mt-1">Tap the star on a listing to save it</p>
            </div>
          ) : saved.map(s => (
            <ListingCard key={s.id} listing={s.job_listings} isSaved={true} />
          ))}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="px-4 py-4 space-y-4">
          <button onClick={() => setShowAlertForm(true)} className="btn-primary w-full text-sm">+ Create Keyword Alert</button>
          {alerts.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">🔔</span>
              <p className="text-sm text-gray-500">No alerts yet</p>
              <p className="text-xs text-gray-400 mt-1">Create alerts to get notified about new listings matching your keywords</p>
            </div>
          ) : alerts.map(alert => (
            <div key={alert.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Keywords: {alert.keywords?.join(', ')}</p>
                  {alert.listing_type && <p className="text-xs text-gray-400 capitalize">{alert.listing_type} listings</p>}
                </div>
                <span className="badge bg-safety-100 text-safety-700">Active</span>
              </div>
            </div>
          ))}

          {showAlertForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Create Keyword Alert</h2>
                    <button onClick={() => setShowAlertForm(false)} className="p-2">✕</button>
                  </div>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Keywords (comma-separated)</label>
                    <input type="text" value={alertKeywords} onChange={e => setAlertKeywords(e.target.value)} placeholder="e.g. engineer, water, roads" className="input" />
                  </div>
                  <button onClick={handleCreateAlert} className="btn-primary w-full">Create Alert</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{showDetail.listing_type === 'job' ? 'Job Details' : 'Tender Details'}</h2>
                <button onClick={() => setShowDetail(null)} className="p-2">✕</button>
              </div>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <h3 className="font-bold text-base">{showDetail.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{showDetail.location || 'Mahikeng'} • Closes {formatDate(showDetail.closing_date)}</p>
              </div>
              {showDetail.salary_range && (
                <div className="card bg-amber-50 border-amber-200">
                  <p className="text-sm font-medium text-amber-800">{showDetail.salary_range}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{showDetail.description}</p>
              </div>
              {showDetail.requirements && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Requirements</h4>
                  <p className="text-xs text-gray-600">{showDetail.requirements}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contact</h4>
                <p className="text-xs text-gray-600">📧 {showDetail.contact_email}</p>
                <p className="text-xs text-gray-600">📞 {showDetail.contact_phone}</p>
              </div>
              <button onClick={() => handleToggleSave(showDetail.id)} className="btn-primary w-full">{savedIds.has(showDetail.id) ? '⭐ Saved' : '☆ Save Listing'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
