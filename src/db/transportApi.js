import { supabase } from './supabase';

export async function registerLearner(learner) {
  const { data, error } = await supabase.from('learners').insert(learner).select().single();
  return { data, error: error?.message };
}

export async function getLearners(parentToken) {
  const { data, error } = await supabase.from('learners').select('*, transport_routes(*)').eq('parent_user_token', parentToken);
  return { data: data || [], error: error?.message };
}

export async function getTransportRoutes() {
  const { data, error } = await supabase.from('transport_routes').select('*').eq('is_active', true);
  return { data: data || [], error: error?.message };
}

export async function startTrip(routeId, driverToken) {
  const { data, error } = await supabase.from('trip_sessions').insert({ route_id: routeId, driver_user_token: driverToken, status: 'in_progress' }).select().single();
  return { data, error: error?.message };
}

export async function updateTripStatus(tripId, status, location) {
  const updates = { status };
  if (status === 'arrived' || status === 'cancelled') updates.completed_at = new Date().toISOString();
  const { data, error } = await supabase.from('trip_sessions').update(updates).eq('id', tripId).select().single();
  return { data, error: error?.message };
}

export async function getActiveTrips(routeId) {
  let query = supabase.from('trip_sessions').select('*').in('status', ['in_progress', 'delayed']);
  if (routeId) query = query.eq('route_id', routeId);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function getTripHistory(routeId) {
  const { data, error } = await supabase.from('trip_sessions').select('*').eq('route_id', routeId).order('started_at', { ascending: false }).limit(30);
  return { data: data || [], error: error?.message };
}

export async function checkVehiclePermit(registration) {
  const { data, error } = await supabase.from('vehicle_permits').select('*').eq('vehicle_registration', registration.toUpperCase()).single();
  return { data: data || null, error: error?.message };
}

export async function reportUnsafeTransport(report) {
  const { data, error } = await supabase.from('civic_reports').insert({
    category: 'other',
    department: 'community',
    title: `Unsafe transport: ${report.vehicle_reg || 'Unknown'}`,
    description: report.description,
    latitude: report.latitude || -25.8653,
    longitude: report.longitude || 25.6441,
    address: report.address || 'Mahikeng',
    urgency: 'high',
  }).select().single();
  return { data, error: error?.message };
}

export async function reportStranded(routeId, parentToken) {
  const { data, error } = await supabase.from('stranded_reports').insert({ route_id: routeId, parent_user_token: parentToken }).select().single();
  return { data, error: error?.message };
}

export async function getStrandedReports() {
  const { data, error } = await supabase.from('stranded_reports').select('*').is('resolved_at', null).order('reported_at', { ascending: false });
  return { data: data || [], error: error?.message };
}
