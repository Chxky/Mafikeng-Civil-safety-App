// API Layer — Supabase in production, in-memory mock for demo mode
// All function signatures are identical regardless of backend

import { supabase, isLive } from './supabase';
import { CATEGORY_TO_DEPARTMENT } from '../utils/helpers';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ============================================================
// IN-MEMORY STORES (mock mode only)
// ============================================================
let userTokens = [];
let civicReports = [];
let safetyIncidents = [];
let sosAlerts = [];
let incidentConfirmations = [];
let smsReports = [];

function seedData() {
  const categories = ['pothole', 'water_leak', 'sewage', 'streetlight', 'electricity', 'illegal_dumping'];
  const statuses = ['pending', 'acknowledged', 'in_progress', 'resolved'];
  const incidentTypes = ['suspicious_activity', 'theft', 'vandalism', 'break_in', 'drug_activity'];
  const center = { lat: -25.8653, lng: 25.6441 };

  for (let i = 0; i < 25; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 60);
    civicReports.push({
      id: uuid(),
      user_token_id: uuid(),
      category,
      department: CATEGORY_TO_DEPARTMENT[category] || 'community',
      title: getCategoryTitle(category),
      description: getCategoryDescription(category),
      latitude: center.lat + (Math.random() - 0.5) * 0.04,
      longitude: center.lng + (Math.random() - 0.5) * 0.04,
      address: getRandomAddress(),
      urgency: ['low', 'normal', 'high', 'critical'][Math.floor(Math.random() * 4)],
      status,
      photo_urls: [],
      video_urls: [],
      municipality_response: status !== 'pending' ? getResponseForStatus(status) : null,
      resolved_at: status === 'resolved' ? new Date(Date.now() - (daysAgo - 5) * 86400000).toISOString() : null,
      created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      updated_at: new Date(Date.now() - Math.max(0, daysAgo - 2) * 86400000).toISOString(),
    });
  }

  for (let i = 0; i < 15; i++) {
    const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
    const daysAgo = Math.floor(Math.random() * 14);
    safetyIncidents.push({
      id: uuid(),
      user_token_id: uuid(),
      incident_type: type,
      description: getIncidentDescription(type),
      latitude: center.lat + (Math.random() - 0.5) * 0.04,
      longitude: center.lng + (Math.random() - 0.5) * 0.04,
      address: getRandomAddress(),
      photo_urls: [],
      is_anonymous: true,
      confirmations: Math.floor(Math.random() * 20),
      flags: Math.floor(Math.random() * 3),
      is_verified: Math.random() > 0.6,
      is_removed: false,
      created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    });
  }
}

function getCategoryTitle(cat) {
  const titles = {
    pothole: 'Large pothole on main road',
    water_leak: 'Water pipe burst - flooding street',
    sewage: 'Raw sewage flowing into yard',
    streetlight: 'Streetlight not working for weeks',
    electricity: 'Power outage in entire block',
    illegal_dumping: 'Illegal dumping on vacant stand',
  };
  return titles[cat] || 'Infrastructure issue reported';
}

function getCategoryDescription(cat) {
  const descs = {
    pothole: 'Deep pothole approximately 50cm wide causing damage to vehicles.',
    water_leak: 'Clean water leaking from underground pipe. Water pooling on road surface.',
    sewage: 'Raw sewage overflowing from manhole cover. Health hazard for nearby residents.',
    streetlight: 'Streetlight non-functional for over 3 weeks. Area very dark at night.',
    electricity: 'Complete power outage affecting multiple households.',
    illegal_dumping: 'Construction rubble and household waste dumped on vacant lot.',
  };
  return descs[cat] || 'Issue reported by community member';
}

function getIncidentDescription(type) {
  const descs = {
    suspicious_activity: 'Suspicious individuals observed loitering near residences late at night.',
    theft: 'House break-in reported. Entry through back window. Electronics stolen.',
    vandalism: 'Graffiti and property damage to community center walls.',
    break_in: 'Attempted break-in at local business. Security gate damaged.',
    drug_activity: 'Suspected drug dealing observed at park. Regular activity at same location.',
  };
  return descs[type] || 'Incident reported by community member';
}

