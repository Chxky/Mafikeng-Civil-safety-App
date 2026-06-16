import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { getMunicipalDocuments, getDocumentById } from '../db/documentsApi';
// eslint-disable-next-line no-unused-vars
import { showToast } from '../utils/helpers';

const DOC_TYPES = [
  { key: 'idp', label: 'IDP', icon: '📋' },
  { key: 'sdbip', label: 'SDBIP', icon: '📊' },
  { key: 'annual_report', label: 'Annual Reports', icon: '📈' },
  { key: 'budget', label: 'Budgets', icon: '💰' },
  { key: 'by_law', label: 'By-laws', icon: '⚖️' },
  { key: 'disaster_plan', label: 'Disaster Plans', icon: '🛡️' },
  { key: 'council_minutes', label: 'Council Minutes', icon: '📝' },
  { key: 'policy', label: 'Policies', icon: '📄' },
];

const YEARS = ['2025', '2024', '2023'];

export default function DocumentsScreen() {
  const [activeTab, setActiveTab] = useState('browse');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterType, filterYear]);

  async function loadData() {
    setLoading(true);
    const filters = {};
    if (filterType) filters.type = filterType;
    if (filterYear) filters.year = filterYear;
    const { data } = await getMunicipalDocuments(filters);
    setDocuments(data || []);
    setLoading(false);
  }

  function handleSearch() {
    if (!searchQuery.trim()) { loadData(); return; }
    setLoading(true);
    getMunicipalDocuments({ search: searchQuery }).then(({ data }) => {
      setDocuments(data || []);
      setLoading(false);
    });
  }

  const filteredDocs = documents;

  const tabs = [
    { id: 'browse', label: 'Browse', icon: '📚' },
    { id: 'search', label: 'Search', icon: '🔍' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📚</span>
          <div>
            <h1 className="text-lg font-bold">Document Vault</h1>
            <p className="text-xs opacity-80">Municipal records & publications</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-indigo-700' : 'text-white/60 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="px-4 py-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterType ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-200 text-gray-500'}`}>All Types</button>
            {DOC_TYPES.map(dt => (
              <button key={dt.key} onClick={() => setFilterType(dt.key)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === dt.key ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-200 text-gray-500'}`}>{dt.icon} {dt.label}</button>
            ))}
          </div>

          <div className="flex gap-2">
            {YEARS.map(year => (
              <button key={year} onClick={() => setFilterYear(filterYear === year ? '' : year)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium border ${filterYear === year ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-200 text-gray-500'}`}>{year}</button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse"><div className="h-12 bg-gray-200 rounded-lg"></div></div>)}</div>
          ) : filteredDocs.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-sm text-gray-500">No documents found</p>
            </div>
          ) : filteredDocs.map(doc => {
            const typeInfo = DOC_TYPES.find(dt => dt.key === doc.document_type);
            return (
              <div key={doc.id} className="card cursor-pointer hover:shadow-md" onClick={() => setShowDetail(doc)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{typeInfo?.icon || '📄'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900">{doc.title}</h3>
                    {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-indigo-100 text-indigo-700 text-xs">{typeInfo?.label || doc.document_type}</span>
                      <span className="text-xs text-gray-400">{doc.year}</span>
                      {doc.is_offline_available && <span className="text-xs text-gray-400">📥 Offline</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="px-4 py-4 space-y-4">
          <div className="flex gap-2">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search documents..." className="input flex-1" />
            <button onClick={handleSearch} className="btn-primary text-sm">Search</button>
          </div>

          {searchQuery && filteredDocs.length === 0 && !loading && (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">🔍</span>              <p className="text-sm text-gray-500">No results for "{searchQuery}"</p>
            </div>
          )}

          {filteredDocs.map(doc => (
            <div key={doc.id} className="card cursor-pointer hover:shadow-md" onClick={() => setShowDetail(doc)}>
              <h3 className="font-bold text-sm">{doc.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{doc.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-indigo-100 text-indigo-700 text-xs">{doc.document_type?.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-400">{doc.year}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Document Details</h2>
                <button onClick={() => setShowDetail(null)} className="p-2">✕</button>
              </div>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl">{DOC_TYPES.find(dt => dt.key === showDetail.document_type)?.icon || '📄'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{showDetail.title}</h3>
                  <p className="text-xs text-gray-400 capitalize">{showDetail.document_type?.replace(/_/g, ' ')} • {showDetail.year}</p>
                </div>
              </div>
              {showDetail.description && (
                <p className="text-xs text-gray-600 leading-relaxed">{showDetail.description}</p>
              )}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-600">
                {showDetail.department && <p>🏛️ Department: {showDetail.department}</p>}
                {showDetail.file_size_bytes && <p>💾 Size: {(showDetail.file_size_bytes / 1024).toFixed(0)} KB</p>}
                <p>📥 {showDetail.is_offline_available ? 'Available for offline reading' : 'Online only'}</p>
              </div>
              {showDetail.file_url ? (
                <a href={showDetail.file_url} target="_blank" rel="noopener noreferrer" className="btn-primary block text-center text-sm">📄 Open Document</a>
              ) : (
                <div className="card bg-indigo-50 border-indigo-200 text-center py-4">
                  <p className="text-xs text-indigo-600">Document will be available for download when connected to the municipal server.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
