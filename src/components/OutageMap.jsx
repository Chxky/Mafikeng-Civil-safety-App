import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getMahikengCenter, fuzzLocation } from '../utils/geolocation';
import { getCivicReports } from '../db/api';
import { confirmOutage, getOutageConfirmations } from '../db/powerApi';
import { useAuth } from '../hooks/useAuth';
import { timeAgo, showToast } from '../utils/helpers';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/marker-shadow.png', import.meta.url).href,
});

const OUTAGE_COLORS = {
  scheduled: '#f97316',   // orange
  unscheduled: '#ef4444', // red
  unknown: '#eab308',     // yellow
};

function createOutageIcon(color, size = 24) {
  return L.divIcon({
    className: 'custom-outage-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: ${size * 0.5}px;
    ">⚡</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapEvents({ onBoundsChange }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onBoundsChange(map.getBounds());
    map.on('moveend', handler);
    return () => map.off('moveend', handler);
  }, [map, onBoundsChange]);
  return null;
}

export default function OutageMap({ standalone = false }) {
  const { user } = useAuth();
  const center = getMahikengCenter();

  const [reports, setReports] = useState([]);
  const [confirmations, setConfirmations] = useState({});
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadOutages();
  }, []);

  async function loadOutages() {
    setLoading(true);
    const { data } = await getCivicReports({ category: 'electricity' });
    setReports(data || []);

    // Load confirmation counts
    const counts = {};
    for (const report of (data || [])) {
      const { count } = await getOutageConfirmations(report.id);
      counts[report.id] = count;
    }
    setConfirmations(counts);
    setLoading(false);
  }

  async function handleConfirm(reportId) {
    if (!user?.id) {
      showToast?.('Please sign in to confirm', 'error');
      return;
    }
    const { error } = await confirmOutage(reportId, user.id);
    if (error) {
      showToast?.(error, 'error');
    } else {
      showToast?.('Confirmed! You are also affected.', 'success');
      setConfirmations(prev => ({ ...prev, [reportId]: (prev[reportId] || 0) + 1 }));
    }
  }

  // Aggregate reports into ~100m grid cells for public map
  const aggregatedReports = [];
  const grid = {};
  reports.forEach(r => {
    const fuzzed = fuzzLocation(r.latitude, r.longitude, 3); // ~111m grid
    const key = `${fuzzed.lat},${fuzzed.lng}`;
    if (!grid[key]) {
      grid[key] = { ...fuzzed, reports: [], outageType: r.outage_type || 'unknown' };
    }
    grid[key].reports.push(r);
    // Prioritize unscheduled > scheduled > unknown
    if (r.outage_type === 'unscheduled') grid[key].outageType = 'unscheduled';
    else if (r.outage_type === 'scheduled' && grid[key].outageType !== 'unscheduled') {
      grid[key].outageType = 'scheduled';
    }
  });
  Object.values(grid).forEach(cell => {
    aggregatedReports.push(cell);
  });

  const mapHeight = standalone ? 'calc(100vh - 160px)' : '400px';

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80">
          <div className="w-6 h-6 border-2 border-civic-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: mapHeight, width: '100%' }}
        className="rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onBoundsChange={() => {}} />

        {aggregatedReports.map((cell, i) => (
          <div key={i}>
            <Marker
              position={[cell.lat, cell.lng]}
              icon={createOutageIcon(OUTAGE_COLORS[cell.outageType] || OUTAGE_COLORS.unknown, 28)}
              eventHandlers={{
                click: () => setSelectedReport(cell),
              }}
            >
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-bold capitalize">{cell.outageType} Outage</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {cell.reports.length} report{cell.reports.length !== 1 ? 's' : ''} in this area
                  </p>
                  {cell.reports.slice(0, 2).map(r => (
                    <div key={r.id} className="text-xs text-gray-600 mb-1">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-gray-400">{timeAgo(r.created_at)}</p>
                    </div>
                  ))}
                  {cell.reports.length > 2 && (
                    <p className="text-xs text-gray-400">+{cell.reports.length - 2} more</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirm(cell.reports[0].id);
                    }}
                    className="mt-2 w-full bg-civic-600 text-white text-xs py-1.5 px-3 rounded-lg font-medium"
                  >                    ⚡ I&apos;m also affected ({confirmations[cell.reports[0]?.id] || 0})
                  </button>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[cell.lat, cell.lng]}
              radius={100}
              pathOptions={{
                color: OUTAGE_COLORS[cell.outageType] || OUTAGE_COLORS.unknown,
                fillColor: OUTAGE_COLORS[cell.outageType] || OUTAGE_COLORS.unknown,
                fillOpacity: 0.15,
                weight: 1,
              }}
            />
          </div>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 rounded-xl px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-gray-600 mb-1">Outage Type</p>
        <div className="space-y-1">
          {[
            { key: 'unscheduled', label: 'Fault', color: OUTAGE_COLORS.unscheduled },
            { key: 'scheduled', label: 'Load Shedding', color: OUTAGE_COLORS.scheduled },
            { key: 'unknown', label: 'Unknown', color: OUTAGE_COLORS.unknown },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 rounded-xl px-3 py-2 shadow-sm">
        <p className="text-lg font-bold text-gray-800">{reports.length}</p>
        <p className="text-xs text-gray-500">Active outages</p>
      </div>
    </div>
  );
}
