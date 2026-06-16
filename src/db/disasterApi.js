// Disaster Shield API — early warning, damage reports, volunteers
// Dual-mode: Supabase when live, in-memory when mock

import { supabase, isLive } from './supabase';
import { uuid, delay } from '../utils/helpers';

// In-memory stores
let weatherWarnings = [];
let disasterReports = [];
let userSafetyStatuses = [];
let volunteers = [];
let volunteerDeployments = [];
let resilienceResources = [];
let firebreakReports = [];
let municipalAlerts = [];

// ============================================================
// WEATHER WARNINGS
// ============================================================
export async function getWeatherWarnings() {
  if (isLive) {
    const { data, error } = await supabase
      .from('weather_warnings')
      .select('*')
      .gte('expiry_time', new Date().toISOString())
      .order('severity', { ascending: false });
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  const now = new Date();
  return { data: weatherWarnings.filter(w => new Date(w.expiry_time) > now), error: null };
}

export async function getWarningHistory() {
  if (isLive) {
    const thirtyDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString();
    const { data, error } = await supabase
      .from('weather_warnings')
      .select('*')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  return { data: weatherWarnings, error: null };
}

// ============================================================
// DISASTER REPORTS
// ============================================================
export async function submitDisasterReport(report) {
  if (isLive) {
    const { data, error } = await supabase
      .from('disaster_reports')
      .insert({
        disaster_type: report.disaster_type,
        latitude: report.latitude,
        longitude: report.longitude,
        description: report.description,
        photos: report.photos || [],
        urgency_level: report.urgency_level || 'damage_only',
        needs_evacuation: report.needs_evacuation || false,
        user_token: report.user_token,
      })
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(400);
  const newReport = { id: uuid(), ...report, status: 'active', photos: report.photos || [], created_at: new Date().toISOString() };
  disasterReports.push(newReport);
  return { data: newReport, error: null };
}

export async function getDisasterReports(filters = {}) {
  if (isLive) {
    let query = supabase.from('disaster_reports').select('*').order('created_at', { ascending: false });
    if (filters.type) query = query.eq('disaster_type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = [...disasterReports];
  if (filters.type) result = result.filter(r => r.disaster_type === filters.type);
  if (filters.status) result = result.filter(r => r.status === filters.status);
  return { data: result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
}

// ============================================================
// SAFETY STATUS
// ============================================================
export async function updateSafetyStatus(userId, disasterId, status, lat, lng) {
  if (isLive) {
    const { data, error } = await supabase
      .from('user_safety_status')
      .upsert({ user_token: userId, disaster_id: disasterId, status, latitude: lat, longitude: lng })
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(200);
  const idx = userSafetyStatuses.findIndex(s => s.user_token === userId && s.disaster_id === disasterId);
  const entry = { id: uuid(), user_token: userId, disaster_id: disasterId, status, latitude: lat, longitude: lng, updated_at: new Date().toISOString() };
  if (idx >= 0) userSafetyStatuses[idx] = entry; else userSafetyStatuses.push(entry);
  return { data: entry, error: null };
}

export async function getSafetyStatuses(disasterId) {
  if (isLive) {
    const { data, error } = await supabase.from('user_safety_status').select('*').eq('disaster_id', disasterId);
    return { data: data || [], error: error?.message };
  }
  await delay(100);
  return { data: userSafetyStatuses.filter(s => s.disaster_id === disasterId), error: null };
}

// ============================================================
// VOLUNTEERS
// ============================================================
export async function registerVolunteer(volunteer) {
  if (isLive) {
    const { data, error } = await supabase.from('volunteers').insert(volunteer).select().single();
    return { data, error: error?.message };
  }
  await delay(300);
  const newVol = { id: uuid(), ...volunteer, is_available: true, created_at: new Date().toISOString() };
  volunteers.push(newVol);
  return { data: newVol, error: null };
}

export async function getVolunteers(availableOnly = false) {
  if (isLive) {
    let query = supabase.from('volunteers').select('*');
    if (availableOnly) query = query.eq('is_available', true);
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = [...volunteers];
  if (availableOnly) result = result.filter(v => v.is_available);
  return { data: result, error: null };
}

export async function deployVolunteer(disasterId, volunteerId, area) {
  if (isLive) {
    const { data, error } = await supabase
      .from('volunteer_deployments')
      .insert({ disaster_id: disasterId, volunteer_id: volunteerId, assigned_area: area })
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(200);
  const deployment = { id: uuid(), disaster_id: disasterId, volunteer_id: volunteerId, assigned_area: area, status: 'deployed', deployed_at: new Date().toISOString() };
  volunteerDeployments.push(deployment);
  return { data: deployment, error: null };
}

// ============================================================
// RESILIENCE RESOURCES
// ============================================================
export async function getResilienceResources(category) {
  if (isLive) {
    let query = supabase.from('resilience_resources').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = [...resilienceResources];
  if (category) result = result.filter(r => r.category === category);
  return { data: result, error: null };
}

// ============================================================
// FIREBREAK REPORTS
// ============================================================
export async function submitFirebreakReport(report) {
  if (isLive) {
    const { data, error } = await supabase.from('firebreak_reports').insert(report).select().single();
    return { data, error: error?.message };
  }
  await delay(300);
  const newReport = { id: uuid(), ...report, reported_at: new Date().toISOString() };
  firebreakReports.push(newReport);
  return { data: newReport, error: null };
}

// ============================================================
// MUNICIPAL ALERTS
// ============================================================
export async function getMunicipalAlerts() {
  if (isLive) {
    const { data, error } = await supabase.from('municipal_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false });
    return { data: data || [], error: error?.message };
  }
  await delay(100);
  return { data: municipalAlerts.filter(a => a.is_active), error: null };
}

// ============================================================
// SEED DATA
// ============================================================
export function seedDisasterData() {
  const now = Date.now();
  weatherWarnings = [
    { id: uuid(), event_type: 'severe_thunderstorm', severity: 'warning', description: 'Severe thunderstorms expected with heavy rainfall, damaging winds, and possible hail. Localized flooding of low-lying areas likely.', start_time: new Date(now + 3600000).toISOString(), expiry_time: new Date(now + 14 * 3600000).toISOString(), affected_areas: 'Mahikeng, Lichtenburg, Delareyville', recommended_actions: 'Avoid low-lying bridges. Secure loose outdoor items. Keep emergency numbers handy.', source: 'SAWS', created_at: new Date().toISOString() },
    { id: uuid(), event_type: 'fire_danger', severity: 'watch', description: 'Very hot and dry conditions with temperatures exceeding 38°C and low humidity. High fire danger conditions expected.', start_time: new Date(now + 86400000).toISOString(), expiry_time: new Date(now + 86400000 + 12 * 3600000).toISOString(), affected_areas: 'North West Province - western districts', recommended_actions: 'Do not make fires in open areas. Report any smoke immediately. Keep fire extinguishers accessible.', source: 'SAWS', created_at: new Date().toISOString() },
  ];

  disasterReports = [
    { id: uuid(), disaster_type: 'flood', latitude: -25.868, longitude: 25.640, description: 'Flash flooding on Station Road — water 30cm deep, road impassable', urgency_level: 'immediate_threat', needs_evacuation: false, user_token: uuid(), status: 'active', photos: [], created_at: new Date(now - 7200000).toISOString() },
    { id: uuid(), disaster_type: 'veld_fire', latitude: -25.855, longitude: 25.655, description: 'Large veld fire approaching residential area near Montshiwa', urgency_level: 'immediate_threat', needs_evacuation: true, user_token: uuid(), status: 'active', photos: [], created_at: new Date(now - 3600000).toISOString() },
    { id: uuid(), disaster_type: 'storm_damage', latitude: -25.870, longitude: 25.635, description: 'Roof blown off house in Riviera Park. Family displaced.', urgency_level: 'damage_only', needs_evacuation: false, user_token: uuid(), status: 'active', photos: [], created_at: new Date(now - 1800000).toISOString() },
    { id: uuid(), disaster_type: 'flood', latitude: -25.862, longitude: 25.650, description: 'Low-lying bridge flooded on Mafikeng Road — vehicles stranded', urgency_level: 'immediate_threat', needs_evacuation: false, user_token: uuid(), status: 'assessed', photos: [], created_at: new Date(now - 14400000).toISOString() },
    { id: uuid(), disaster_type: 'structural_collapse', latitude: -25.875, longitude: 25.630, description: 'Boundary wall collapsed onto parked cars after heavy rain', urgency_level: 'damage_only', needs_evacuation: false, user_token: uuid(), status: 'active', photos: [], created_at: new Date(now - 900000).toISOString() },
  ];

  volunteers = [
    { id: uuid(), user_token: uuid(), skills: ['first_aid', 'logistics'], location: 'CBD', is_available: true, contact_preference: 'push', created_at: new Date(now - 30 * 86400000).toISOString() },
    { id: uuid(), user_token: uuid(), skills: ['firefighting', 'evacuation'], location: 'Montshiwa', is_available: true, contact_preference: 'sms', created_at: new Date(now - 15 * 86400000).toISOString() },
    { id: uuid(), user_token: uuid(), skills: ['shelter_management', 'counselling'], location: 'Riviera Park', is_available: false, contact_preference: 'push', created_at: new Date(now - 7 * 86400000).toISOString() },
    { id: uuid(), user_token: uuid(), skills: ['first_aid', 'counselling'], location: 'Mmabatho', is_available: true, contact_preference: 'push', created_at: new Date(now - 3 * 86400000).toISOString() },
    { id: uuid(), user_token: uuid(), skills: ['logistics', 'shelter_management'], location: 'CBD', is_available: true, contact_preference: 'phone', created_at: new Date(now - 86400000).toISOString() },
  ];

  resilienceResources = [
    { id: uuid(), title: 'Flood Safety Guide', category: 'flood_safety', description: 'What to do before, during, and after a flood. Includes evacuation routes and emergency contacts.', is_offline_available: true, created_at: new Date().toISOString() },
    { id: uuid(), title: 'Firebreak Construction', category: 'fire_safety', description: 'How to build and maintain a firebreak around your property. Legal requirements under the Veld and Forest Fire Act.', is_offline_available: true, created_at: new Date().toISOString() },
    { id: uuid(), title: 'Evacuation Planning', category: 'evacuation', description: 'Create a family evacuation plan. Know your routes, meeting points, and what to pack.', is_offline_available: true, created_at: new Date().toISOString() },
    { id: uuid(), title: 'First Aid Basics', category: 'first_aid', description: 'Essential first aid skills: CPR, wound care, burns, and shock treatment.', is_offline_available: true, created_at: new Date().toISOString() },
    { id: uuid(), title: 'Emergency Kit Checklist', category: 'emergency_kit', description: 'Items to include in your 72-hour emergency kit: water, food, medications, documents, torch, radio.', is_offline_available: true, created_at: new Date().toISOString() },
    { id: uuid(), title: 'Storm Damage Response', category: 'other', description: 'Steps to take after storm damage: safety assessment, documentation for insurance, temporary repairs.', is_offline_available: false, created_at: new Date().toISOString() },
    { id: uuid(), title: 'Heat Wave Survival', category: 'other', description: 'Protecting yourself during extreme heat: hydration, shade, recognizing heat stroke.', is_offline_available: true, created_at: new Date().toISOString() },
    { id: uuid(), title: 'Community Response Coordination', category: 'other', description: 'How to organize community disaster response: communication chains, resource sharing, volunteer management.', is_offline_available: false, created_at: new Date().toISOString() },
  ];

  municipalAlerts = [
    { id: uuid(), alert_type: 'disaster', title: 'Flash Flood Warning', message: 'SAWS has issued a warning for severe thunderstorms. Avoid low-lying areas and bridges.', severity: 'warning', is_active: true, issued_by: 'Disaster Management Unit', created_at: new Date(now - 3600000).toISOString() },
  ];
}

seedDisasterData();
