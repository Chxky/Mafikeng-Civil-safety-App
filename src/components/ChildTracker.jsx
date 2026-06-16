import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getLearners, getActiveTrips, getTransportRoutes, registerLearner } from '../db/transportApi';
import { getMahikengCenter } from '../utils/geolocation';
import { showToast, timeAgo } from '../utils/helpers';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/marker-shadow.png', import.meta.url).href,
});

const vehicleIcon = L.divIcon({
  className: 'vehicle-marker',
  html: '<div style="width:32px;height:32px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px">🚌</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function ChildTracker({ userId }) {
  const center = getMahikengCenter();
  const [learners, setLearners] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', school: '', grade: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [learnersRes, routesRes, tripsRes] = await Promise.all([
      getLearners(userId),
      getTransportRoutes(),
      getActiveTrips(),
    ]);
    setLearners(learnersRes.data || []);
    setRoutes(routesRes.data || []);
    setActiveTrips(tripsRes.data || []);
    setLoading(false);
  }

  async function handleAddChild() {
    if (!newChild.name || !newChild.school) { showToast?.('Name and school required', 'error'); return; }
    const { error } = await registerLearner({ ...newChild, parent_user_token: userId });
    if (error) showToast?.(error, 'error');
    else { showToast?.('Child registered', 'success'); setShowAdd(false); setNewChild({ name: '', school: '', grade: '' }); loadData(); }
  }

  function getTripForRoute(routeId) {
    return activeTrips.find(t => t.route_id === routeId);
  }

  if (loading) return <div className="card animate-pulse"><div className="h-32 bg-gray-200 rounded-lg"></div></div>;

  return (
    <div className="space-y-4">
      {learners.length === 0 ? (
        <div className="card text-center py-8">
          <span className="text-4xl block mb-3">👨‍👩‍👧‍👦</span>
          <p className="text-sm text-gray-600 mb-3">Register your child to track their school transport</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">Add Child</button>
        </div>
      ) : (
        <>
          {learners.map(child => {
            const route = routes.find(r => r.id === child.route_id);
            const trip = route ? getTripForRoute(route.id) : null;
            return (
              <div key={child.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{child.name}</p>
                    <p className="text-xs text-gray-400">{child.school} — Grade {child.grade}</p>
                  </div>
                  <span className={`badge text-xs ${trip ? (trip.status === 'delayed' ? 'bg-warning-100 text-warning-700' : 'bg-safety-100 text-safety-700') : 'bg-gray-100 text-gray-500'}`}>
                    {trip ? (trip.status === 'delayed' ? '⏰ Delayed' : '🚌 On Route') : 'No active trip'}
                  </span>
                </div>
                {route && <p className="text-xs text-gray-400 mb-2">Route: {route.name} — {route.vehicle_registration}</p>}
                {trip && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">Trip started {timeAgo(trip.started_at)}</p>
                    {trip.locations?.length > 0 && (
                      <p className="text-xs text-blue-500 mt-1">Last update: {timeAgo(new Date(trip.locations[trip.locations.length - 1].t).toISOString())}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => setShowAdd(true)} className="btn-outline text-sm w-full">+ Add Another Child</button>
        </>
      )}

      {/* Live Map */}
      {activeTrips.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-600">Live Vehicle Positions</p>
          </div>
          <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '200px', width: '100%' }}>
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {activeTrips.map(trip => {
              const loc = trip.locations?.[trip.locations.length - 1];
              if (!loc) return null;
              return (
                <Marker key={trip.id} position={[loc.lat, loc.lng]} icon={vehicleIcon}>
                  <Popup>
                    <p className="text-sm font-medium">🚌 Trip Active</p>
                    <p className="text-xs text-gray-500">Started {timeAgo(trip.started_at)}</p>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Add Child Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-4 animate-slide-up">
            <h3 className="font-bold text-lg mb-3">Register Child</h3>
            <div className="space-y-3">
              <input type="text" value={newChild.name} onChange={e => setNewChild(p => ({ ...p, name: e.target.value }))} placeholder="Child's name" className="input" />
              <input type="text" value={newChild.school} onChange={e => setNewChild(p => ({ ...p, school: e.target.value }))} placeholder="School name" className="input" />
              <input type="text" value={newChild.grade} onChange={e => setNewChild(p => ({ ...p, grade: e.target.value }))} placeholder="Grade" className="input" />
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="btn-outline flex-1">Cancel</button>
                <button onClick={handleAddChild} className="btn-primary flex-1">Register</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
