import { supabase } from './supabase';

export async function getHealthcareFacilities(filters = {}) {
  let query = supabase.from('healthcare_facilities').select('*').eq('is_active', true);
  if (filters.type) query = query.eq('facility_type', filters.type);
  const { data, error } = await query.order('name');
  return { data: data || [], error: error?.message };
}

export async function submitFacilityReport(report) {
  const { data, error } = await supabase.from('facility_reports').insert(report).select().single();
  return { data, error: error?.message };
}

export async function createAppointmentReminder(reminder) {
  const { data, error } = await supabase.from('appointment_reminders').insert(reminder).select().single();
  return { data, error: error?.message };
}

export async function getAppointmentReminders(userToken) {
  const { data, error } = await supabase.from('appointment_reminders').select('*, healthcare_facilities(*)').eq('user_token', userToken).order('appointment_date', { ascending: true });
  return { data: data || [], error: error?.message };
}

export async function updateFacilityWaitTime(facilityId, minutes) {
  const { data, error } = await supabase.from('healthcare_facilities').update({ queue_wait_minutes: minutes, queue_updated_at: new Date().toISOString() }).eq('id', facilityId).select().single();
  return { data, error: error?.message };
}
