// Mock API simulating Supabase backend
// In production, replace with actual Supabase client

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate UUID
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ============================================================
// IN-MEMORY STORES
// ============================================================
let userTokens = [];
let civicReports = [];
let safetyIncidents = [];
let sosAlerts = [];
let incidentConfirmations = [];
let patrolGroups = [];
let patrolMessages = [];
let smsReports = [];

// Seed data
function seedData() {
  const categories = ['pothole', 'water_leak', 'sewage', 'streetlight', 'electricity', 'illegal_dumping'];
  const statuses = ['pending', 'acknowledged', 'in_progress', 'resolved'];
  const incidentTypes = ['suspicious_activity', 'theft', 'vandalism', 'break_in', 'drug_activity'];

  // Seed civic reports around Mahikeng
  const mahikengCenter = { lat: -25.8653, lng: 25.6441 };

  for (let i = 0; i < 25; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 60);

    civicReports.push({
      id: uuid(),
      user_token_id: uuid(),
      category,
      title: getCategoryTitle(category),
      description: getCategoryDescription(category),
      latitude: mahikengCenter.lat + (Math.random() - 0.5) * 0.04,
      longitude: mahikengCenter.lng + (Math.random() - 0.5) * 0.04,
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

  // Seed safety incidents
  for (let i = 0; i < 15; i++) {
    const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
    const daysAgo = Math.floor(Math.random() * 14);

    safetyIncidents.push({
      id: uuid(),
      user_token_id: uuid(),
      incident_type: type,
      description: getIncidentDescription(type),
      latitude: mahikengCenter.lat + (Math.random() - 0.5) * 0.04,
      longitude: mahikengCenter.lng + (Math.random() - 0.5) * 0.04,
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
    pothole: 'Deep pothole approximately 50cm wide causing damage to vehicles. Multiple cars have been affected.',
    water_leak: 'Clean water leaking from underground pipe. Water pooling on road surface and wasting resources.',
    sewage: 'Raw sewage overflowing from manhole cover. Foul smell and health hazard for nearby residents.',
    streetlight: 'Streetlight has been non-functional for over 3 weeks. Area is very dark at night, creating safety concerns.',
    electricity: 'Complete power outage affecting multiple households. No communication from Eskom about restoration.',
    illegal_dumping: 'Construction rubble and household waste dumped on vacant lot. Attracting rats and creating health hazard.',
  };
  return descs[cat] || 'Issue reported by community member';
}

function getIncidentDescription(type) {
  const descs = {
    suspicious_activity: 'Suspicious individuals observed loitering near residences late at night. They fled when approached.',
    theft: 'House break-in reported. Entry through back window. Electronics and jewelry stolen.',
    vandalism: 'Graffiti and property damage to community center walls. Windows also broken.',
    break_in: 'Attempted break-in at local business. Security gate damaged but entry was prevented.',
    drug_activity: 'Suspected drug dealing observed at park. Regular activity at same location daily.',
  };
  return descs[type] || 'Incident reported by community member';
}

function getRandomAddress() {
  const streets = [
    'Station Road', 'Main Road', 'Church Street', 'Buffalo Road',
    ' Sekame Street', 'First Avenue', 'Second Avenue', 'Nelson Mandela Drive',
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

// Initialize seed data
seedData();

// ============================================================
// API METHODS
// ============================================================

// -- User Tokens --
export async function createOrGetToken(token) {
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
  await delay(500);
  const newReport = {
    id: uuid(),
    ...report,
    status: 'pending',
    municipality_response: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  civicReports.unshift(newReport);
  return { data: newReport, error: null };
}

export async function getCivicReports(filters = {}) {
  await delay(300);
  let results = [...civicReports];

  if (filters.status) {
    results = results.filter(r => r.status === filters.status);
  }
  if (filters.category) {
    results = results.filter(r => r.category === filters.category);
  }
  if (filters.userTokenId) {
    results = results.filter(r => r.user_token_id === filters.userTokenId);
  }

  // Sort by newest first
  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return { data: results, error: null };
}

export async function getReportById(id) {
  await delay(200);
  const report = civicReports.find(r => r.id === id);
  return { data: report || null, error: report ? null : 'Not found' };
}

export async function updateReportStatus(id, status, response) {
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
  await delay(300);
  let results = safetyIncidents.filter(i => !i.is_removed);

  if (filters.incidentType) {
    results = results.filter(i => i.incident_type === filters.incidentType);
  }

  results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: results, error: null };
}

export async function confirmIncident(incidentId, userId, type) {
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
  await delay(200);
  const idx = sosAlerts.findIndex(a => a.id === id);
  if (idx === -1) return { data: null, error: 'Not found' };

  sosAlerts[idx] = { ...sosAlerts[idx], ...updates };
  return { data: sosAlerts[idx], error: null };
}

// -- Dashboard Stats --
export async function getDashboardStats() {
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
    if (!byCategory[r.category]) {
      byCategory[r.category] = { total: 0, resolved: 0 };
    }
    byCategory[r.category].total++;
    if (r.status === 'resolved') byCategory[r.category].resolved++;
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
      avgResolutionDays: avgResolutionDays.toFixed(1),
      totalIncidents: safetyIncidents.filter(i => !i.is_removed).length,
      activeAlerts: sosAlerts.filter(a => a.status === 'active').length,
    },
    error: null,
  };
}

// -- SMS/USSD Processing --
export async function processSMSReport(phoneHash, message) {
  await delay(300);

  // Parse SMS format: #REPORT <description> at <address>
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

    // Auto-categorize based on keywords
    let category = 'other';
    const desc = description.toLowerCase();
    if (desc.includes('pothole') || desc.includes('road')) category = 'pothole';
    else if (desc.includes('water') || desc.includes('leak') || desc.includes('pipe')) category = 'water_leak';
    else if (desc.includes('sewage') || desc.includes('sewer') || desc.includes('toilet')) category = 'sewage';
    else if (desc.includes('light') || desc.includes('lamp')) category = 'streetlight';
    else if (desc.includes('electric') || desc.includes('power') || desc.includes('eskom')) category = 'electricity';
    else if (desc.includes('dump') || desc.includes('rubbish') || desc.includes('waste')) category = 'illegal_dumping';

    // Create civic report
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
    const alert = await createSOSAlert({
      user_token_id: null,
      latitude: -25.8653,
      longitude: 25.6441,
      alert_type: 'panic',
    });

    smsRecord.processed = true;
  }

  smsReports.push(smsRecord);
  return { data: smsRecord, error: null };
}

export async function getSMSReports() {
  await delay(200);
  return { data: smsReports, error: null };
}
