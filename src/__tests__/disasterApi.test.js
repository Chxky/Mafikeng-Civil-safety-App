import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWeatherWarnings,
  getWarningHistory,
  submitDisasterReport,
  getDisasterReports,
  updateSafetyStatus,
  getSafetyStatuses,
  registerVolunteer,
  getVolunteers,
  deployVolunteer,
  getResilienceResources,
  submitFirebreakReport,
  getMunicipalAlerts,
  seedDisasterData,
} from '../db/disasterApi';

beforeEach(() => {
  seedDisasterData();
});

describe('getWeatherWarnings', () => {
  it('returns active weather warnings', async () => {
    const { data, error } = await getWeatherWarnings();
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it('each warning has required fields', async () => {
    const { data } = await getWeatherWarnings();
    data.forEach(w => {
      expect(w).toHaveProperty('id');
      expect(w).toHaveProperty('event_type');
      expect(w).toHaveProperty('severity');
      expect(w).toHaveProperty('description');
      expect(w).toHaveProperty('affected_areas');
    });
  });
});

describe('getWarningHistory', () => {
  it('returns warnings from last 30 days', async () => {
    const { data, error } = await getWarningHistory();
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('submitDisasterReport', () => {
  it('submits a disaster report', async () => {
    const { data, error } = await submitDisasterReport({
      disaster_type: 'flood',
      latitude: -25.865,
      longitude: 25.644,
      description: 'Flash flooding on Station Road',
      urgency_level: 'immediate_threat',
      needs_evacuation: false,
      user_token: 'user-1',
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.disaster_type).toBe('flood');
    expect(data.status).toBe('active');
    expect(data).toHaveProperty('created_at');
  });

  it('handles all disaster types', async () => {
    const types = ['flood', 'veld_fire', 'storm_damage', 'structural_collapse'];
    for (const disaster_type of types) {
      const { data, error } = await submitDisasterReport({
        disaster_type,
        latitude: -25.865,
        longitude: 25.644,
        description: `Test ${disaster_type}`,
        user_token: 'user-1',
      });
      expect(error).toBeNull();
      expect(data.disaster_type).toBe(disaster_type);
    }
  });
});

describe('getDisasterReports', () => {
  it('returns all disaster reports', async () => {
    const { data, error } = await getDisasterReports();
    expect(error).toBeNull();
    expect(data.length).toBe(5);
  });

  it('filters by type', async () => {
    const { data } = await getDisasterReports({ type: 'flood' });
    expect(data.length).toBe(2);
    data.forEach(r => expect(r.disaster_type).toBe('flood'));
  });

  it('filters by status', async () => {
    const { data } = await getDisasterReports({ status: 'assessed' });
    expect(data.length).toBe(1);
    expect(data[0].status).toBe('assessed');
  });

  it('returns results sorted by created_at descending', async () => {
    const { data } = await getDisasterReports();
    for (let i = 1; i < data.length; i++) {
      expect(new Date(data[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(data[i].created_at).getTime());
    }
  });
});

describe('updateSafetyStatus', () => {
  it('updates safety status', async () => {
    const { data, error } = await updateSafetyStatus('user-1', 'disaster-1', 'safe', -25.865, 25.644);
    expect(error).toBeNull();
    expect(data.status).toBe('safe');
    expect(data.user_token).toBe('user-1');
    expect(data.latitude).toBe(-25.865);
  });

  it('upserts duplicate entries', async () => {
    await updateSafetyStatus('user-1', 'disaster-1', 'safe', -25.865, 25.644);
    const { data } = await updateSafetyStatus('user-1', 'disaster-1', 'unknown', -25.870, 25.640);
    expect(data.status).toBe('unknown');
    expect(data.latitude).toBe(-25.870);
  });
});

describe('getSafetyStatuses', () => {
  it('returns statuses for a disaster', async () => {
    await updateSafetyStatus('user-1', 'disaster-1', 'safe', -25.865, 25.644);
    await updateSafetyStatus('user-2', 'disaster-1', 'unknown', -25.860, 25.640);

    const { data } = await getSafetyStatuses('disaster-1');
    expect(data.length).toBe(2);
  });
});

describe('registerVolunteer & getVolunteers', () => {
  it('registers a volunteer', async () => {
    const { data, error } = await registerVolunteer({
      user_token: 'volunteer-1',
      skills: ['first_aid', 'logistics'],
      location: 'CBD',
      contact_preference: 'push',
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.is_available).toBe(true);
    expect(data.skills).toEqual(['first_aid', 'logistics']);
  });

  it('gets all volunteers', async () => {
    const { data } = await getVolunteers();
    expect(data.length).toBeGreaterThanOrEqual(5);
  });

  it('filters available volunteers only', async () => {
    const { data } = await getVolunteers(true);
    data.forEach(v => expect(v.is_available).toBe(true));
  });
});

describe('deployVolunteer', () => {
  it('deploys a volunteer to a disaster', async () => {
    const { data: volunteers } = await getVolunteers();
    const volunteer = volunteers[0];
    const { data: disasters } = await getDisasterReports();
    const disaster = disasters[0];

    const { data, error } = await deployVolunteer(disaster.id, volunteer.id, 'Emergency zone A');
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.assigned_area).toBe('Emergency zone A');
    expect(data.status).toBe('deployed');
  });
});

describe('getResilienceResources', () => {
  it('returns all resources', async () => {
    const { data, error } = await getResilienceResources();
    expect(error).toBeNull();
    expect(data.length).toBe(8);
  });

  it('filters by category', async () => {
    const { data } = await getResilienceResources('flood_safety');
    expect(data.length).toBe(1);
    expect(data[0].category).toBe('flood_safety');
  });
});

describe('submitFirebreakReport', () => {
  it('submits a firebreak report', async () => {
    const { data, error } = await submitFirebreakReport({
      reported_by: 'user-1',
      location: 'Montshiwa',
      description: 'Firebreak maintained and clear',
      latitude: -25.855,
      longitude: 25.650,
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('reported_at');
  });
});

describe('getMunicipalAlerts', () => {
  it('returns active municipal alerts', async () => {
    const { data, error } = await getMunicipalAlerts();
    expect(error).toBeNull();
    expect(data.length).toBe(1);
    expect(data[0].alert_type).toBe('disaster');
    expect(data[0].is_active).toBe(true);
  });

  it('each alert has required fields', async () => {
    const { data } = await getMunicipalAlerts();
    data.forEach(a => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('title');
      expect(a).toHaveProperty('message');
      expect(a).toHaveProperty('severity');
    });
  });
});
