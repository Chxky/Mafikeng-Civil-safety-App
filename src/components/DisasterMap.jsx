import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
// eslint-disable-next-line no-unused-vars
import { getDisasterReports, getSafetyStatuses } from '../db/disasterApi';
// eslint-disable-next-line no-unused-vars
import { getMahikengCenter, fuzzLocation } from '../utils/geolocation';
import { timeAgo } from '../utils/helpers';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/marker-shadow.png', import.meta.url).href,
});

const DISASTER_COLORS = {
  flood: '#3b82f6',
  veld_fire: '#ef4444',
  storm_damage: '#f97316',
  structural_collapse: '#8b5cf6',
  other: '#6b7280',
};

const DISASTER_ICONS = {
  flood: '🌊', veld_fire: '🔥', storm_damage: '🌪️', structural_collapse: '🏚️', other: '⚠️',
};

function createDisasterIcon(type) {
  const emoji = DISASTER_ICONS[type] || '⚠️';
  return L.divIcon({
    className: 'disaster-marker',
    html: `<div style="width:28px;height:28px;background:${DISASTER_COLORS[type] || '#6b7280'};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function DisasterMap({ height = '400px' }) {
  const center = getMahikengCenter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDisasterReports().then(({ data }) => {
      setReports(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      {loading && <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80"><div className="w-6 h-6 border-2 border-danger-500 border-t-transparent rounded-full animate-spin"></div></div>}
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height, width: '100%' }} className="rounded-2xl">
        <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {reports.map(report => {
          const color = DISASTER_COLORS[report.disaster_type] || '#6b7280';
          return (
            <div key={report.id}>
              <Marker position={[report.latitude, report.longitude]} icon={createDisasterIcon(report.disaster_type)}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-sm">{DISASTER_ICONS[report.disaster_type]} {report.disaster_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge text-xs ${report.urgency_level === 'immediate_threat' ? 'bg-danger-100 text-danger-700' : 'bg-gray-100 text-gray-600'}`}>
                        {report.urgency_level === 'immediate_threat' ? '🚨 Immediate' : '📋 ' + report.urgency_level.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(report.created_at)}</span>
                    </div>
                    {report.needs_evacuation && <p className="text-xs text-danger-600 font-medium mt-1">⚠ Evacuation needed</p>}
                  </div>
                </Popup>
              </Marker>
              <Circle center={[report.latitude, report.longitude]} radius={200} pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 1 }} />
            </div>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 rounded-xl px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-gray-600 mb-1">Disaster Type</p>
        {Object.entries(DISASTER_COLORS).slice(0, 4).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }}></div>
            <span className="text-xs text-gray-600">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