function getRandomAddress() {
  const streets = [
    'Station Road', 'Main Road', 'Church Street', 'Buffalo Road',
    'Sekame Street', 'First Avenue', 'Second Avenue', 'Nelson Mandela Drive',
    'Temba Road', 'Lotlamoreng Road', 'Montshiwa Road', 'Mmabatho Road',
  ];
  return `${Math.floor(Math.random() * 200) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, Mahikeng`;
}

function getResponseForStatus(status) {
  const responses = {
    acknowledged: 'Report received and logged. Municipality team has been notified.',
    in_progress: 'Repair team dispatched. Expected completion within 48 hours.',
    resolved: 'Issue has been resolved. Please report if problem persists.',
  };
  return responses[status] || '';
}

// Initialize mock data
seedData();

// ============================================================
// API METHODS
// ============================================================

// -- User Tokens --
export async function createOrGetToken(token) {
  if (isLive) {
    const { data: existing } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (existing) {
      await supabase.from('user_tokens').update({ last_active_at: new Date().toISOString() }).eq('id', existing.id);
      return { data: existing, error: null };
    }

    const { data, error } = await supabase
      .from('user_tokens')
      .insert({ token, display_name: 'Community Member' })
      .select()
      .single();

    return { data, error: error?.message };
  }

  // Mock mode
  await delay(200);
  let user = userTokens.find(u => u.token === token);
  if (!user) {
    user = {
      id: uuid(),
      token,
      display_name: 'Community Member',
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      is_moderator: false,
      is_patrol_member: false,
      emergency_contacts: [],
    };
    userTokens.push(user);
  }
  return { data: user, error: null };
}

// -- Civic Reports --
export async function submitReport(report) {
  const department = CATEGORY_TO_DEPARTMENT[report.category] || 'community';

  if (isLive) {
    const { data, error } = await supabase
      .from('civic_reports')
      .insert({
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
      })
      .select()
      .single();

    if (!error && data) {
      await notifyDepartment(data.id, department, 'new_report', `New ${report.category} report: ${report.title}`);
    }

    return { data, error: error?.message };
  }

  await delay(500);
  const newReport = {
    id: uuid(),
    ...report,
    department,
    status: 'pending',
    municipality_response: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  civicReports.unshift(newReport);

  // Notify department (mock)
  await notifyDepartment(newReport.id, department, 'new_report', `New ${report.category} report: ${report.title}`);

  return { data: newReport, error: null };
}

export async function getCivicReports(filters = {}) {
  if (isLive) {
    let query = supabase.from('civic_reports').select('*');
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.department) query = query.eq('department', filters.department);
    if (filters.userTokenId) query = query.eq('user_token_id', filters.userTokenId);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }

  await delay(300);
  let results = [...civicReports];
  if (filters.status) results = results.filter(r => r.status === filters.status);
  if (filters.category) results = results.filter(r => r.category === filters.category);
  if (filters.department) results = results.filter(r => r.department === filters.department);
  if (filters.userTokenId) results = results.filter(r => r.user_token_id === filters.userTokenId);
  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: results, error: null };
}

export async function getReportById(id) {
  if (isLive) {
    const { data, error } = await supabase
      .from('civic_reports')
      .select('*')
      .eq('id', id)
      .single();

    return { data: data || null, error: error?.message };
  }

  await delay(200);
  const report = civicReports.find(r => r.id === id);
  return { data: report || null, error: report ? null : 'Not found' };
}

