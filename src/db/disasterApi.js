import { supabase } from './supabase';

export async function getWeatherWarnings() {
  const { data, error } = await supabase.from('weather_warnings').select('*').gte('expiry_time', new Date().toISOString()).order('severity', { ascending: false });
  return { data: data || [], error: error?.message };
}

export async function getWarningHistory() {
  const thirtyDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString();
  const { data, error } = await supabase.from('weather_warnings').select('*').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false });
  return { data: data || [], error: error?.message };
}

export async function submitDisasterReport(report) {
  const { data, error } = await supabase.from('disaster_reports').insert({
    disaster_type: report.disaster_type,
    latitude: report.latitude,
    longitude: report.longitude,
    description: report.description,
    photos: report.photos || [],
    urgency_level: report.urgency_level || 'damage_only',
    needs_evacuation: report.needs_evacuation || false,
    user_token: report.user_token,
  }).select().single();
  return { data, error: error?.message };
}

export async function getDisasterReports(filters = {}) {
  let query = supabase.from('disaster_reports').select('*').order('created_at', { ascending: false });
  if (filters.type) query = query.eq('disaster_type', filters.type);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function updateSafetyStatus(userId, disasterId, status, lat, lng) {
  const { data, error } = await supabase.from('user_safety_status').upsert({ user_token: userId, disaster_id: disasterId, status, latitude: lat, longitude: lng }).select().single();
  return { data, error: error?.message };
}

export async function getSafetyStatuses(disasterId) {
  const { data, error } = await supabase.from('user_safety_status').select('*').eq('disaster_id', disasterId);
  return { data: data || [], error: error?.message };
}

export async function registerVolunteer(volunteer) {
  const { data, error } = await supabase.from('volunteers').insert(volunteer).select().single();
  return { data, error: error?.message };
}

export async function getVolunteers(availableOnly = false) {
  let query = supabase.from('volunteers').select('*');
  if (availableOnly) query = query.eq('is_available', true);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function deployVolunteer(disasterId, volunteerId, area) {
  const { data, error } = await supabase.from('volunteer_deployments').insert({ disaster_id: disasterId, volunteer_id: volunteerId, assigned_area: area }).select().single();
  return { data, error: error?.message };
}

export async function getResilienceResources(category) {
  let query = supabase.from('resilience_resources').select('*');
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function submitFirebreakReport(report) {
  const { data, error } = await supabase.from('firebreak_reports').insert(report).select().single();
  return { data, error: error?.message };
}

export async function getMunicipalAlerts() {
  const { data, error } = await supabase.from('municipal_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false });
  return { data: data || [], error: error?.message };
}
