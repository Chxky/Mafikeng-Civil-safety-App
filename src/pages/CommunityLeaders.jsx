import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunityLeaders } from '../db/api';
import Icon from '../components/Icon';

const CATEGORIES = {
  all: { label: 'All', icon: '👥' },
  municipality: { label: 'Municipality', icon: '🏛️' },
  cpf: { label: 'Police Forum', icon: '🛡️' },
  safety_forum: { label: 'Safety Forum', icon: '🤝' },
  patrol: { label: 'Patrol Groups', icon: '🔦' },
};

export default function CommunityLeaders() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaders, setLeaders] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityLeaders().then(({ data }) => {
      setLeaders(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = leaders.filter(leader => {
    const matchesCategory = filter === 'all' || leader.category === filter;
    const matchesSearch = !searchQuery ||
      leader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.ward.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleCall(phone) {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <Icon name="arrowLeft" className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">Community Leaders</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name, area, or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                filter === key ? 'bg-civic-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SAPS Hotline Banner */}
      <div className="mx-4 mt-4 bg-danger-50 border border-danger-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0">
            <Icon name="phone" className="w-6 h-6 text-danger-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-danger-800">SAPS Emergency Hotline</h3>
            <p className="text-xs text-danger-600 mt-0.5 mb-2">For crimes in progress or immediate danger</p>
            <div className="space-y-1.5">
              <button
                onClick={() => handleCall('10111')}
                className="w-full flex items-center justify-between bg-danger-600 text-white rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Icon name="phone" className="w-5 h-5" />
                  <span className="font-bold text-lg">10111</span>
                </div>
                <span className="text-xs font-medium">SAPS Emergency</span>
              </button>
              <button
                onClick={() => handleCall('0183818200')}
                className="w-full flex items-center justify-between bg-white border border-danger-200 rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Icon name="phone" className="w-5 h-5 text-danger-600" />
                  <span className="font-bold text-danger-700">018 381 8200</span>
                </div>
                <span className="text-xs text-danger-600 font-medium">Mahikeng SAPS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaders List */}
      <div className="px-4 py-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {filtered.length} LEADER{filtered.length !== 1 ? 'S' : ''} FOUND
        </p>

        <div className="space-y-3">
          {filtered.map(leader => {
            const cat = CATEGORIES[leader.category];

            return (
              <div key={leader.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-civic-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{cat?.icon || '👤'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900">{leader.name}</h3>
                    <p className="text-xs text-civic-600 font-medium">{leader.role}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{leader.ward}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon name="locationPin" className="w-4 h-4 text-gray-400" />
                    <span>{leader.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon name="clock" className="w-4 h-4 text-gray-400" />
                    <span>{leader.available}</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCall(leader.phone)}
                    className="flex-1 flex items-center justify-center gap-2 bg-safety-600 text-white rounded-xl py-2.5 text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Icon name="phone" className="w-4 h-4" />
                    Call
                  </button>
                  {leader.email && (
                    <button
                      onClick={() => window.location.href = `mailto:${leader.email}`}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium active:scale-95 transition-transform"
                    >
                      <Icon name="envelope" className="w-4 h-4" />
                      Email
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Icon name="users" className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
            <p className="text-gray-400 font-medium">No leaders found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
