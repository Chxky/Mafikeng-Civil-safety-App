import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEADERS = [
  {
    id: 1,
    name: 'Cllr. Kgomotso Mokgatlhe',
    role: 'Ward Councillor',
    ward: 'Ward 1 — Central Mahikeng',
    phone: '018 381 8200',
    email: 'kmokgatlhe@mahikeng.gov.za',
    area: 'CBD, Station Road area',
    available: 'Mon-Fri 8:00-16:30',
    category: 'municipality',
  },
  {
    id: 2,
    name: 'Cllr. Thapelo Modise',
    role: 'Ward Councillor',
    ward: 'Ward 3 — Riviera Park',
    phone: '018 381 8201',
    email: 'tmodise@mahikeng.gov.za',
    area: 'Riviera Park, Extension 1-4',
    available: 'Mon-Fri 8:00-16:30',
    category: 'municipality',
  },
  {
    id: 3,
    name: 'Cllr. Mmathapelo Tau',
    role: 'Ward Councillor',
    ward: 'Ward 5 — Montshiwa',
    phone: '018 381 8202',
    email: 'mtau@mahikeng.gov.za',
    area: 'Montshiwa, Blikkiesdorp',
    available: 'Mon-Fri 8:00-16:30',
    category: 'municipality',
  },
  {
    id: 4,
    name: 'Cllr. Boitumelo Moiloa',
    role: 'Ward Councillor',
    ward: 'Ward 7 — Mmabatho',
    phone: '018 381 8203',
    email: 'bmoiloa@mahikeng.gov.za',
    area: 'Mmabatho, Unit 1-7',
    available: 'Mon-Fri 8:00-16:30',
    category: 'municipality',
  },
  {
    id: 5,
    name: 'Mr. Patrick Molefe',
    role: 'CPF Chairperson',
    ward: 'Mahikeng Central CPF',
    phone: '082 456 7890',
    email: null,
    area: 'Greater Mahikeng Central',
    available: 'Available evenings',
    category: 'cpf',
  },
  {
    id: 6,
    name: 'Mrs. Dorah Kganakga',
    role: 'CPF Deputy Chair',
    ward: 'Mahikeng Central CPF',
    phone: '076 234 5678',
    email: null,
    area: 'Greater Mahikeng Central',
    available: 'Available weekends',
    category: 'cpf',
  },
  {
    id: 7,
    name: 'Mr. Johannes Mokoena',
    role: 'Community Safety Forum Chair',
    ward: 'Riviera Park Safety Forum',
    phone: '083 678 9012',
    email: null,
    area: 'Riviera Park & Extensions',
    available: 'Tue-Thu evenings',
    category: 'safety_forum',
  },
  {
    id: 8,
    name: 'Mr. Thuso Mogwe',
    role: 'Patrol Group Leader',
    ward: 'Montshiwa Night Patrol',
    phone: '079 876 5432',
    email: null,
    area: 'Montshiwa Township',
    available: 'Night shifts 20:00-04:00',
    category: 'patrol',
  },
  {
    id: 9,
    name: 'Mrs. Kelebogile Nkosi',
    role: 'Community Development Worker',
    ward: 'Ward 2',
    phone: '018 381 8210',
    email: 'knkosi@mahikeng.gov.za',
    area: 'Ward 2 service delivery',
    available: 'Mon-Fri 8:00-16:30',
    category: 'municipality',
  },
  {
    id: 10,
    name: 'Mr. Tshepo Mabena',
    role: 'Youth Safety Forum Lead',
    ward: 'Mahikeng Youth Safety',
    phone: '071 234 5678',
    email: null,
    area: 'Mahikeng-wide youth programs',
    available: 'Sat 10:00-14:00',
    category: 'safety_forum',
  },
];

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

  const filtered = LEADERS.filter(leader => {
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
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Community Leaders</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
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
            <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="font-bold text-lg">10111</span>
                </div>
                <span className="text-xs font-medium">SAPS Emergency</span>
              </button>
              <button
                onClick={() => handleCall('0183818200')}
                className="w-full flex items-center justify-between bg-white border border-danger-200 rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
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
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{leader.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{leader.available}</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCall(leader.phone)}
                    className="flex-1 flex items-center justify-center gap-2 bg-safety-600 text-white rounded-xl py-2.5 text-sm font-medium active:scale-95 transition-transform"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    Call
                  </button>
                  {leader.email && (
                    <button
                      onClick={() => window.location.href = `mailto:${leader.email}`}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
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
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-gray-400 font-medium">No leaders found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
