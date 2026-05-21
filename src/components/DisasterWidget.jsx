import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeatherWarnings } from '../db/disasterApi';

const severityOrder = { warning: 3, watch: 2, advisory: 1 };

export default function DisasterWidget() {
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherWarnings().then(({ data }) => {
      setWarnings(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (warnings.length === 0) return null;

  const highest = warnings.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))[0];
  const isWarning = highest.severity === 'warning';
  const isWatch = highest.severity === 'watch';

  return (
    <div
      onClick={() => navigate('/disaster')}
      className={`card cursor-pointer border-l-4 ${
        isWarning ? 'border-l-danger-500 bg-danger-50' :
        isWatch ? 'border-l-warning-500 bg-warning-50' :
        'border-l-yellow-400 bg-yellow-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">Disaster Shield</span>
              <span className={`badge text-xs ${
                isWarning ? 'bg-danger-100 text-danger-700' :
                isWatch ? 'bg-warning-100 text-warning-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {highest.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{highest.event_type.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isWarning && <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></div>}
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
