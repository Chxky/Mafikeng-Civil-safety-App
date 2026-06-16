import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { registerVolunteer, getVolunteers, deployVolunteer } from '../db/disasterApi';
import { showToast } from '../utils/helpers';

const SKILL_OPTIONS = [
  { key: 'first_aid', label: 'First Aid', icon: '🩺' },
  { key: 'firefighting', label: 'Firefighting', icon: '🧯' },
  { key: 'shelter_management', label: 'Shelter Mgmt', icon: '🏠' },
  { key: 'logistics', label: 'Logistics', icon: '📦' },
  { key: 'counselling', label: 'Counselling', icon: '💬' },
];

// eslint-disable-next-line no-unused-vars
export default function VolunteerCoordinator({ userId, isAdmin = false }) {
  const [volunteers, setVolunteers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ skills: [], location: '', contact_preference: 'push' });

  useEffect(() => { loadVolunteers(); }, []);

  async function loadVolunteers() {
    setLoading(true);
    const { data } = await getVolunteers();
    setVolunteers(data || []);
    setLoading(false);
  }

  async function handleRegister() {
    if (form.skills.length === 0) { showToast?.('Select at least one skill', 'error'); return; }
    const { error } = await registerVolunteer({ ...form, user_token: userId });
    if (error) showToast?.(error, 'error');
    else { showToast?.('Registered as volunteer!', 'success'); setShowRegister(false); loadVolunteers(); }
  }

  function toggleSkill(skill) {
    setForm(p => ({ ...p, skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill] }));
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Community Volunteers</h3>
          <span className="badge bg-safety-100 text-safety-700">{volunteers.filter(v => v.is_available).length} available</span>
        </div>
        {volunteers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No volunteers registered yet</p>
        ) : (
          <div className="space-y-2">
            {volunteers.slice(0, 8).map(v => (
              <div key={v.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${v.is_available ? 'bg-safety-500' : 'bg-gray-300'}`}></div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1">
                    {v.skills?.map(s => {
                      const skill = SKILL_OPTIONS.find(o => o.key === s);
                      return <span key={s} className="text-xs">{skill?.icon || '🔧'}</span>;
                    })}
                  </div>
                  <p className="text-xs text-gray-400">{v.location || 'Mahikeng'}</p>
                </div>
                <span className={`badge text-xs ${v.is_available ? 'bg-safety-100 text-safety-700' : 'bg-gray-100 text-gray-500'}`}>
                  {v.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showRegister ? (
        <button onClick={() => setShowRegister(true)} className="btn-primary w-full">Register as Volunteer</button>
      ) : (
        <div className="card">
          <h3 className="font-bold text-sm mb-3">Volunteer Registration</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Skills</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => toggleSkill(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.skills.includes(opt.key) ? 'bg-civic-50 text-civic-700 border-civic-300' : 'border-gray-200 text-gray-500'}`}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Your area (e.g. CBD, Montshiwa)" className="input" />
            <select value={form.contact_preference} onChange={e => setForm(p => ({ ...p, contact_preference: e.target.value }))} className="input">
              <option value="push">Push Notification</option>
              <option value="sms">SMS</option>
              <option value="phone">Phone Call</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowRegister(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleRegister} className="btn-primary flex-1">Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
