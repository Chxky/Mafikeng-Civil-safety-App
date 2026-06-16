import { supabase, isLive } from './supabase';
import { uuid, delay } from '../utils/helpers';

let documents = [];

export async function getMunicipalDocuments(filters = {}) {
  if (isLive) {
    let query = supabase.from('municipal_documents').select('*').eq('is_active', true);
    if (filters.type) query = query.eq('document_type', filters.type);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.search) query = query.textSearch('title', filters.search, { config: 'english' });
    query = query.order('year', { ascending: false }).order('title');
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = documents.filter(d => d.is_active);
  if (filters.type) result = result.filter(d => d.document_type === filters.type);
  if (filters.year) result = result.filter(d => d.year === filters.year);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(d => d.title.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q)));
  }
  return { data: result, error: null };
}

export async function getDocumentById(id) {
  if (isLive) {
    const { data, error } = await supabase.from('municipal_documents').select('*').eq('id', id).single();
    return { data: data || null, error: error?.message };
  }
  await delay(100);
  const doc = documents.find(d => d.id === id);
  return { data: doc || null, error: doc ? null : 'Not found' };
}

export function seedDocumentsData() {
  documents = [
    { id: uuid(), title: 'Integrated Development Plan (IDP) 2024-2027', document_type: 'idp', description: 'Three-year strategic plan outlining the municipality\'s development priorities, budget allocation, and service delivery targets for Mahikeng.', file_url: null, file_size_bytes: null, department: 'community', year: '2024', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: uuid(), title: 'Service Delivery & Budget Implementation Plan (SDBIP) 2025/26', document_type: 'sdbip', description: 'Detailed implementation plan linking the IDP to monthly budget expenditure and service delivery targets for the 2025/26 financial year.', file_url: null, file_size_bytes: null, department: 'community', year: '2025', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: uuid(), title: 'Annual Report 2023/24', document_type: 'annual_report', description: 'Annual performance report covering service delivery achievements, financial statements, audit outcomes, and community participation for FY 2023/24.', file_url: null, file_size_bytes: null, department: 'community', year: '2024', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 120 * 86400000).toISOString() },
    { id: uuid(), title: 'Budget 2025/26 — Approved', document_type: 'budget', description: 'Approved annual budget for the 2025/26 financial year including capital and operational expenditure across all municipal departments.', file_url: null, file_size_bytes: null, department: 'community', year: '2025', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
    { id: uuid(), title: 'Traffic & Parking By-Law', document_type: 'by_law', description: 'Municipal by-law regulating traffic, parking, and road usage within the Mahikeng municipal area. Includes penalty clauses and enforcement provisions.', file_url: null, file_size_bytes: null, department: 'roads', year: '2023', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 200 * 86400000).toISOString() },
    { id: uuid(), title: 'Waste Management By-Law', document_type: 'by_law', description: 'By-law governing waste collection, illegal dumping penalties, recycling requirements, and waste disposal within Mahikeng.', file_url: null, file_size_bytes: null, department: 'waste', year: '2023', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 190 * 86400000).toISOString() },
    { id: uuid(), title: 'Disaster Management Plan 2025', document_type: 'disaster_plan', description: 'Comprehensive disaster management framework aligned with the DMISA guidelines and EW4All roadmap. Covers flood, fire, drought, and pandemic response.', file_url: null, file_size_bytes: null, department: 'community', year: '2025', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: uuid(), title: 'Council Minutes — March 2025', document_type: 'council_minutes', description: 'Minutes of the ordinary council meeting held on 15 March 2025. Agenda items include budget approval, tender awards, and community resolutions.', file_url: null, file_size_bytes: null, department: 'community', year: '2025', is_offline_available: false, is_active: true, created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: uuid(), title: 'Water Services Development Plan', document_type: 'policy', description: 'Strategic plan for water services infrastructure, including bulk water supply, reticulation, water conservation, and demand management.', file_url: null, file_size_bytes: null, department: 'water', year: '2024', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
    { id: uuid(), title: 'Electricity Master Plan 2025-2030', document_type: 'policy', description: 'Long-term plan for electricity infrastructure, load shedding mitigation, renewable energy integration, and streetlight upgrades.', file_url: null, file_size_bytes: null, department: 'electricity', year: '2025', is_offline_available: true, is_active: true, created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  ];
}

seedDocumentsData();
