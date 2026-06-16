import { describe, it, expect, beforeEach } from 'vitest';
import {
  getHealthcareFacilities,
  submitFacilityReport,
  createAppointmentReminder,
  getAppointmentReminders,
  updateFacilityWaitTime,
  seedHealthcareData,
} from '../db/healthcareApi';

beforeEach(() => {
  seedHealthcareData();
});

describe('getHealthcareFacilities', () => {
  it('returns all facilities', async () => {
    const { data, error } = await getHealthcareFacilities();
    expect(error).toBeNull();
    expect(data.length).toBe(5);
  });

  it('filters by facility type', async () => {
    const { data } = await getHealthcareFacilities({ type: 'hospital' });
    expect(data.length).toBe(1);
    expect(data[0].facility_type).toBe('hospital');
  });

  it('filters by clinic type', async () => {
    const { data } = await getHealthcareFacilities({ type: 'clinic' });
    expect(data.length).toBe(1);
    expect(data[0].facility_type).toBe('clinic');
  });

  it('returns empty array for nonexistent type', async () => {
    const { data } = await getHealthcareFacilities({ type: 'nonexistent' });
    expect(data).toEqual([]);
  });
});

describe('submitFacilityReport', () => {
  it('creates a facility report', async () => {
    const { data, error } = await submitFacilityReport({
      facility_id: 'test-facility-id',
      report_type: 'no_medicine',
      description: 'No paracetamol available',
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.report_type).toBe('no_medicine');
    expect(data).toHaveProperty('created_at');
  });
});

describe('createAppointmentReminder', () => {
  it('creates a reminder', async () => {
    const { data, error } = await createAppointmentReminder({
      user_token: 'user-1',
      facility_id: 'facility-1',
      appointment_date: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Annual checkup',
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.is_reminded).toBe(false);
    expect(data.notes).toBe('Annual checkup');
  });
});

describe('getAppointmentReminders', () => {
  it('returns reminders for specific user', async () => {
    await createAppointmentReminder({
      user_token: 'user-1',
      facility_id: 'facility-1',
      appointment_date: new Date().toISOString(),
    });
    await createAppointmentReminder({
      user_token: 'user-2',
      facility_id: 'facility-2',
      appointment_date: new Date().toISOString(),
    });

    const { data } = await getAppointmentReminders('user-1');
    expect(data.length).toBe(1);
    expect(data[0].user_token).toBe('user-1');
  });
});

describe('updateFacilityWaitTime', () => {
  it('updates wait time for existing facility', async () => {
    const { data: facilities } = await getHealthcareFacilities();
    const facility = facilities[0];

    const { data, error } = await updateFacilityWaitTime(facility.id, 30);
    expect(error).toBeNull();
    expect(data.queue_wait_minutes).toBe(30);
    expect(data).toHaveProperty('queue_updated_at');
  });

  it('returns error for nonexistent facility', async () => {
    const { data, error } = await updateFacilityWaitTime('nonexistent', 30);
    expect(data).toBeNull();
    expect(error).toBe('Not found');
  });
});
