// EduTrans API — school transport tracking
// Dual-mode: Supabase when live, in-memory when mock

import { supabase, isLive } from './supabase';

const delay = (ms) => new Promise(r => setTimeout(r, ms));
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// In-memory stores (mock mode)
let transportRoutes = [];
let learners = [];
let tripSessions = [];
let vehiclePermits = [];
let strandedReports = [];

// ============================================================
// LEARNERS
// ============================================================
export async function registerLearner(learner) {
  if (isLive) {
    const { data, error } = await supabase
      .from('learners')
      .insert(learner)
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(400);
  const newLearner = { id: uuid(), ...learner, created_at: new Date().toISOString() };
  learners.push(newLearner);
  return { data: newLearner, error: null };
}

export async function getLearners(parentToken) {
  if (isLive) {
    const { data, error } = await supabase
      .from('learners')
      .select('*, transport_routes(*)')
      .eq('parent_user_token', parentToken);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  const result = learners.filter(l => l.parent_user_token === parentToken);
  return { data: result, error: null };
}

// ============================================================
// ROUTES
// ============================================================
export async function getTransportRoutes() {
  if (isLive) {
    const { data, error } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('is_active', true);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  return { data: transportRoutes.filter(r => r.is_active), error: null };
}

// ============================================================
// TRIP SESSIONS
// ============================================================
export async function startTrip(routeId, driverToken) {
  if (isLive) {
    const { data, error } = await supabase
      .from('trip_sessions')
      .insert({ route_id: routeId, driver_user_token: driverToken, status: 'in_progress' })
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(300);
  const trip = { id: uuid(), route_id: routeId, driver_user_token: driverToken, status: 'in_progress', started_at: new Date().toISOString(), completed_at: null, locations: [] };
  tripSessions.push(trip);
  return { data: trip, error: null };
}

export async function updateTripStatus(tripId, status, location) {
  if (isLive) {
    const updates = { status };
    if (status === 'arrived' || status === 'cancelled') updates.completed_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('trip_sessions')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(200);
  const idx = tripSessions.findIndex(t => t.id === tripId);
  if (idx === -1) return { data: null, error: 'Not found' };
  tripSessions[idx] = { ...tripSessions[idx], status };
  if (status === 'arrived' || status === 'cancelled') tripSessions[idx].completed_at = new Date().toISOString();
  return { data: tripSessions[idx], error: null };
}

export async function getActiveTrips(routeId) {
  if (isLive) {
    let query = supabase.from('trip_sessions').select('*').in('status', ['in_progress', 'delayed']);
    if (routeId) query = query.eq('route_id', routeId);
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = tripSessions.filter(t => t.status === 'in_progress' || t.status === 'delayed');
  if (routeId) result = result.filter(t => t.route_id === routeId);
  return { data: result, error: null };
}

export async function getTripHistory(routeId) {
  if (isLive) {
    const { data, error } = await supabase
      .from('trip_sessions')
      .select('*')
      .eq('route_id', routeId)
      .order('started_at', { ascending: false })
      .limit(30);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  return { data: tripSessions.filter(t => t.route_id === routeId), error: null };
}

// ============================================================
// VEHICLE PERMITS
// ============================================================
export async function checkVehiclePermit(registration) {
  if (isLive) {
    const { data, error } = await supabase
      .from('vehicle_permits')
      .select('*')
      .eq('vehicle_registration', registration.toUpperCase())
      .single();
    return { data: data || null, error: error?.message };
  }
  await delay(300);
  const permit = vehiclePermits.find(p => p.vehicle_registration === registration.toUpperCase());
  return { data: permit || null, error: null };
}

export async function reportUnsafeTransport(report) {
  if (isLive) {
    const { data, error } = await supabase
      .from('civic_reports')
      .insert({
        category: 'other',
        department: 'community',
        title: `Unsafe transport: ${report.vehicle_reg || 'Unknown'}`,
        description: report.description,
        latitude: report.latitude || -25.8653,
        longitude: report.longitude || 25.6441,
        address: report.address || 'Mahikeng',
        urgency: 'high',
      })
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(400);
  return { data: { id: uuid(), title: `Unsafe transport: ${report.vehicle_reg}`, status: 'pending' }, error: null };
}

// ============================================================
// STRANDED REPORTS
// ============================================================
export async function reportStranded(routeId, parentToken) {
  if (isLive) {
    const { data, error } = await supabase
      .from('stranded_reports')
      .insert({ route_id: routeId, parent_user_token: parentToken })
      .select()
      .single();
    return { data, error: error?.message };
  }
  await delay(300);
  const report = { id: uuid(), route_id: routeId, parent_user_token: parentToken, reported_at: new Date().toISOString(), resolved_at: null };
  strandedReports.push(report);
  return { data: report, error: null };
}

export async function getStrandedReports() {
  if (isLive) {
    const { data, error } = await supabase
      .from('stranded_reports')
      .select('*')
      .is('resolved_at', null)
      .order('reported_at', { ascending: false });
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  return { data: strandedReports.filter(r => !r.resolved_at), error: null };
}

// ============================================================
// SEED DATA
// ============================================================
export function seedTransportData() {
  transportRoutes = [
    { id: uuid(), name: 'Route A — CBD to Mmabatho High', school: 'Mmabatho High School', vehicle_registration: 'NW 123 GP', driver_name: 'Mr. Thabo Molefe', driver_phone: '082 456 7890', scheduled_pickup_times: ['06:30', '07:00'], scheduled_dropoff_times: ['14:00', '14:30'], is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Route B — Montshiwa to Mahikeng Primary', school: 'Mahikeng Primary School', vehicle_registration: 'NW 456 GP', driver_name: 'Mrs. Sarah Nkosi', driver_phone: '076 234 5678', scheduled_pickup_times: ['06:45', '07:15'], scheduled_dropoff_times: ['13:30', '14:00'], is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Route C — Riviera Park to Unit High', school: 'Unit High School', vehicle_registration: 'NW 789 GP', driver_name: 'Mr. Pieter van der Merwe', driver_phone: '083 678 9012', scheduled_pickup_times: ['06:15', '06:45'], scheduled_dropoff_times: ['14:15', '14:45'], is_active: true, created_at: new Date().toISOString() },
  ];

  vehiclePermits = [
    { id: uuid(), vehicle_registration: 'NW 123 GP', permit_status: 'valid', roadworthy_status: 'valid', driver_prdp_status: 'valid', last_checked_date: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: uuid(), vehicle_registration: 'NW 456 GP', permit_status: 'valid', roadworthy_status: 'valid', driver_prdp_status: 'expired', last_checked_date: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: uuid(), vehicle_registration: 'NW 789 GP', permit_status: 'expired', roadworthy_status: 'unknown', driver_prdp_status: 'unknown', last_checked_date: new Date(Date.now() - 90 * 86400000).toISOString() },
    { id: uuid(), vehicle_registration: 'NW 999 GP', permit_status: 'unknown', roadworthy_status: 'unknown', driver_prdp_status: 'unknown', last_checked_date: null },
  ];

  // Seed some active trips
  const now = Date.now();
  tripSessions = [
    { id: uuid(), route_id: transportRoutes[0].id, driver_user_token: uuid(), status: 'in_progress', started_at: new Date(now - 1800000).toISOString(), completed_at: null, locations: [{ lat: -25.8650, lng: 25.6440, t: now - 60000 }] },
    { id: uuid(), route_id: transportRoutes[1].id, driver_user_token: uuid(), status: 'in_progress', started_at: new Date(now - 1200000).toISOString(), completed_at: null, locations: [{ lat: -25.8620, lng: 25.6480, t: now - 30000 }] },
    { id: uuid(), route_id: transportRoutes[2].id, driver_user_token: uuid(), status: 'delayed', started_at: new Date(now - 2400000).toISOString(), completed_at: null, locations: [] },
  ];
}

seedTransportData();
