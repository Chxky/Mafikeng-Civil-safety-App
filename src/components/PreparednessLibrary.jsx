import { useState, useEffect } from 'react';
import { getResilienceResources } from '../db/disasterApi';
import Icon from './Icon';

const CATEGORY_FILTERS = [
  { key: null, label: 'All', icon: '📚' },
  { key: 'flood_safety', label: 'Flood', icon: '🌊' },
  { key: 'fire_safety', label: 'Fire', icon: '🔥' },
  { key: 'evacuation', label: 'Evacuation', icon: '🚪' },
  { key: 'first_aid', label: 'First Aid', icon: '🩺' },
  { key: 'emergency_kit', label: 'Kit', icon: '🎒' },
];

export default function PreparednessLibrary() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getResilienceResources().then(({ data }) => {
      setResources(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter ? resources.filter(r => r.category === filter) : resources;

  if (loading) return <div className="card animate-pulse"><div className="h-32 bg-gray-200 rounded-lg"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORY_FILTERS.map(cat => (
          <button key={cat.key || 'all'} onClick={() => setFilter(cat.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filter === cat.key ? 'bg-civic-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(resource => (
          <div key={resource.id} className="card cursor-pointer" onClick={() => setExpanded(expanded === resource.id ? null : resource.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-bold">{resource.title}</h4>
                <span className="badge bg-gray-100 text-gray-500 text-xs mt-1">{resource.category.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                {resource.is_offline_available && <span className="text-xs text-safety-600">📱 Offline</span>}
                <Icon name="chevronDown" className={`w-4 h-4 text-gray-400 transition-transform ${expanded === resource.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expanded === resource.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-600 leading-relaxed">{resource.description}</p>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-sm text-gray-400">No resources in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
