import { supabase } from './supabase';

export async function getBusinessListings(filters = {}) {
  let query = supabase.from('business_listings').select('*').eq('is_active', true);
  if (filters.category) query = query.eq('category', filters.category);
  query = query.order('is_verified', { ascending: false }).order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function createBusinessListing(listing) {
  const { data, error } = await supabase.from('business_listings').insert(listing).select().single();
  return { data, error: error?.message };
}

export async function getClassifiedListings(filters = {}) {
  let query = supabase.from('classified_listings').select('*').eq('is_active', true);
  if (filters.type) query = query.eq('listing_type', filters.type);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function createClassifiedListing(listing) {
  const { data, error } = await supabase.from('classified_listings').insert(listing).select().single();
  return { data, error: error?.message };
}
