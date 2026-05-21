import { useState } from 'react';
import { checkVehiclePermit, reportUnsafeTransport } from '../db/transportApi';
import { showToast } from '../utils/helpers';

export default function VehicleCheck() {
  const [reg, setReg] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportDesc, setReportDesc] = useState('');

  async function handleCheck() {
    if (!reg.trim()) { showToast?.('Enter a vehicle registration', 'error'); return; }
    setLoading(true);
    setResult(null);
    const { data, error } = await checkVehiclePermit(reg.trim().toUpperCase());
    if (error) showToast?.(error, 'error');
    setResult(data || { notFound: true });
    setLoading(false);
  }

  async function handleReport() {
    if (!reportDesc.trim()) { showToast?.('Describe the issue', 'error'); return; }
    const { error } = await reportUnsafeTransport({ vehicle_reg: reg, description: reportDesc });
    if (error) showToast?.(error, 'error');
    else { showToast?.('Report submitted', 'success'); setShowReport(false); setReportDesc(''); }
  }

  const statusColor = (s) => s === 'valid' ? 'text-safety-700 bg-safety-100' : s === 'expired' ? 'text-danger-700 bg-danger-100' : 'text-gray-500 bg-gray-100';
  const statusLabel = (s) => s === 'valid' ? '✓ Valid' : s === 'expired' ? '✗ Expired' : '? Unknown';

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-bold text-sm mb-2">Vehicle Registration Lookup</h3>
        <p className="text-xs text-gray-500 mb-3">Check permit, roadworthiness, and driver PrDP status</p>
        <div className="flex gap-2">
          <input type="text" value={reg} onChange={e => setReg(e.target.value.toUpperCase())} placeholder="e.g. NW 123 GP" className="input flex-1" onKeyDown={e => e.key === 'Enter' && handleCheck()} />
          <button onClick={handleCheck} disabled={loading} className="btn-primary text-sm px-4">{loading ? '...' : 'Check'}</button>
        </div>
      </div>

      {result && (
        <div className="card">
          {result.notFound ? (
            <div className="text-center py-4">
              <span className="text-3xl block mb-2">❓</span>
              <p className="text-sm font-medium text-gray-700">Vehicle Not Found</p>
              <p className="text-xs text-gray-400 mt-1">No permit records found for {reg}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-bold text-sm">{result.vehicle_registration}</h4>
              <div className="space-y-2">
                {[
                  { label: 'Permit Status', value: result.permit_status },
                  { label: 'Roadworthiness', value: result.roadworthy_status },
                  { label: 'Driver PrDP', value: result.driver_prdp_status },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className={`badge text-xs ${statusColor(item.value)}`}>{statusLabel(item.value)}</span>
                  </div>
                ))}
              </div>
              {result.last_checked_date && (
                <p className="text-xs text-gray-400">Last checked: {new Date(result.last_checked_date).toLocaleDateString('en-ZA')}</p>
              )}
              {(result.permit_status === 'expired' || result.roadworthy_status === 'expired' || result.driver_prdp_status === 'expired') && (
                <div className="p-2 bg-danger-50 rounded-lg border border-danger-200">
                  <p className="text-xs text-danger-700 font-medium">⚠ This vehicle has expired credentials and may not be legal to operate as scholar transport.</p>
                </div>
              )}
            </div>
          )}
          <button onClick={() => setShowReport(true)} className="btn-outline text-xs w-full mt-3">Report Unsafe Vehicle</button>
        </div>
      )}

      {showReport && (
        <div className="card border-danger-200">
          <h4 className="font-bold text-sm text-danger-700 mb-2">Report Unsafe Transport</h4>
          <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Describe the safety concern..." className="input min-h-[80px] resize-none mb-2" />
          <div className="flex gap-2">
            <button onClick={() => setShowReport(false)} className="btn-outline text-xs flex-1">Cancel</button>
            <button onClick={handleReport} className="btn-danger text-xs flex-1">Submit Report</button>
          </div>
        </div>
      )}
    </div>
  );
}