export async function updateReportStatus(id, status, response) {
  if (isLive) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (response) updates.municipality_response = response;
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('civic_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(400);
  const idx = civicReports.findIndex(r => r.id === id);
  if (idx === -1) return { data: null, error: 'Not found' };
  civicReports[idx] = {
    ...civicReports[idx],
    status,
    municipality_response: response || civicReports[idx].municipality_response,
    resolved_at: status === 'resolved' ? new Date().toISOString() : civicReports[idx].resolved_at,
    updated_at: new Date().toISOString(),
  };
  return { data: civicReports[idx], error: null };
}

// -- Safety Incidents --
export async function submitIncident(incident) {
  if (isLive) {
    const { data, error } = await supabase
      .from('safety_incidents')
      .insert({
        user_token_id: incident.user_token_id || null,
        incident_type: incident.incident_type,
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        address: incident.address,
        photo_urls: incident.photo_urls || [],
        is_anonymous: incident.is_anonymous ?? true,
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(400);
  const newIncident = {
    id: uuid(),
    ...incident,
    confirmations: 0,
    flags: 0,
    is_verified: false,
    is_removed: false,
    created_at: new Date().toISOString(),
  };
  safetyIncidents.unshift(newIncident);
  return { data: newIncident, error: null };
}

export async function getSafetyIncidents(filters = {}) {
  if (isLive) {
    let query = supabase.from('safety_incidents').select('*').eq('is_removed', false);
    if (filters.incidentType) query = query.eq('incident_type', filters.incidentType);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }

  await delay(300);
  let results = safetyIncidents.filter(i => !i.is_removed);
  if (filters.incidentType) results = results.filter(i => i.incident_type === filters.incidentType);
  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: results, error: null };
}

export async function confirmIncident(incidentId, userId, type) {
  if (isLive) {
    // Check for existing confirmation
    const { data: existing } = await supabase
      .from('incident_confirmations')
      .select('id')
      .eq('incident_id', incidentId)
      .eq('user_token_id', userId)
      .single();

    if (existing) return { data: null, error: 'Already confirmed' };

    const { error: insertError } = await supabase
      .from('incident_confirmations')
      .insert({ incident_id: incidentId, user_token_id: userId, confirmation_type: type });

    if (insertError) return { data: null, error: insertError.message };

    // Update the incident's count
    const field = type === 'confirm' ? 'confirmations' : 'flags';
    const { data: incident } = await supabase
      .from('safety_incidents')
      .select(field)
      .eq('id', incidentId)
      .single();

    if (incident) {
      await supabase
        .from('safety_incidents')
        .update({ [field]: (incident[field] || 0) + 1 })
        .eq('id', incidentId);
    }

    return { data: { success: true }, error: null };
  }

  await delay(200);
  const existing = incidentConfirmations.find(
    c => c.incident_id === incidentId && c.user_token_id === userId
  );
  if (existing) return { data: null, error: 'Already confirmed' };

  incidentConfirmations.push({
    id: uuid(),
    incident_id: incidentId,
    user_token_id: userId,
    confirmation_type: type,
    created_at: new Date().toISOString(),
  });

  const idx = safetyIncidents.findIndex(i => i.id === incidentId);
  if (idx !== -1) {
    if (type === 'confirm') safetyIncidents[idx].confirmations++;
    if (type === 'flag') safetyIncidents[idx].flags++;
  }
  return { data: { success: true }, error: null };
}

export async function removeIncident(incidentId, moderatorId, reason) {
  if (isLive) {
    const { data, error } = await supabase
      .from('safety_incidents')
      .update({ is_removed: true, removed_by: moderatorId, removal_reason: reason })
      .eq('id', incidentId)
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(300);
  const idx = safetyIncidents.findIndex(i => i.id === incidentId);
  if (idx === -1) return { data: null, error: 'Not found' };
  safetyIncidents[idx].is_removed = true;
  safetyIncidents[idx].removed_by = moderatorId;
  safetyIncidents[idx].removal_reason = reason;
  return { data: safetyIncidents[idx], error: null };
}

// -- SOS Alerts --
export async function createSOSAlert(alert) {
  if (isLive) {
    const { data, error } = await supabase
      .from('sos_alerts')
      .insert({
        user_token_id: alert.user_token_id || null,
        latitude: alert.latitude,
        longitude: alert.longitude,
        alert_type: alert.alert_type || 'panic',
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(300);
  const newAlert = {
    id: uuid(),
    ...alert,
    status: 'active',
    contacts_notified: 0,
    created_at: new Date().toISOString(),
  };
  sosAlerts.unshift(newAlert);
  return { data: newAlert, error: null };
}

export async function updateSOSAlert(id, updates) {
  if (isLive) {
    const { data, error } = await supabase
      .from('sos_alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(200);
  const idx = sosAlerts.findIndex(a => a.id === id);
  if (idx === -1) return { data: null, error: 'Not found' };
  sosAlerts[idx] = { ...sosAlerts[idx], ...updates };
  return { data: sosAlerts[idx], error: null };
}

// -- Dashboard Stats --
export async function getDashboardStats() {
  if (isLive) {
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
    const avgResolutionDays = allReports
      .filter(r => r.resolved_at)
      .map(r => (new Date(r.resolved_at) - new Date(r.created_at)) / 86400000)
      .reduce((a, b, _, arr) => a + b / arr.length, 0);

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

  await delay(400);
  const total = civicReports.length;
  const byStatus = {
    pending: civicReports.filter(r => r.status === 'pending').length,
    acknowledged: civicReports.filter(r => r.status === 'acknowledged').length,
    in_progress: civicReports.filter(r => r.status === 'in_progress').length,
    resolved: civicReports.filter(r => r.status === 'resolved').length,
  };
  const resolutionRate = total > 0 ? ((byStatus.resolved / total) * 100).toFixed(1) : 0;
  const byCategory = {};
  civicReports.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, resolved: 0 };
    byCategory[r.category].total++;
    if (r.status === 'resolved') byCategory[r.category].resolved++;
  });
  const byDepartment = {};
  civicReports.forEach(r => {
    const dept = r.department || 'community';
    if (!byDepartment[dept]) byDepartment[dept] = { total: 0, pending: 0, resolved: 0 };
    byDepartment[dept].total++;
    if (r.status === 'pending') byDepartment[dept].pending++;
    if (r.status === 'resolved') byDepartment[dept].resolved++;
  });
  const avgResolutionDays = civicReports
    .filter(r => r.resolved_at)
    .map(r => (new Date(r.resolved_at) - new Date(r.created_at)) / 86400000)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  return {
    data: {
      totalReports: total,
      byStatus,
      resolutionRate,
      byCategory,
      byDepartment,
      avgResolutionDays: avgResolutionDays.toFixed(1),
      totalIncidents: safetyIncidents.filter(i => !i.is_removed).length,
      activeAlerts: sosAlerts.filter(a => a.status === 'active').length,
    },
    error: null,
  };
}

// -- Department Notifications --
let departmentNotifications = [];

export async function notifyDepartment(reportId, department, type = 'new_report', message = '') {
  if (isLive) {
    const { data, error } = await supabase
      .from('department_notifications')
      .insert({
        report_id: reportId,
        department,
        notification_type: type,
        message,
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(100);
  const notification = {
    id: uuid(),
    report_id: reportId,
    department,
    notification_type: type,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  departmentNotifications.unshift(notification);
  return { data: notification, error: null };
}

export async function getDepartmentNotifications(department) {
  if (isLive) {
    let query = supabase
      .from('department_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (department) query = query.eq('department', department);

    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }

  await delay(200);
  let results = departmentNotifications;
  if (department) results = results.filter(n => n.department === department);
  return { data: results.slice(0, 50), error: null };
}

// -- SMS/USSD Processing --
export async function processSMSReport(phoneHash, message) {
  if (isLive) {
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

      // Create the civic report
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

    // Extended commands
    const trackMatch = message.match(/^#TRACK\s+(.+)/i);
    const checkMatch = message.match(/^#CHECK\s+(.+)/i);
    const warningsMatch = message.match(/^#WARNINGS/i);
    const disasterMatch = message.match(/^#DISASTER\s+(.+?)(?:\s+at\s+(.+))?$/i);
    const safeMatch = message.match(/^#SAFE/i);
    const helpMatch = message.match(/^#HELP/i);

    if (trackMatch) {
      parsed_description = `Track request: ${trackMatch[1].trim()}`;
    } else if (checkMatch) {
      parsed_description = `Vehicle check: ${checkMatch[1].trim()}`;
    } else if (warningsMatch) {
      parsed_description = 'Weather warnings request';
    } else if (disasterMatch) {
      parsed_description = `Disaster report: ${disasterMatch[1].trim()} at ${disasterMatch[2]?.trim() || 'location not specified'}`;
    } else if (safeMatch) {
      parsed_description = 'Safety status: SAFE';
    } else if (helpMatch) {
      parsed_description = 'Safety status: NEED HELP';
    }

    const { data, error } = await supabase
      .from('sms_reports')
      .insert({
        phone_number_hash: phoneHash,
        raw_message: message,
        parsed_category,
        parsed_description,
        civic_report_id,
        processed: !!reportMatch || !!sosMatch,
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(300);
  const reportMatch = message.match(/^#REPORT\s+(.+?)(?:\s+at\s+(.+))?$/i);
  const sosMatch = message.match(/^#SOS/i);

  const smsRecord = {
    id: uuid(),
    phone_number_hash: phoneHash,
    raw_message: message,
    processed: false,
    created_at: new Date().toISOString(),
  };

  if (reportMatch) {
    const description = reportMatch[1].trim();
    const address = reportMatch[2]?.trim() || 'Location not specified';
    let category = 'other';
    const desc = description.toLowerCase();
    if (desc.includes('pothole') || desc.includes('road')) category = 'pothole';
    else if (desc.includes('water') || desc.includes('leak') || desc.includes('pipe')) category = 'water_leak';
    else if (desc.includes('sewage') || desc.includes('sewer') || desc.includes('toilet')) category = 'sewage';
    else if (desc.includes('light') || desc.includes('lamp')) category = 'streetlight';
    else if (desc.includes('electric') || desc.includes('power') || desc.includes('eskom')) category = 'electricity';
    else if (desc.includes('dump') || desc.includes('rubbish') || desc.includes('waste')) category = 'illegal_dumping';

    const report = await submitReport({
      user_token_id: null,
      category,
      title: `SMS Report: ${description.substring(0, 50)}`,
      description,
      latitude: -25.8653 + (Math.random() - 0.5) * 0.02,
      longitude: 25.6441 + (Math.random() - 0.5) * 0.02,
      address,
      urgency: 'normal',
      photo_urls: [],
      video_urls: [],
    });

    smsRecord.parsed_category = category;
    smsRecord.parsed_description = description;
    smsRecord.civic_report_id = report.data.id;
    smsRecord.processed = true;
  } else if (sosMatch) {
    await createSOSAlert({
      user_token_id: null,
      latitude: -25.8653,
      longitude: 25.6441,
      alert_type: 'panic',
    });
    smsRecord.processed = true;
  }

  // Extended commands
  const trackMatch = message.match(/^#TRACK\s+(.+)/i);
  const checkMatch = message.match(/^#CHECK\s+(.+)/i);
  const warningsMatch = message.match(/^#WARNINGS/i);
  const disasterMatch = message.match(/^#DISASTER\s+(.+?)(?:\s+at\s+(.+))?$/i);
  const safeMatch = message.match(/^#SAFE/i);
  const helpMatch = message.match(/^#HELP/i);

  if (trackMatch) {
    smsRecord.parsed_description = `Track request: ${trackMatch[1].trim()}`;
    smsRecord.processed = true;
  } else if (checkMatch) {
    smsRecord.parsed_description = `Vehicle check: ${checkMatch[1].trim()}`;
    smsRecord.processed = true;
  } else if (warningsMatch) {
    smsRecord.parsed_description = 'Weather warnings request';
    smsRecord.processed = true;
  } else if (disasterMatch) {
    smsRecord.parsed_description = `Disaster report: ${disasterMatch[1].trim()} at ${disasterMatch[2]?.trim() || 'location not specified'}`;
    smsRecord.processed = true;
  } else if (safeMatch) {
    smsRecord.parsed_description = 'Safety status: SAFE';
    smsRecord.processed = true;
  } else if (helpMatch) {
    smsRecord.parsed_description = 'Safety status: NEED HELP';
    smsRecord.processed = true;
  }

  smsReports.push(smsRecord);
  return { data: smsRecord, error: null };
}

export async function getSMSReports() {
  if (isLive) {
    const { data, error } = await supabase
      .from('sms_reports')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error: error?.message };
  }

  await delay(200);
  return { data: smsReports, error: null };
}

// -- Patrol Groups --
export async function getPatrolGroups() {
  if (isLive) {
    const { data, error } = await supabase
      .from('patrol_groups')
      .select('*, patrol_members(count)')
      .eq('is_active', true)
      .order('name');

    return { data: data || [], error: error?.message };
  }

  await delay(300);
  return {
    data: [
      { id: '1', name: 'Mahikeng Central Patrol', area: 'Central Business District', members: 12, activePatrollers: 3, is_active: true },
      { id: '2', name: 'Riviera Park Watch', area: 'Riviera Park Extension', members: 8, activePatrollers: 0, is_active: true },
      { id: '3', name: 'Montshiwa Safety Forum', area: 'Montshiwa Township', members: 15, activePatrollers: 5, is_active: true },
    ],
    error: null,
  };
}

export async function getPatrolMessages(groupId) {
  if (isLive) {
    const { data, error } = await supabase
      .from('patrol_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    return { data: data || [], error: error?.message };
  }

  await delay(200);
  return {
    data: [
      { id: 1, user: 'Eagle Eye', message: 'All clear on Station Road', created_at: new Date(Date.now() - 120000).toISOString(), type: 'text' },
      { id: 2, user: 'Swift Guardian', message: 'Suspicious vehicle near church parking', created_at: new Date(Date.now() - 300000).toISOString(), type: 'alert' },
      { id: 3, user: 'Brave Sentinel', message: 'Heading to First Avenue now', created_at: new Date(Date.now() - 480000).toISOString(), type: 'text' },
      { id: 4, user: 'Watchful Keeper', message: 'Streetlight out on Buffalo Road - noted for report', created_at: new Date(Date.now() - 720000).toISOString(), type: 'text' },
      { id: 5, user: 'Eagle Eye', message: 'Meeting point at community hall at 20:00', created_at: new Date(Date.now() - 900000).toISOString(), type: 'text' },
    ],
    error: null,
  };
}

export async function sendPatrolMessage(groupId, userId, message) {
  if (isLive) {
    const { data, error } = await supabase
      .from('patrol_messages')
      .insert({
        group_id: groupId,
        user_token_id: userId,
        message,
        message_type: 'text',
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  await delay(100);
  return {
    data: {
      id: Date.now(),
      user: 'You',
      message,
      created_at: new Date().toISOString(),
      type: 'text',
    },
    error: null,
  };
}

export async function getActivePatrollers(groupId) {
  if (isLive) {
    const { data, error } = await supabase
      .from('patrol_locations')
      .select('*, patrol_members!inner(display_name)')
      .eq('group_id', groupId)
      .gte('updated_at', new Date(Date.now() - 300000).toISOString()); // active in last 5 min

    return { data: data || [], error: error?.message };
  }

  await delay(200);
  return {
    data: [
      { id: 1, name: 'Eagle Eye', lat: -25.8650, lng: 25.6440, lastSeen: '1 min ago' },
      { id: 2, name: 'Swift Guardian', lat: -25.8660, lng: 25.6450, lastSeen: '2 min ago' },
      { id: 3, name: 'Brave Sentinel', lat: -25.8640, lng: 25.6430, lastSeen: 'Just now' },
    ],
    error: null,
  };
}

// -- Community Leaders --
export async function getCommunityLeaders() {
  if (isLive) {
    const { data, error } = await supabase
      .from('community_leaders')
      .select('*')
      .eq('is_active', true)
      .order('name');

    return { data: data || [], error: error?.message };
  }

  await delay(300);
  return {
    data: [
      { id: 1, name: 'Cllr. Kgomotso Mokgatlhe', role: 'Ward Councillor', ward: 'Ward 1 — Central Mahikeng', phone: '018 381 8200', email: 'kmokgatlhe@mahikeng.gov.za', area: 'CBD, Station Road area', available: 'Mon-Fri 8:00-16:30', category: 'municipality' },
      { id: 2, name: 'Cllr. Thapelo Modise', role: 'Ward Councillor', ward: 'Ward 3 — Riviera Park', phone: '018 381 8201', email: 'tmodise@mahikeng.gov.za', area: 'Riviera Park, Extension 1-4', available: 'Mon-Fri 8:00-16:30', category: 'municipality' },
      { id: 3, name: 'Cllr. Mmathapelo Tau', role: 'Ward Councillor', ward: 'Ward 5 — Montshiwa', phone: '018 381 8202', email: 'mtau@mahikeng.gov.za', area: 'Montshiwa, Blikkiesdorp', available: 'Mon-Fri 8:00-16:30', category: 'municipality' },
      { id: 4, name: 'Cllr. Boitumelo Moiloa', role: 'Ward Councillor', ward: 'Ward 7 — Mmabatho', phone: '018 381 8203', email: 'bmoiloa@mahikeng.gov.za', area: 'Mmabatho, Unit 1-7', available: 'Mon-Fri 8:00-16:30', category: 'municipality' },
      { id: 5, name: 'Mr. Patrick Molefe', role: 'CPF Chairperson', ward: 'Mahikeng Central CPF', phone: '082 456 7890', email: null, area: 'Greater Mahikeng Central', available: 'Available evenings', category: 'cpf' },
      { id: 6, name: 'Mrs. Dorah Kganakga', role: 'CPF Deputy Chair', ward: 'Mahikeng Central CPF', phone: '076 234 5678', email: null, area: 'Greater Mahikeng Central', available: 'Available weekends', category: 'cpf' },
      { id: 7, name: 'Mr. Johannes Mokoena', role: 'Community Safety Forum Chair', ward: 'Riviera Park Safety Forum', phone: '083 678 9012', email: null, area: 'Riviera Park & Extensions', available: 'Tue-Thu evenings', category: 'safety_forum' },
      { id: 8, name: 'Mr. Thuso Mogwe', role: 'Patrol Group Leader', ward: 'Montshiwa Night Patrol', phone: '079 876 5432', email: null, area: 'Montshiwa Township', available: 'Night shifts 20:00-04:00', category: 'patrol' },
      { id: 9, name: 'Mrs. Kelebogile Nkosi', role: 'Community Development Worker', ward: 'Ward 2', phone: '018 381 8210', email: 'knkosi@mahikeng.gov.za', area: 'Ward 2 service delivery', available: 'Mon-Fri 8:00-16:30', category: 'municipality' },
      { id: 10, name: 'Mr. Tshepo Mabena', role: 'Youth Safety Forum Lead', ward: 'Mahikeng Youth Safety', phone: '071 234 5678', email: null, area: 'Mahikeng-wide youth programs', available: 'Sat 10:00-14:00', category: 'safety_forum' },
    ],
    error: null,
  };
}

// -- Photo Upload --
export async function uploadPhoto(file, path) {
  if (isLive) {
    const filePath = `reports/${path}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('report-photos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) return { data: null, error: error.message };

    const { data: urlData } = supabase.storage
      .from('report-photos')
      .getPublicUrl(data.path);

    return { data: { url: urlData.publicUrl, path: data.path }, error: null };
  }

  // Mock mode — return a data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ data: { url: reader.result, path: `mock/${Date.now()}` }, error: null });
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
