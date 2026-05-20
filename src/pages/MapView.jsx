import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCivicReports, getSafetyIncidents } from '../db/mockApi';
import { getMahikengCenter, getMahikengBounds, fuzzLocation } from '../utils/geolocation';
import { CATEGORIES, INCIDENT_TYPES, STATUSES, timeAgo } from '../utils/helpers';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
function createIcon(color, size = 24) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const CATEGORY_COLORS = {
  pothole: '#f97316',
  water_leak: '#3b82f6',
  sewage: '#ef4444',
  streetlight: '#eab308',
  electricity: '#a855f7',
  illegal_dumping: '#6b7280',
  housing: '#6366f1',
  other: '#9ca3af',
};

const INCIDENT_COLORS = {
  suspicious_activity: '#f59e0b',
  theft: '#ef4444',
  vandalism: '#f97316',
  assault: '#dc2626',
  break_in: '#ef4444',
  car_theft: '#f97316',
  drug_activity: '#a855f7',
  noise: '#6b7280',
  other: '#9ca3af',
};

function MapEvents({ onBoundsChange }) {
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    };
    map.on('moveend', handler);
    return () => map.off('moveend', handler);
  }, [map, onBoundsChange]);

  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightIncident = searchParams.get('incident');

  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('all'); // 'all', 'reports', 'incidents', 'heatmap'
  const [selectedItem, setSelectedItem] = useState(null);
  const mapRef = useRef(null);

  const center = getMahikengCenter();
  const bounds = getMahikengBounds();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reportsRes, incidentsRes] = await Promise.all([
        getCivicReports(),
        getSafetyIncidents(),
      ]);
      setReports(reportsRes.data || []);
      setIncidents(incidentsRes.data || []);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Generate heatmap data from incidents
  function getHeatmapCircles() {
    const circles = [];
    const gridSize = 0.005; // ~500m grid
    const counts = {};

    incidents.forEach(inc => {
      const key = `${Math.round(inc.latitude / gridSize) * gridSize},${Math.round(inc.longitude / gridSize) * gridSize}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    Object.entries(counts).forEach(([key, count]) => {
      const [lat, lng] = key.split(',').map(Number);
      const radius = Math.min(count * 200, 1000);
      const opacity = Math.min(count * 0.1, 0.5);

      circles.push({ lat, lng, radius, opacity, count });
    });

    return circles;
  }

  return (
    <div className="pb-safe relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-[1000]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Crime & Issues Map</h1>
          <button
            onClick={() => navigate('/safety')}
            className="btn-danger text-sm py-1.5 px-3"
          >
            + Report
          </button>
        </div>

        {/* Layer toggles */}
        <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'All', icon: '📍' },
            { key: 'reports', label: 'Infrastructure', icon: '🏗️' },
            { key: 'incidents', label: 'Safety', icon: '🛡️' },
            { key: 'heatmap', label: 'Hotspots', icon: '🔥' },
          ].map(layer => (
            <button
              key={layer.key}
              onClick={() => setActiveLayer(layer.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                activeLayer === layer.key
                  ? 'bg-civic-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {layer.icon} {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: 'calc(100vh - 160px)' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-civic-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={14}
            className="w-full h-full"
            zoomControl={true}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapEvents onBoundsChange={() => {}} />

            {/* Civic Reports Markers */}
            {(activeLayer === 'all' || activeLayer === 'reports') &&
              reports.map(report => {
                const cat = CATEGORIES[report.category] || CATEGORIES.other;
                const status = STATUSES[report.status] || STATUSES.pending;
                const color = CATEGORY_COLORS[report.category] || '#9ca3af';

                return (
                  <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={createIcon(color)}
                    eventHandlers={{
                      click: () => setSelectedItem({ type: 'report', data: report }),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{cat.icon}</span>
                          <span className="font-semibold text-sm">{cat.label}</span>
                        </div>
                        <h3 className="font-medium text-sm mb-1">{report.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{report.address}</p>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-400">{timeAgo(report.created_at)}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Safety Incidents Markers */}
            {(activeLayer === 'all' || activeLayer === 'incidents') &&
              incidents.map(incident => {
                const typeInfo = INCIDENT_TYPES[incident.incident_type] || INCIDENT_TYPES.other;
                const color = INCIDENT_COLORS[incident.incident_type] || '#9ca3af';
                const fuzzed = fuzzLocation(incident.latitude, incident.longitude);

                return (
                  <Marker
                    key={incident.id}
                    position={[fuzzed.lat, fuzzed.lng]}
                    icon={createIcon(color, incident.is_verified ? 28 : 22)}
                    eventHandlers={{
                      click: () => setSelectedItem({ type: 'incident', data: incident }),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{typeInfo.icon}</span>
                          <span className="font-semibold text-sm">{typeInfo.label}</span>
                          {incident.is_verified && (
                            <span className="badge bg-safety-100 text-safety-700 text-xs">Verified</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{incident.description.substring(0, 100)}...</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{incident.confirmations} confirmations</span>
                          <span className="text-xs text-gray-400">{timeAgo(incident.created_at)}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Heatmap Circles */}
            {activeLayer === 'heatmap' &&
              getHeatmapCircles().map((circle, i) => (
                <Circle
                  key={i}
                  center={[circle.lat, circle.lng]}
                  radius={circle.radius}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: circle.opacity,
                    weight: 0,
                  }}
                >
                  <Popup>
                    <p className="text-sm font-medium">{circle.count} incidents in this area</p>
                  </Popup>
                </Circle>
              ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-3 max-w-[200px]">
          <p className="text-xs font-bold text-gray-700 mb-2">LEGEND</p>
          <div className="space-y-1.5">
            {activeLayer === 'heatmap' ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500 opacity-50"></div>
                <span className="text-xs text-gray-600">Incident hotspot</span>
              </div>
            ) : (
              <>
                {Object.entries(CATEGORY_COLORS).slice(0, 4).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }}></div>
                    <span className="text-xs text-gray-600">{CATEGORIES[key]?.label || key}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                  <span className="text-xs text-gray-600">Safety incident</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
