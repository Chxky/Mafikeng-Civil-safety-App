import { supabase } from './supabase';
import { CATEGORY_TO_DEPARTMENT } from '../utils/helpers';

export async function createOrGetToken(token) {
  const { data: existing } = await supabase.from('user_tokens').select('*').eq('token', token).single();
  if (existing) {
    await supabase.from('user_tokens').update({ last_active_at: new Date().toISOString() }).eq('id', existing.id);
    return { data: existing, error: null };
  }
  const { data, error } = await supabase.from('user_tokens').insert({ token, display_name: 'Community Member' }).select().single();
  return { data, error: error?.message };
}

export async function submitReport(report) {
  const department = CATEGORY_TO_DEPARTMENT[report.category] || 'community';
  const { data, error } = await supabase.from('civic_reports').insert({
    user_token_id: report.user_token_id || null,
    category: report.category,
    department,
    title: report.title,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    address: report.address,
    urgency: report.urgency || 'normal',
    photo_urls: report.photo_urls || [],
    video_urls: report.video_urls || [],
  }).select().single();

  if (!error && data) {
    await notifyDepartment(data.id, department, 'new_report', `New ${report.category} report: ${report.title}`);
  }
  return { data, error: error?.message };
}

export async function getCivicReports(filters = {}) {
  let query = supabase.from('civic_reports').select('*');
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.department) query = query.eq('department', filters.department);
  if (filters.userTokenId) query = query.eq('user_token_id', filters.userTokenId);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function getReportById(id) {
  const { data, error } = await supabase.from('civic_reports').select('*').eq('id', id).single();
  return { data: data || null, error: error?.message };
}

export async function updateReportStatus(id, status, response) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (response) updates.municipality_response = response;
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();
  const { data, error } = await supabase.from('civic_reports').update(updates).eq('id', id).select().single();
  return { data, error: error?.message };
}

export async function submitIncident(incident) {
  const { data, error } = await supabase.from('safety_incidents').insert({
    user_token_id: incident.user_token_id || null,
    incident_type: incident.incident_type,
    description: incident.description,
    latitude: incident.latitude,
    longitude: incident.longitude,
    address: incident.address,
    photo_urls: incident.photo_urls || [],
    is_anonymous: incident.is_anonymous ?? true,
  }).select().single();
  return { data, error: error?.message };
}

export async function getSafetyIncidents(filters = {}) {
  let query = supabase.from('safety_incidents').select('*').eq('is_removed', false);
  if (filters.incidentType) query = query.eq('incident_type', filters.incidentType);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function confirmIncident(incidentId, userId, type) {
  const { data: existing } = await supabase.from('incident_confirmations').select('id').eq('incident_id', incidentId).eq('user_token_id', userId).single();
  if (existing) return { data: null, error: 'Already confirmed' };
  const { error: insertError } = await supabase.from('incident_confirmations').insert({ incident_id: incidentId, user_token_id: userId, confirmation_type: type });
  if (insertError) return { data: null, error: insertError.message };
  const field = type === 'confirm' ? 'confirmations' : 'flags';
  const { data: incident } = await supabase.from('safety_incidents').select(field).eq('id', incidentId).single();
  if (incident) {
    await supabase.from('safety_incidents').update({ [field]: (incident[field] || 0) + 1 }).eq('id', incidentId);
  }
  return { data: { success: true }, error: null };
}

export async function removeIncident(incidentId, moderatorId, reason) {
  const { data, error } = await supabase.from('safety_incidents').update({ is_removed: true, removed_by: moderatorId, removal_reason: reason }).eq('id', incidentId).select().single();
  return { data, error: error?.message };
}

export async function createSOSAlert(alert) {
  const { data, error } = await supabase.from('sos_alerts').insert({
    user_token_id: alert.user_token_id || null,
    latitude: alert.latitude,
    longitude: alert.longitude,
    alert_type: alert.alert_type || 'panic',
  }).select().single();
  return { data, error: error?.message };
}

export async function updateSOSAlert(id, updates) {
  const { data, error } = await supabase.from('sos_alerts').update(updates).eq('id', id).select().single();
  return { data, error: error?.message };
}

export async function getDashboardStats() {
  const { data: reports } = await supabase.from('civic_reports').select('status, category, department, created_at, resolved_at');
  const { data: incidents } = await supabase.from('safety_incidents').select('id').eq('is_removed', false);
  const { data: alerts } = await supabase.from('sos_alerts').select('id').eq('status', 'active');
  const allReports = reports || [];
  const total = allReports.length;
  const byStatus = {
    pending: allReports.filter(r => r.status === 'pending').length,
    acknowledged: allReports.filter(r => r.status === 'acknowledged').length,
    in_progress: allReports.filter(r => r.status === 'in_progress').length,
    resolved: allReports.filter(r => r.status === 'resolved').length,
  };
  const resolutionRate = total > 0 ? ((byStatus.resolved / total) * 100).toFixed(1) : 0;
  const byCategory = {};
  allReports.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, resolved: 0 };
    byCategory[r.category].total++;
    if (r.status === 'resolved') byCategory[r.category].resolved++;
  });
  const byDepartment = {};
  allReports.forEach(r => {
    const dept = r.department || 'community';
    if (!byDepartment[dept]) byDepartment[dept] = { total: 0, pending: 0, resolved: 0 };
    byDepartment[dept].total++;
    if (r.status === 'pending') byDepartment[dept].pending++;
    if (r.status === 'resolved') byDepartment[dept].resolved++;
  });
  const avgResolutionDays = allReports.filter(r => r.resolved_at).map(r => (new Date(r.resolved_at) - new Date(r.created_at)) / 86400000).reduce((a, b, _, arr) => a + b / arr.length, 0);
  return {
    data: {
      totalReports: total,
      byStatus,
      resolutionRate,
      byCategory,
      byDepartment,
      avgResolutionDays: avgResolutionDays.toFixed(1),
      totalIncidents: (incidents || []).length,
      activeAlerts: (alerts || []).length,
    },
    error: null,
  };
}

