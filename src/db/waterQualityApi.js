import { supabase, isLive } from './supabase';
import { uuid, delay } from '../utils/helpers';

let monitoringPoints = [];
let qualityReadings = [];
let waterIssues = [];

export async function getMonitoringPoints() {
  if (isLive) {
    const { data, error } = await supabase.from('water_monitoring_points').select('*').eq('is_active', true);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  return { data: monitoringPoints.filter(p => p.is_active), error: null };
}

export async function getWaterQualityReadings(pointId) {
  if (isLive) {
    const { data, error } = await supabase.from('water_quality_readings').select('*').eq('monitoring_point_id', pointId).order('reading_time', { ascending: false }).limit(20);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  const result = qualityReadings.filter(r => r.monitoring_point_id === pointId).sort((a, b) => new Date(b.reading_time) - new Date(a.reading_time));
  return { data: result.slice(0, 20), error: null };
}

export async function getLatestReadings() {
  if (isLive) {
    const { data, error } = await supabase.from('water_quality_readings').select('*, water_monitoring_points(*)').order('reading_time', { ascending: false });
    const latest = {};
    (data || []).forEach(r => {
      if (!latest[r.monitoring_point_id]) latest[r.monitoring_point_id] = r;
    });
    return { data: Object.values(latest), error: error?.message };
  }
  await delay(200);
  const latest = {};
  qualityReadings.forEach(r => {
    if (!latest[r.monitoring_point_id] || new Date(r.reading_time) > new Date(latest[r.monitoring_point_id].reading_time)) {
      latest[r.monitoring_point_id] = r;
    }
  });
  return { data: Object.values(latest), error: null };
}

export async function submitWaterIssue(issue) {
  if (isLive) {
    const { data, error } = await supabase.from('water_issues').insert(issue).select().single();
    return { data, error: error?.message };
  }
  await delay(300);
  const newIssue = { id: uuid(), ...issue, status: 'pending', created_at: new Date().toISOString() };
  waterIssues.push(newIssue);
  return { data: newIssue, error: null };
}

export function seedWaterData() {
  qualityReadings = [];
  waterIssues = [];
  monitoringPoints = [
    { id: uuid(), name: 'Mahikeng Water Treatment Plant', point_type: 'treatment_plant', latitude: -25.8610, longitude: 25.6390, is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Molopo River — Upstream', point_type: 'river', latitude: -25.8550, longitude: 25.6300, is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Molopo River — Downstream', point_type: 'river', latitude: -25.8750, longitude: 25.6500, is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'CBD Reservoir', point_type: 'reservoir', latitude: -25.8630, longitude: 25.6450, is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Montshiwa Community Tap', point_type: 'tap', latitude: -25.8570, longitude: 25.6540, is_active: true, created_at: new Date().toISOString() },
  ];

  const now = Date.now();
  // eslint-disable-next-line no-unused-vars
  monitoringPoints.forEach((point, i) => {
    for (let d = 0; d < 10; d++) {
      qualityReadings.push({
        id: uuid(),
        monitoring_point_id: point.id,
        ph_level: 6.5 + Math.random() * 2,
        turbidity_ntu: Math.random() * 8,
        e_coli_per_100ml: Math.floor(Math.random() * 50),
        chlorine_mg_per_l: 0.2 + Math.random() * 0.8,
        is_safe: true,
        reading_time: new Date(now - d * 86400000).toISOString(),
      });
    }
  });
}

seedWaterData();
