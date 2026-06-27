import { supabase } from './supabase';

export async function getMunicipalDocuments(filters = {}) {
  let query = supabase.from('municipal_documents').select('*').eq('is_active', true);
  if (filters.type) query = query.eq('document_type', filters.type);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.search) query = query.textSearch('title', filters.search, { config: 'english' });
  query = query.order('year', { ascending: false }).order('title');
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function getDocumentById(id) {
  const { data, error } = await supabase.from('municipal_documents').select('*').eq('id', id).single();
  return { data: data || null, error: error?.message };
}
