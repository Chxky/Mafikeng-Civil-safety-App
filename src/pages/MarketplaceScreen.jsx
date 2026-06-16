import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getBusinessListings, createBusinessListing, getClassifiedListings, createClassifiedListing } from '../db/marketplaceApi';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { showToast } from '../utils/helpers';

const BIZ_CATEGORIES = [
  { key: 'retail', label: 'Retail', icon: '🛍️' },
  { key: 'food_dining', label: 'Food & Dining', icon: '🍽️' },
  { key: 'services', label: 'Services', icon: '🔧' },
  { key: 'health_beauty', label: 'Health & Beauty', icon: '💇' },
  { key: 'education', label: 'Education', icon: '📚' },
  { key: 'accommodation', label: 'Accommodation', icon: '🏠' },
  { key: 'transport', label: 'Transport', icon: '🚗' },
  { key: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { key: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { key: 'other', label: 'Other', icon: '📋' },
];

const CLASSIFIED_TYPES = [
  { key: 'for_sale', label: 'For Sale', icon: '💰' },
  { key: 'wanted', label: 'Wanted', icon: '🔍' },
  { key: 'services', label: 'Services', icon: '🔧' },
];

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('businesses');
  const [businesses, setBusinesses] = useState([]);
  const [classifieds, setClassifieds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bizFilter, setBizFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showBizForm, setShowBizForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [bizForm, setBizForm] = useState({ business_name: '', category: '', phone: '', email: '', website: '', address: '', description: '', hours: '' });
  const [classForm, setClassForm] = useState({ listing_type: 'for_sale', title: '', description: '', price: '', category: '', phone: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [bizFilter, classFilter]);

  async function loadData() {
    setLoading(true);
    const [bizRes, classRes] = await Promise.all([
      getBusinessListings(bizFilter ? { category: bizFilter } : {}),
      getClassifiedListings(classFilter ? { type: classFilter } : {}),
    ]);
    setBusinesses(bizRes.data || []);
    setClassifieds(classRes.data || []);
    setLoading(false);
  }

  async function handleBizSubmit() {
    if (!bizForm.business_name || !bizForm.category) { showToast?.('Business name and category required', 'error'); return; }
    setSubmitting(true);
    let lat = -25.8653, lng = 25.6441, addr = 'Mahikeng';
    // eslint-disable-next-line no-empty
    try { const pos = await getCurrentPosition(); lat = pos.lat; lng = pos.lng; addr = await reverseGeocode(lat, lng); } catch {}
    const { error } = await createBusinessListing({ user_token: user?.id, ...bizForm, latitude: lat, longitude: lng, address: bizForm.address || addr });
    if (error) { showToast?.(error, 'error'); } else { showToast?.('Business listed!', 'success'); setShowBizForm(false); setBizForm({ business_name: '', category: '', phone: '', email: '', website: '', address: '', description: '', hours: '' }); loadData(); }
    setSubmitting(false);
  }

  async function handleClassSubmit() {
    if (!classForm.title || !classForm.listing_type) { showToast?.('Title and type required', 'error'); return; }
    setSubmitting(true);
    let lat = null, lng = null;
    // eslint-disable-next-line no-empty
    try { const pos = await getCurrentPosition(); lat = pos.lat; lng = pos.lng; } catch {}
    const { error } = await createClassifiedListing({ user_token: user?.id, ...classForm, price: classForm.price ? Number(classForm.price) : null, latitude: lat, longitude: lng });
    if (error) { showToast?.(error, 'error'); } else { showToast?.('Classified posted!', 'success'); setShowClassForm(false); setClassForm({ listing_type: 'for_sale', title: '', description: '', price: '', category: '', phone: '', is_anonymous: false }); loadData(); }
    setSubmitting(false);
  }

  const tabs = [
    { id: 'businesses', label: 'Businesses', icon: '🏪' },
    { id: 'classifieds', label: 'Classifieds', icon: '📰' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-green-800 to-green-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏪</span>
          <div>
            <h1 className="text-lg font-bold">Marketplace</h1>
            <p className="text-xs opacity-80">Business Directory & Classifieds</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-green-700' : 'text-white/60 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'businesses' && (
        <div className="px-4 py-4 space-y-4">
          <button onClick={() => setShowBizForm(true)} className="btn-primary w-full text-sm">+ Register Your Business</button>

          <div className="flex gap-1 overflow-x-auto pb-1">
            <button onClick={() => setBizFilter('')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${!bizFilter ? 'bg-green-100 text-green-700 border-green-300' : 'border-gray-200 text-gray-500'}`}>All</button>
            {BIZ_CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setBizFilter(c.key)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${bizFilter === c.key ? 'bg-green-100 text-green-700 border-green-300' : 'border-gray-200 text-gray-500'}`}>{c.icon} {c.label}</button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse"><div className="h-16 bg-gray-200 rounded-lg"></div></div>)}</div>
          ) : businesses.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">🏪</span>
              <p className="text-sm text-gray-500">No businesses listed yet</p>
            </div>
          ) : businesses.map(b => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{BIZ_CATEGORIES.find(c => c.key === b.category)?.icon || '🏪'}</span>
                  <div>
                    <h3 className="font-bold text-sm">{b.business_name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{b.category?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                {b.is_verified && <span className="badge bg-blue-100 text-blue-700 text-xs">✅ Verified</span>}
              </div>
              {b.description && <p className="text-xs text-gray-600 mb-2">{b.description}</p>}
              <div className="text-xs text-gray-400 space-y-0.5">
                {b.address && <p>📍 {b.address}</p>}
                {b.phone && <p>📞 {b.phone}</p>}
                {b.hours && <p>🕐 {b.hours}</p>}
              </div>
            </div>
          ))}

          {showBizForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Register Business</h2>
                    <button onClick={() => setShowBizForm(false)} className="p-2">✕</button>
                  </div>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Business Name *</label>
                    <input type="text" value={bizForm.business_name} onChange={e => setBizForm(p => ({ ...p, business_name: e.target.value }))} placeholder="e.g. Mmabatho Spaza Shop" className="input" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Category *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BIZ_CATEGORIES.map(c => (
                        <button key={c.key} onClick={() => setBizForm(p => ({ ...p, category: c.key }))}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border text-left ${bizForm.category === c.key ? 'bg-green-50 text-green-700 border-green-300' : 'border-gray-200 text-gray-500'}`}>
                          {c.icon} {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input type="text" value={bizForm.phone} onChange={e => setBizForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className="input" />
                  <input type="email" value={bizForm.email} onChange={e => setBizForm(p => ({ ...p, email: e.target.value }))} placeholder="Email (optional)" className="input" />
                  <input type="text" value={bizForm.website} onChange={e => setBizForm(p => ({ ...p, website: e.target.value }))} placeholder="Website (optional)" className="input" />
                  <input type="text" value={bizForm.address} onChange={e => setBizForm(p => ({ ...p, address: e.target.value }))} placeholder="Address" className="input" />
                  <textarea value={bizForm.description} onChange={e => setBizForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your business..." className="input min-h-[80px] resize-none" />
                  <input type="text" value={bizForm.hours} onChange={e => setBizForm(p => ({ ...p, hours: e.target.value }))} placeholder="Business hours (optional)" className="input" />
                  <button onClick={handleBizSubmit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'List Business'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'classifieds' && (
        <div className="px-4 py-4 space-y-4">
          <button onClick={() => setShowClassForm(true)} className="btn-primary w-full text-sm">+ Post Ad</button>

          <div className="flex gap-2">
            {CLASSIFIED_TYPES.map(ct => (
              <button key={ct.key} onClick={() => setClassFilter(ct.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border ${classFilter === ct.key ? 'bg-green-100 text-green-700 border-green-300' : 'border-gray-200 text-gray-500'}`}>
                {ct.icon} {ct.label}
              </button>
            ))}
            {classFilter && <button onClick={() => setClassFilter('')} className="py-2 px-3 rounded-xl text-xs font-medium border border-gray-200 text-gray-400">Clear</button>}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse"><div className="h-16 bg-gray-200 rounded-lg"></div></div>)}</div>
          ) : classifieds.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">📰</span>
              <p className="text-sm text-gray-500">No classifieds yet</p>
            </div>
          ) : classifieds.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${c.listing_type === 'for_sale' ? 'bg-green-100 text-green-700' : c.listing_type === 'wanted' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.listing_type === 'for_sale' ? '💰 For Sale' : c.listing_type === 'wanted' ? '🔍 Wanted' : '🔧 Services'}
                    </span>
                    {c.is_anonymous && <span className="text-xs text-gray-400">Anonymous</span>}
                  </div>
                  <h3 className="font-bold text-sm">{c.title}</h3>
                </div>
                {c.price != null && <span className="text-lg font-bold text-green-600">R{c.price.toLocaleString()}</span>}
              </div>
              {c.description && <p className="text-xs text-gray-600 mb-2">{c.description}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {c.phone && <span>📞 {c.phone}</span>}
              </div>
            </div>
          ))}

          {showClassForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Post Classified</h2>
                    <button onClick={() => setShowClassForm(false)} className="p-2">✕</button>
                  </div>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Listing Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CLASSIFIED_TYPES.map(ct => (
                        <button key={ct.key} onClick={() => setClassForm(p => ({ ...p, listing_type: ct.key }))}
                          className={`py-2 rounded-xl text-xs font-medium border ${classForm.listing_type === ct.key ? 'bg-green-50 text-green-700 border-green-300' : 'border-gray-200 text-gray-500'}`}>
                          {ct.icon} {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input type="text" value={classForm.title} onChange={e => setClassForm(p => ({ ...p, title: e.target.value }))} placeholder="Title *" className="input" />
                  <textarea value={classForm.description} onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="input min-h-[80px] resize-none" />
                  <input type="number" value={classForm.price} onChange={e => setClassForm(p => ({ ...p, price: e.target.value }))} placeholder="Price (optional)" className="input" />
                  <input type="text" value={classForm.phone} onChange={e => setClassForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className="input" />
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={classForm.is_anonymous} onChange={e => setClassForm(p => ({ ...p, is_anonymous: e.target.checked }))} className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Post anonymously</span>
                  </label>
                  <button onClick={handleClassSubmit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Posting...' : 'Post Ad'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
