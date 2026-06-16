import { supabase, isLive } from './supabase';
import { uuid, delay } from '../utils/helpers';

let jobListings = [];
let savedListings = [];
let jobAlerts = [];

export async function getJobListings(filters = {}) {
  if (isLive) {
    let query = supabase.from('job_listings').select('*').eq('is_active', true);
    if (filters.type) query = query.eq('listing_type', filters.type);
    if (filters.department) query = query.eq('department', filters.department);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(300);
  let result = jobListings.filter(j => j.is_active);
  if (filters.type) result = result.filter(j => j.listing_type === filters.type);
  if (filters.department) result = result.filter(j => j.department === filters.department);
  return { data: result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
}

export async function getSavedListings(userToken) {
  if (isLive) {
    const { data, error } = await supabase.from('saved_listings').select('*, job_listings(*)').eq('user_token', userToken);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  const saved = savedListings.filter(s => s.user_token === userToken);
  const result = saved.map(s => ({ ...s, job_listings: jobListings.find(j => j.id === s.listing_id) }));
  return { data: result, error: null };
}

export async function toggleSavedListing(userToken, listingId) {
  if (isLive) {
    const { data: existing } = await supabase.from('saved_listings').select('id').eq('user_token', userToken).eq('listing_id', listingId).single();
    if (existing) {
      await supabase.from('saved_listings').delete().eq('id', existing.id);
      return { data: { saved: false }, error: null };
    }
    await supabase.from('saved_listings').insert({ user_token: userToken, listing_id: listingId });
    return { data: { saved: true }, error: null };
  }
  await delay(200);
  const idx = savedListings.findIndex(s => s.user_token === userToken && s.listing_id === listingId);
  if (idx >= 0) {
    savedListings.splice(idx, 1);
    return { data: { saved: false }, error: null };
  }
  savedListings.push({ id: uuid(), user_token: userToken, listing_id: listingId, created_at: new Date().toISOString() });
  return { data: { saved: true }, error: null };
}

export async function createJobAlert(alert) {
  if (isLive) {
    const { data, error } = await supabase.from('job_alerts').insert(alert).select().single();
    return { data, error: error?.message };
  }
  await delay(200);
  const newAlert = { id: uuid(), ...alert, is_active: true, created_at: new Date().toISOString() };
  jobAlerts.push(newAlert);
  return { data: newAlert, error: null };
}

export async function getJobAlerts(userToken) {
  if (isLive) {
    const { data, error } = await supabase.from('job_alerts').select('*').eq('user_token', userToken);
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  return { data: jobAlerts.filter(a => a.user_token === userToken), error: null };
}

export function seedJobsData() {
  savedListings = [];
  jobAlerts = [];
  jobListings = [
    { id: uuid(), title: 'Senior Administrative Officer', department: 'community', listing_type: 'job', description: 'The Municipality of Mahikeng seeks a Senior Administrative Officer to manage day-to-day administrative operations at the Civic Centre. Key responsibilities include records management, committee support, and public liaison.', requirements: 'Grade 12 + 3 years admin experience. Diploma in Public Administration preferred.', location: 'Mahikeng Civic Centre', salary_range: 'R257,000 — R345,000 p.a.', closing_date: new Date(Date.now() + 21 * 86400000).toISOString(), contact_email: 'hr@mahikeng.gov.za', contact_phone: '018 381 8500', is_active: true, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: uuid(), title: 'Civil Engineer — Roads & Stormwater', department: 'roads', listing_type: 'job', description: 'Professional Civil Engineer required for the Roads & Stormwater department. Will oversee road maintenance projects, stormwater drainage upgrades, and new infrastructure developments.', requirements: 'BEng/BSc Civil Engineering + ECSA registration. 5+ years municipal experience preferred.', location: 'Mahikeng', salary_range: 'R800,000 — R1,100,000 p.a.', closing_date: new Date(Date.now() + 30 * 86400000).toISOString(), contact_email: 'roads@mahikeng.gov.za', contact_phone: '018 381 8200', is_active: true, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: uuid(), title: 'Tender: Supply of Office Furniture', department: 'community', listing_type: 'tender', description: 'Tender for the supply and delivery of office furniture to various municipal departments. Includes desks, chairs, filing cabinets, and meeting room furniture.', requirements: 'Valid tax clearance, BBBEE certificate, proof of similar contracts completed in last 3 years.', location: 'Mahikeng', salary_range: 'R500,000 — R750,000', closing_date: new Date(Date.now() + 14 * 86400000).toISOString(), contact_email: 'supplychain@mahikeng.gov.za', contact_phone: '018 381 8510', is_active: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: uuid(), title: 'Environmental Health Practitioner', department: 'waste', listing_type: 'job', description: 'Environmental Health Practitioner to join the Waste Management department. Responsible for waste compliance inspections, illegal dumping enforcement, and public health education.', requirements: 'BSc Environmental Health + HPCSA registration. Valid drivers license.', location: 'Mahikeng', salary_range: 'R350,000 — R520,000 p.a.', closing_date: new Date(Date.now() + 28 * 86400000).toISOString(), contact_email: 'waste@mahikeng.gov.za', contact_phone: '018 381 8330', is_active: true, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: uuid(), title: 'Tender: Road Resealing — Various Streets', department: 'roads', listing_type: 'tender', description: 'Tender for the resealing of approximately 12km of municipal roads across Wards 1, 3, and 5. Includes crack sealing, surface dressing, and line marking.', requirements: 'CIDB grading 7CE or higher. 10+ years relevant experience.', location: 'Mahikeng', salary_range: 'R5,000,000 — R8,000,000', closing_date: new Date(Date.now() + 45 * 86400000).toISOString(), contact_email: 'roads@mahikeng.gov.za', contact_phone: '018 381 8200', is_active: true, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: uuid(), title: 'Water Services Technician', department: 'water', listing_type: 'job', description: 'Technician needed for the Water Services department to assist with water quality monitoring, pump station maintenance, and leak detection.', requirements: 'National Diploma in Water Care or Civil Engineering. 3+ years water services experience.', location: 'Mahikeng', salary_range: 'R280,000 — R420,000 p.a.', closing_date: new Date(Date.now() + 21 * 86400000).toISOString(), contact_email: 'water@mahikeng.gov.za', contact_phone: '018 381 8300', is_active: true, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: uuid(), title: 'Tender: Streetlight Maintenance & Repairs', department: 'electricity', listing_type: 'tender', description: 'Annual contract for the maintenance and repair of streetlights across the Mahikeng municipal area. Includes lamp replacement, pole repairs, and electrical fault finding.', requirements: 'Electrical contractor with valid registration. 5+ years experience in streetlight maintenance.', location: 'Mahikeng', salary_range: 'R1,200,000 — R2,000,000', closing_date: new Date(Date.now() + 20 * 86400000).toISOString(), contact_email: 'electricity@mahikeng.gov.za', contact_phone: '018 381 8320', is_active: true, created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
  ];
}

seedJobsData();
