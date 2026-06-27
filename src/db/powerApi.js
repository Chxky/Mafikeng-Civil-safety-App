import { supabase } from './supabase';

export async function submitOutageReport(report) {
  const department = 'electricity';
  const { data, error } = await supabase.from('civic_reports').insert({
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
  }).select().single();

  if (!error && data) {
    await triggerBusinessAlerts(data, report.outage_type);
  }
  return { data, error: error?.message };
}

export async function getOutageReports(filters = {}) {
  let query = supabase.from('civic_reports').select('*').eq('category', 'electricity').order('created_at', { ascending: false });
  if (filters.outageType) query = query.eq('outage_type', filters.outageType);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.since) query = query.gte('created_at', filters.since);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function confirmOutage(reportId, userId) {
  const { data: existing } = await supabase.from('outage_confirmations').select('id').eq('report_id', reportId).eq('user_token_id', userId).single();
  if (existing) return { data: null, error: 'Already confirmed' };
  const { data, error } = await supabase.from('outage_confirmations').insert({ report_id: reportId, user_token_id: userId }).select().single();
  return { data, error: error?.message };
}

export async function getOutageConfirmations(reportId) {
  const { count, error } = await supabase.from('outage_confirmations').select('*', { count: 'exact', head: true }).eq('report_id', reportId);
  return { count: count || 0, error: error?.message };
}

export async function createBusinessProfile(profile) {
  const { data, error } = await supabase.from('business_profiles').insert({
    user_token_id: profile.user_token_id,
    business_name: profile.business_name,
    business_type: profile.business_type,
    phone: profile.phone,
    latitude: profile.latitude,
    longitude: profile.longitude,
    address: profile.address,
    alert_radius_km: profile.alert_radius_km || 2,
    is_active: true,
  }).select().single();
  return { data, error: error?.message };
}

export async function getBusinessProfile(userTokenId) {
  let query = supabase.from('business_profiles').select('*');
  if (userTokenId) query = query.eq('user_token_id', userTokenId);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function getBusinessAlerts(userTokenId) {
  const { data, error } = await supabase.from('business_alerts').select('*').eq('user_token_id', userTokenId).order('created_at', { ascending: false });
  return { data: data || [], error: error?.message };
}

async function triggerBusinessAlerts(report, type) {
  try {
    const { data: businesses } = await supabase.from('business_profiles').select('id, user_token_id, business_name');
    if (!businesses || businesses.length === 0) return;
    const alertsToInsert = businesses.map(b => ({
      user_token_id: b.user_token_id,
      business_profile_id: b.id,
      title: `${type === 'scheduled' ? 'Scheduled' : 'Unscheduled'} Outage Alert`,
      message: `Power outage reported near ${b.business_name}. Keep generators ready.`,
      report_id: report.id,
    }));
    await supabase.from('business_alerts').insert(alertsToInsert);
  } catch (err) {
    console.error('Error triggering business alerts:', err);
  }
}
