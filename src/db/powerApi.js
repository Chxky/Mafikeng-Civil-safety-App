// Power Module API — outage reports, business profiles, confirmations
// Dual-mode: Supabase when live, in-memory when mock

import { supabase, isLive } from './supabase';
// eslint-disable-next-line no-unused-vars
import { CATEGORY_TO_DEPARTMENT, uuid, delay } from '../utils/helpers';

// In-memory stores (mock mode)
let outageReports = [];
let businessProfiles = [];
let outageConfirmations = [];
let businessAlerts = [];

// ============================================================
// OUTAGE REPORTS (extends civic_reports where category='electricity')
// ============================================================

export async function submitOutageReport(report) {
  const department = 'electricity';

  if (isLive) {
    const { data, error } = await supabase
      .from('civic_reports')
      .insert({
        user_token_id: report.user_token_id || null,
        category: 'electricity',
        department,
        title: report.title || `${report.outage_type === 'scheduled' ? 'Scheduled' : 'Unscheduled'} power outage`,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        address: report.address,
        urgency: report.outage_type === 'scheduled' ? 'normal' : 'high',
        photo_urls: report.photo_urls || [],
        outage_type: report.outage_type || 'unknown',
        estimated_restoration: report.estimated_restoration || null,
        is_business_alert: report.is_business_alert || false,
      })
      .select()
      .single();

    if (!error && data) {
      // Trigger business alerts
      await triggerBusinessAlerts(data, report.outage_type);
    }

    return { data, error: error?.message };
  }

  await delay(500);
  const newReport = {
    id: uuid(),
    user_token_id: report.user_token_id || null,
    category: 'electricity',
    department,
    title: report.title || `${report.outage_type === 'scheduled' ? 'Scheduled' : 'Unscheduled'} power outage`,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    address: report.address,
    urgency: report.outage_type === 'scheduled' ? 'normal' : 'high',
    status: 'pending',
    outage_type: report.outage_type || 'unknown',
    estimated_restoration: report.estimated_restoration || null,
    is_business_alert: report.is_business_alert || false,
    photo_urls: report.photo_urls || [],
    video_urls: [],
    municipality_response: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  outageReports.unshift(newReport);

  // Trigger business alerts (mock)
  await triggerBusinessAlerts(newReport, report.outage_type);

  return { data: newReport, error: null };
}

/**
 * Get all power outage reports (electricity category with outage fields)
 */
export async function getOutageReports(filters = {}) {
  if (isLive) {
    let query = supabase
      .from('civic_reports')
      .select('*')
      .eq('category', 'electricity')
      .order('created_at', { ascending: false });

    if (filters.outageType) query = query.eq('outage_type', filters.outageType);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.since) query = query.gte('created_at', filters.since);

    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }

  await delay(300);
  let results = [...outageReports];
  if (filters.outageType) results = results.filter(r => r.outage_type === filters.outageType);
  if (filters.status) results = results.filter(r => r.status === filters.status);
  if (filters.since) results = results.filter(r => r.created_at >= filters.since);
  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: results, error: null };
}

/**
 * Confirm an outage ("I'm also affected")
 */
export async function confirmOutage(reportId, userId) {
  if (isLive) {
    // Check for existing confirmation
    const { data: existing } = await supabase
      .from('outage_confirmations')
      .select('id')
      .eq('report_id', reportId)
      .eq('user_token_id', userId)
      .single();

    if (existing) return { data: null, error: 'Already confirmed' };

    const { data, error } = await supabase
      .from('outage_confirmations')
      .insert({ report_id: reportId, user_token_id: userId })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(200);
  const existing = outageConfirmations.find(
    c => c.report_id === reportId && c.user_token_id === userId
  );
  if (existing) return { data: null, error: 'Already confirmed' };

  const confirmation = {
    id: uuid(),
    report_id: reportId,
    user_token_id: userId,
    created_at: new Date().toISOString(),
  };
  outageConfirmations.push(confirmation);
  return { data: confirmation, error: null };
}

/**
 * Get confirmation count for a report
 */
export async function getOutageConfirmations(reportId) {
  if (isLive) {
    const { count, error } = await supabase
      .from('outage_confirmations')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId);

    return { count: count || 0, error: error?.message };
  }

  await delay(100);
  const count = outageConfirmations.filter(c => c.report_id === reportId).length;
  return { count, error: null };
}

// ============================================================
// BUSINESS PROFILES
// ============================================================

