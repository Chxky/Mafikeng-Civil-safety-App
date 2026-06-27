import { supabase } from './supabase';

export async function getJobListings(filters = {}) {
  let query = supabase.from('job_listings').select('*').eq('is_active', true);
  if (filters.type) query = query.eq('listing_type', filters.type);
  if (filters.department) query = query.eq('department', filters.department);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function getSavedListings(userToken) {
  const { data, error } = await supabase.from('saved_listings').select('*, job_listings(*)').eq('user_token', userToken);
  return { data: data || [], error: error?.message };
}

export async function toggleSavedListing(userToken, listingId) {
  const { data: existing } = await supabase.from('saved_listings').select('id').eq('user_token', userToken).eq('listing_id', listingId).single();
  if (existing) {
    await supabase.from('saved_listings').delete().eq('id', existing.id);
    return { data: { saved: false }, error: null };
  }
  await supabase.from('saved_listings').insert({ user_token: userToken, listing_id: listingId });
  return { data: { saved: true }, error: null };
}

export async function createJobAlert(alert) {
  const { data, error } = await supabase.from('job_alerts').insert(alert).select().single();
  return { data, error: error?.message };
}

export async function getJobAlerts(userToken) {
  const { data, error } = await supabase.from('job_alerts').select('*').eq('user_token', userToken);
  return { data: data || [], error: error?.message };
}
