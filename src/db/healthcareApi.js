import { supabase, isLive } from './supabase';
import { uuid, delay } from '../utils/helpers';

let facilities = [];
let facilityReports = [];
let appointmentReminders = [];

export async function getHealthcareFacilities(filters = {}) {
  if (isLive) {
    let query = supabase.from('healthcare_facilities').select('*').eq('is_active', true);
    if (filters.type) query = query.eq('facility_type', filters.type);
    const { data, error } = await query.order('name');
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = [...facilities];
  if (filters.type) result = result.filter(f => f.facility_type === filters.type);
  return { data: result, error: null };
}

export async function submitFacilityReport(report) {
  if (isLive) {
    const { data, error } = await supabase.from('facility_reports').insert(report).select().single();
    return { data, error: error?.message };
  }
  await delay(300);
  const newReport = { id: uuid(), ...report, created_at: new Date().toISOString() };
  facilityReports.push(newReport);
  return { data: newReport, error: null };
}

export async function createAppointmentReminder(reminder) {
  if (isLive) {
    const { data, error } = await supabase.from('appointment_reminders').insert(reminder).select().single();
    return { data, error: error?.message };
  }
  await delay(200);
  const newReminder = { id: uuid(), ...reminder, is_reminded: false, created_at: new Date().toISOString() };
  appointmentReminders.push(newReminder);
  return { data: newReminder, error: null };
}

export async function getAppointmentReminders(userToken) {
  if (isLive) {
    const { data, error } = await supabase.from('appointment_reminders').select('*, healthcare_facilities(*)').eq('user_token', userToken).order('appointment_date', { ascending: true });
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  const result = appointmentReminders.filter(r => r.user_token === userToken);
  return { data: result, error: null };
}

export async function updateFacilityWaitTime(facilityId, minutes) {
  if (isLive) {
    const { data, error } = await supabase.from('healthcare_facilities').update({ queue_wait_minutes: minutes, queue_updated_at: new Date().toISOString() }).eq('id', facilityId).select().single();
    return { data, error: error?.message };
  }
  await delay(200);
  const idx = facilities.findIndex(f => f.id === facilityId);
  if (idx === -1) return { data: null, error: 'Not found' };
  facilities[idx].queue_wait_minutes = minutes;
  facilities[idx].queue_updated_at = new Date().toISOString();
  return { data: facilities[idx], error: null };
}

export function seedHealthcareData() {
  facilityReports = [];
  appointmentReminders = [];
  facilities = [
    { id: uuid(), name: 'Mahikeng Provincial Hospital', facility_type: 'hospital', phone: '018 381 8400', address: '1 Hospital Road, Mahikeng', latitude: -25.8640, longitude: 25.6410, hours: '24 hours', services: ['emergency', 'outpatient', 'maternity', 'pharmacy'], queue_wait_minutes: 45, queue_updated_at: new Date().toISOString(), has_medicine: true, medicine_updated_at: new Date().toISOString(), is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Montshiwa Clinic', facility_type: 'clinic', phone: '018 381 8410', address: '123 Montshiwa Township, Mahikeng', latitude: -25.8580, longitude: 25.6520, hours: '07:00-18:00 weekdays', services: ['primary_care', 'immunisation', 'family_planning'], queue_wait_minutes: 90, queue_updated_at: new Date().toISOString(), has_medicine: true, medicine_updated_at: new Date(Date.now() - 86400000).toISOString(), is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Riviera Park Community Health Centre', facility_type: 'community_health_centre', phone: '018 381 8420', address: '15 Buffalo Road, Riviera Park', latitude: -25.8700, longitude: 25.6340, hours: '07:00-20:00 daily', services: ['primary_care', 'maternity', 'hiv_care', 'tb_treatment'], queue_wait_minutes: 60, queue_updated_at: new Date().toISOString(), has_medicine: false, medicine_updated_at: new Date(Date.now() - 604800000).toISOString(), is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Mmabatho Pharmacy', facility_type: 'pharmacy', phone: '018 381 8430', address: '22 Nelson Mandela Drive, Mmabatho', latitude: -25.8500, longitude: 25.6380, hours: '08:00-19:00 weekdays, 09:00-14:00 Sat', services: ['dispensing', 'over_the_counter', 'health_advice'], queue_wait_minutes: 15, queue_updated_at: new Date().toISOString(), has_medicine: true, medicine_updated_at: new Date().toISOString(), is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), name: 'Dr. Mogwe Private Practice', facility_type: 'private_practice', phone: '018 381 8440', address: '5 Church Street, Mahikeng CBD', latitude: -25.8620, longitude: 25.6430, hours: '08:00-17:00 weekdays', services: ['general_practice', 'paediatrics', 'minor_surgery'], queue_wait_minutes: 30, queue_updated_at: new Date().toISOString(), has_medicine: true, medicine_updated_at: new Date().toISOString(), is_active: true, created_at: new Date().toISOString() },
  ];
}

seedHealthcareData();