export async function notifyDepartment(reportId, department, type = 'new_report', message = '') {
  const { data, error } = await supabase.from('department_notifications').insert({
    report_id: reportId,
    department,
    notification_type: type,
    message,
  }).select().single();
  return { data, error: error?.message };
}

export async function getDepartmentNotifications(department) {
  let query = supabase.from('department_notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (department) query = query.eq('department', department);
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function processSMSReport(phoneHash, message) {
  const reportMatch = message.match(/^#REPORT\s+(.+?)(?:\s+at\s+(.+))?$/i);
  const sosMatch = message.match(/^#SOS/i);
  let parsed_category = null;
  let parsed_description = null;
  let civic_report_id = null;

  if (reportMatch) {
    const description = reportMatch[1].trim();
    const address = reportMatch[2]?.trim() || 'Location not specified';
    const desc = description.toLowerCase();
    if (desc.includes('pothole') || desc.includes('road')) parsed_category = 'pothole';
    else if (desc.includes('water') || desc.includes('leak')) parsed_category = 'water_leak';
    else if (desc.includes('sewage') || desc.includes('sewer')) parsed_category = 'sewage';
    else if (desc.includes('light') || desc.includes('lamp')) parsed_category = 'streetlight';
    else if (desc.includes('electric') || desc.includes('power')) parsed_category = 'electricity';
    else if (desc.includes('dump') || desc.includes('rubbish')) parsed_category = 'illegal_dumping';
    else parsed_category = 'other';
    parsed_description = description;

    const { data: report } = await submitReport({
      category: parsed_category,
      title: `SMS Report: ${description.substring(0, 50)}`,
      description,
      latitude: -25.8653 + (Math.random() - 0.5) * 0.02,
      longitude: 25.6441 + (Math.random() - 0.5) * 0.02,
      address,
      urgency: 'normal',
    });
    civic_report_id = report?.id;
  } else if (sosMatch) {
    await createSOSAlert({
      latitude: -25.8653,
      longitude: 25.6441,
      alert_type: 'panic',
    });
  }

  const trackMatch = message.match(/^#TRACK\s+(.+)/i);
  const checkMatch = message.match(/^#CHECK\s+(.+)/i);
  const warningsMatch = message.match(/^#WARNINGS/i);
  const disasterMatch = message.match(/^#DISASTER\s+(.+?)(?:\s+at\s+(.+))?$/i);
  const safeMatch = message.match(/^#SAFE/i);
  const helpMatch = message.match(/^#HELP/i);

  if (trackMatch) parsed_description = `Track request: ${trackMatch[1].trim()}`;
  else if (checkMatch) parsed_description = `Vehicle check: ${checkMatch[1].trim()}`;
  else if (warningsMatch) parsed_description = 'Weather warnings request';
  else if (disasterMatch) parsed_description = `Disaster report: ${disasterMatch[1].trim()} at ${disasterMatch[2]?.trim() || 'location not specified'}`;
  else if (safeMatch) parsed_description = 'Safety status: SAFE';
  else if (helpMatch) parsed_description = 'Safety status: NEED HELP';

  const { data, error } = await supabase.from('sms_reports').insert({
    phone_number_hash: phoneHash,
    raw_message: message,
    parsed_category,
    parsed_description,
    civic_report_id,
    processed: !!reportMatch || !!sosMatch,
  }).select().single();
  return { data, error: error?.message };
}

export async function getSMSReports() {
  const { data, error } = await supabase.from('sms_reports').select('*').order('created_at', { ascending: false });
  return { data: data || [], error: error?.message };
}

export async function getPatrolGroups() {
  const { data, error } = await supabase.from('patrol_groups').select('*, patrol_members(count)').eq('is_active', true).order('name');
  return { data: data || [], error: error?.message };
}

export async function getPatrolMessages(groupId) {
  const { data, error } = await supabase.from('patrol_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(100);
  return { data: data || [], error: error?.message };
}

export async function sendPatrolMessage(groupId, userId, message, encryptedContent = null) {
  const payload = { group_id: groupId, user_token_id: userId, message: '🔒 End-to-end encrypted', message_type: 'text' };
  if (encryptedContent) payload.encrypted_content = encryptedContent;
  const { data, error } = await supabase.from('patrol_messages').insert(payload).select().single();
  return { data, error: error?.message };
}

export async function getActivePatrollers(groupId) {
  const { data, error } = await supabase.from('patrol_locations').select('*, patrol_members!inner(display_name)').eq('group_id', groupId).gte('updated_at', new Date(Date.now() - 300000).toISOString());
  return { data: data || [], error: error?.message };
}

export async function getCommunityLeaders() {
  const { data, error } = await supabase.from('community_leaders').select('*').eq('is_active', true).order('name');
  return { data: data || [], error: error?.message };
}

export async function uploadPhoto(file, path) {
  const filePath = `reports/${path}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from('report-photos').upload(filePath, file, { contentType: file.type, upsert: false });
  if (error) return { data: null, error: error.message };
  const { data: urlData } = supabase.storage.from('report-photos').getPublicUrl(data.path);
  return { data: { url: urlData.publicUrl, path: data.path }, error: null };
}