export async function createBusinessProfile(profile) {
  if (isLive) {
    const { data, error } = await supabase
      .from('business_profiles')
      .insert({
        user_token_id: profile.user_token_id,
        business_name: profile.business_name,
        business_type: profile.business_type,
        phone: profile.phone,
        latitude: profile.latitude,
        longitude: profile.longitude,
        address: profile.address,
        alert_radius_km: profile.alert_radius_km || 2,
        is_active: true,
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(400);
  const newProfile = {
    id: uuid(),
    ...profile,
    alert_radius_km: profile.alert_radius_km || 2,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  businessProfiles.push(newProfile);
  return { data: newProfile, error: null };
}

export async function getBusinessProfile(userId) {
  if (isLive) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_token_id', userId)
      .single();

    return { data: data || null, error: error?.message };
  }

  await delay(200);
  const profile = businessProfiles.find(p => p.user_token_id === userId);
  return { data: profile || null, error: null };
}

export async function updateBusinessProfile(userId, updates) {
  if (isLive) {
    const { data, error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('user_token_id', userId)
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(300);
  const idx = businessProfiles.findIndex(p => p.user_token_id === userId);
  if (idx === -1) return { data: null, error: 'Not found' };
  businessProfiles[idx] = { ...businessProfiles[idx], ...updates };
  return { data: businessProfiles[idx], error: null };
}

// ============================================================
// BUSINESS ALERTS
// ============================================================

async function triggerBusinessAlerts(report, outageType) {
  const lat = report.latitude;
  const lng = report.longitude;
  const radiusKm = 2; // default alert radius

  // Find businesses within radius
  let nearbyBusinesses = [];

  if (isLive) {
    // Use PostGIS ST_DWithin for efficient radius search
    const { data } = await supabase.rpc('find_nearby_businesses', {
      lat,
      lng,
      radius_meters: radiusKm * 1000,
    });
    nearbyBusinesses = data || [];
  } else {
    // Mock: find businesses within rough distance
    nearbyBusinesses = businessProfiles.filter(b => {
      if (!b.is_active || !b.latitude || !b.longitude) return false;
      const dlat = b.latitude - lat;
      const dlng = b.longitude - lng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // rough km
      return dist <= (b.alert_radius_km || radiusKm);
    });
  }

  if (nearbyBusinesses.length === 0) return;

  const alertMessage = outageType === 'scheduled'
    ? `Scheduled load shedding in your area. Check backup generator.`
    : `Unscheduled power outage reported near your business. Move perishables if needed.`;

  // Send alerts
  for (const business of nearbyBusinesses) {
    const alert = {
      id: uuid(),
      business_id: business.id,
      report_id: report.id,
      message: alertMessage,
      outage_type: outageType,
      sent_at: new Date().toISOString(),
    };

    if (isLive) {
      await supabase.from('business_alerts').insert(alert);
    } else {
      businessAlerts.push(alert);
    }

    // Push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mahikeng Power Alert', {
        body: `${business.business_name}: ${alertMessage}`,
        icon: '/icons/icon-192.svg',
        tag: `power-alert-${report.id}`,
      });
    }
  }
}

export async function getBusinessAlerts(businessId) {
  if (isLive) {
    const { data, error } = await supabase
      .from('business_alerts')
      .select('*')
      .eq('business_id', businessId)
      .order('sent_at', { ascending: false })
      .limit(20);

    return { data: data || [], error: error?.message };
  }

  await delay(200);
  const alerts = businessAlerts
    .filter(a => a.business_id === businessId)
    .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
    .slice(0, 20);
  return { data: alerts, error: null };
}

// ============================================================
// SEED DATA (mock mode)
// ============================================================

export function seedPowerData() {
  outageReports = [];
  outageConfirmations = [];
  businessAlerts = [];
  // Seed some business profiles
  const types = ['restaurant', 'fresh_produce', 'guesthouse', 'clothing', 'other'];
  const names = [
    'Mmabatho Spaza Shop', 'Mahikeng Fresh Market', 'Riviera Guest House',
    'CBD Fashion Store', 'Montshiwa Butchery', 'Station Road Pharmacy',
  ];

  businessProfiles = names.map((name, i) => ({
    id: uuid(),
    user_token_id: uuid(),
    business_name: name,
    business_type: types[i % types.length],
    phone: `0${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    latitude: -25.8653 + (Math.random() - 0.5) * 0.02,
    longitude: 25.6441 + (Math.random() - 0.5) * 0.02,
    address: `${Math.floor(Math.random() * 200) + 1} Main Road, Mahikeng`,
    alert_radius_km: 2,
    is_active: true,
    created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
  }));
}

// Initialize seed data
seedPowerData();
