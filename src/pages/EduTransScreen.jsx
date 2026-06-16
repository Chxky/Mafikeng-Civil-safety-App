import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
// eslint-disable-next-line no-unused-vars
import { reportStranded, getStrandedReports } from '../db/transportApi';
import { showToast } from '../utils/helpers';
import ChildTracker from '../components/ChildTracker';
import VehicleCheck from '../components/VehicleCheck';

export default function EduTransScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('track');

  const tabs = [
    { id: 'track', label: 'Track', icon: '📍' },
    { id: 'report', label: 'Report', icon: '⚠️' },
    { id: 'vehicle', label: 'Vehicle', icon: '🔍' },
    { id: 'stranded', label: 'Stranded', icon: '🚨' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🚌</span>
          <div>
            <h1 className="text-lg font-bold">EduTrans</h1>
            <p className="text-xs text-blue-200">School Transport Tracking & Safety</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-blue-700' : 'text-blue-200 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'track' && (
        <div className="px-4 py-4">
          <ChildTracker userId={user?.id} />
        </div>
      )}

      {activeTab === 'report' && (
        <div className="px-4 py-4 space-y-4">
          <div className="card">
            <h3 className="font-bold text-sm mb-2">Report Unsafe Transport</h3>
            <p className="text-xs text-gray-500 mb-3">Report an unroadworthy vehicle, unsafe driving, or overloaded bus.</p>
            <VehicleCheck />
          </div>
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-700">📞 North West Transport: 018 388 4546</p>
            <p className="text-xs text-blue-700 mt-1">📞 Department of Education: 018 388 2543</p>
          </div>
        </div>
      )}

      {activeTab === 'vehicle' && (
        <div className="px-4 py-4">
          <VehicleCheck />
        </div>
      )}

      {activeTab === 'stranded' && <StrandedTab userId={user?.id} />}
    </div>
  );
}

function StrandedTab({ userId }) {
  // eslint-disable-next-line no-unused-vars
  const [routeId, setRouteId] = useState('');
  const [reporting, setReporting] = useState(false);

  async function handleReportStranded() {
    setReporting(true);
    const { error } = await reportStranded(routeId || null, userId);
    if (error) showToast?.(error, 'error');
    else showToast?.('Stranded report sent. Other parents will be alerted.', 'success');
    setReporting(false);
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="card text-center py-8">
        <span className="text-4xl block mb-3">🚨</span>
        <h3 className="font-bold text-sm mb-2">My Child is Stranded</h3>        <p className="text-xs text-gray-500 mb-4">Report that your child's transport has not arrived. Other parents and the school will be alerted.</p>
        <button onClick={handleReportStranded} disabled={reporting} className="btn-danger">
          {reporting ? 'Sending...' : '🚨 Report Stranded'}
        </button>
      </div>

      <div className="card bg-warning-50 border-warning-200">
        <h4 className="font-bold text-sm text-warning-800 mb-2">If transport is cancelled</h4>
        <p className="text-xs text-warning-700">The system will automatically alert parents when a scheduled trip is cancelled or no driver starts within 30 minutes of expected time.</p>
      </div>

      <div className="card">
        <h4 className="font-bold text-sm mb-2">Emergency Contacts</h4>
        <div className="space-y-2 text-xs">
          <a href="tel:0183884546" className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span>North West Transport</span><span className="text-blue-600">018 388 4546</span>
          </a>
          <a href="tel:0183882543" className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span>Department of Education</span><span className="text-blue-600">018 388 2543</span>
          </a>
        </div>
      </div>
    </div>
  );
}
