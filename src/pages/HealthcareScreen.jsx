import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getHealthcareFacilities, submitFacilityReport, createAppointmentReminder, updateFacilityWaitTime } from '../db/healthcareApi';
// eslint-disable-next-line no-unused-vars
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { showToast, timeAgo } from '../utils/helpers';

const FACILITY_TYPES = [
  { key: 'hospital', label: 'Hospital', icon: '🏥' },
  { key: 'clinic', label: 'Clinic', icon: '🏪' },
  { key: 'community_health_centre', label: 'Health Centre', icon: '🏛️' },
  { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { key: 'private_practice', label: 'Private Practice', icon: '🩺' },
];

const REPORT_TYPES = [
  { key: 'no_medicine', label: 'No Medicine', icon: '💊' },
  { key: 'long_queue', label: 'Long Queue', icon: '⏰' },
  { key: 'facility_closed', label: 'Facility Closed', icon: '🔒' },
  { key: 'staff_absent', label: 'Staff Absent', icon: '👤' },
  { key: 'other', label: 'Other', icon: '📋' },
];

export default function HealthcareScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('facilities');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showReport, setShowReport] = useState(null);
  const [reportType, setReportType] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAppointment, setShowAppointment] = useState(null);
  const [apptDate, setApptDate] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  // eslint-disable-next-line react-hooks/immutability, react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterType]);

  async function loadData() {
    setLoading(true);
    const { data } = await getHealthcareFacilities(filterType ? { type: filterType } : {});
    setFacilities(data || []);
    setLoading(false);
  }

  async function handleReportSubmit() {
    if (!reportType) { showToast?.('Select a report type', 'error'); return; }
    setSubmitting(true);
    const { error } = await submitFacilityReport({ facility_id: showReport.id, user_token: user?.id, report_type: reportType, description: reportDesc });
    if (error) { showToast?.(error, 'error'); } else { showToast?.('Report submitted', 'success'); setShowReport(null); setReportType(''); setReportDesc(''); }
    setSubmitting(false);
  }

  async function handleAddAppointment() {
    if (!apptDate) { showToast?.('Select a date and time', 'error'); return; }
    const { error } = await createAppointmentReminder({ user_token: user?.id, facility_id: showAppointment.id, appointment_date: new Date(apptDate).toISOString(), notes: apptNotes });
    if (error) { showToast?.(error, 'error'); } else { showToast?.('Appointment reminder set', 'success'); setShowAppointment(null); setApptDate(''); setApptNotes(''); }
  }

  // eslint-disable-next-line no-unused-vars
  async function handleUpdateWaitTime(facilityId, minutes) {
    await updateFacilityWaitTime(facilityId, minutes);
    loadData();
    showToast?.('Queue time updated', 'success');
  }

  const tabs = [
    { id: 'facilities', label: 'Facilities', icon: '🏥' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
  ];

  return (
    <div className="pb-safe bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏥</span>
          <div>
            <h1 className="text-lg font-bold">Healthcare Access</h1>
            <p className="text-xs opacity-80">Facilities, queues & medicine</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-teal-700' : 'text-white/60 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'facilities' && (
        <div className="px-4 py-4 space-y-4">
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button onClick={() => setFilterType('')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterType ? 'bg-teal-100 text-teal-700 border-teal-300' : 'border-gray-200 text-gray-500'}`}>All</button>
            {FACILITY_TYPES.map(t => (
              <button key={t.key} onClick={() => setFilterType(t.key)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border ${filterType === t.key ? 'bg-teal-100 text-teal-700 border-teal-300' : 'border-gray-200 text-gray-500'}`}>{t.icon} {t.label}</button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded-lg"></div></div>)}</div>
          ) : facilities.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-3">🏥</span>
              <p className="text-sm text-gray-500">No facilities found</p>
            </div>
          ) : facilities.map(f => {
            const typeInfo = FACILITY_TYPES.find(t => t.key === f.facility_type);
            return (
              <div key={f.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeInfo?.icon || '🏥'}</span>
                    <div>
                      <h3 className="font-bold text-sm">{f.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{typeInfo?.label || f.facility_type?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.queue_wait_minutes <= 30 ? 'bg-safety-100 text-safety-700' : f.queue_wait_minutes <= 60 ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'}`}>
                    ~{f.queue_wait_minutes} min
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">{f.address}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>📞 {f.phone}</span>
                  <span>🕐 {f.hours}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 flex-wrap">
                  {f.services?.slice(0, 3).map(s => <span key={s} className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">{s.replace(/_/g, ' ')}</span>)}
                </div>
                <div className="flex items-center gap-2">
                  {f.has_medicine ? (
                    <span className="badge bg-safety-100 text-safety-700 text-xs">✅ Medicine Available</span>
                  ) : (
                    <span className="badge bg-danger-100 text-danger-700 text-xs">❌ No Medicine</span>
                  )}
                  <span className="text-xs text-gray-400">Updated {timeAgo(f.queue_updated_at)}</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setShowReport(f)} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Report Issue</button>
                  <button onClick={() => setShowAppointment(f)} className="flex-1 py-2 rounded-lg bg-teal-500 text-white text-xs font-medium hover:bg-teal-600">Set Reminder</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="px-4 py-4">
          <div className="card text-center py-12">
            <span className="text-4xl block mb-3">📅</span>
            <h3 className="font-bold text-sm mb-2">Appointment Reminders</h3>
            <p className="text-xs text-gray-500 mb-4">Set reminders for healthcare appointments and never miss a visit.</p>
            <p className="text-xs text-gray-400">Select a facility above to set a reminder.</p>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Report Issue</h2>
                <button onClick={() => setShowReport(null)} className="p-2">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{showReport.name}</p>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>                <label className="text-sm font-medium text-gray-700 mb-2 block">What&apos;s the issue?</label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map(rt => (
                    <button key={rt.key} onClick={() => setReportType(rt.key)}
                      className={`py-3 px-3 rounded-xl text-sm font-medium border text-left ${reportType === rt.key ? 'bg-teal-50 text-teal-700 border-teal-300' : 'border-gray-200 text-gray-500'}`}>
                      {rt.icon} {rt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description (optional)</label>
                <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Provide more details..." className="input min-h-[80px] resize-none" />
              </div>
              <button onClick={handleReportSubmit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'Submit Report'}</button>
            </div>
          </div>
        </div>
      )}

      {showAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Appointment Reminder</h2>
                <button onClick={() => setShowAppointment(null)} className="p-2">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{showAppointment.name}</p>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date & Time</label>
                <input type="datetime-local" value={apptDate} onChange={e => setApptDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
                <textarea value={apptNotes} onChange={e => setApptNotes(e.target.value)} placeholder="e.g. Bring medical records" className="input min-h-[80px] resize-none" />
              </div>
              <button onClick={handleAddAppointment} className="btn-primary w-full">Set Reminder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
