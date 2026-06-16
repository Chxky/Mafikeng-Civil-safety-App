// eslint-disable-next-line no-unused-vars
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createOrGetToken,
  submitReport,
  getCivicReports,
  getReportById,
  updateReportStatus,
  submitIncident,
  getSafetyIncidents,
  confirmIncident,
  // eslint-disable-next-line no-unused-vars
  removeIncident,
  createSOSAlert,
  // eslint-disable-next-line no-unused-vars
  updateSOSAlert,
  getDashboardStats,
  processSMSReport,
  getSMSReports,
} from '../db/mockApi';

describe('createOrGetToken', () => {
  it('creates a new user token', async () => {
    const { data, error } = await createOrGetToken('test-token-abc');
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.token).toBe('test-token-abc');
    expect(data.display_name).toBe('Community Member');
  });

  it('returns existing user for same token', async () => {
    const { data: first } = await createOrGetToken('test-token-xyz');
    const { data: second } = await createOrGetToken('test-token-xyz');
    expect(first.id).toBe(second.id);
  });
});

describe('submitReport', () => {
  it('creates a civic report', async () => {
    const { data, error } = await submitReport({
      category: 'pothole',
      title: 'Test pothole',
      description: 'Big hole',
      latitude: -25.865,
      longitude: 25.644,
      address: '123 Test St',
      urgency: 'normal',
    });

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.category).toBe('pothole');
    expect(data.status).toBe('pending');
  });
});

describe('getCivicReports', () => {
  it('returns seeded reports', async () => {
    const { data, error } = await getCivicReports();
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it('filters by status', async () => {
    const { data } = await getCivicReports({ status: 'pending' });
    data.forEach(r => expect(r.status).toBe('pending'));
  });

  it('filters by category', async () => {
    const { data } = await getCivicReports({ category: 'pothole' });
    data.forEach(r => expect(r.category).toBe('pothole'));
  });
});

describe('getReportById', () => {
  it('returns a specific report', async () => {
    const { data: all } = await getCivicReports();
    const target = all[0];
    const { data, error } = await getReportById(target.id);
    expect(error).toBeNull();
    expect(data.id).toBe(target.id);
  });

  it('returns null for nonexistent id', async () => {
    // eslint-disable-next-line no-unused-vars
    const { data, error } = await getReportById('nonexistent-id');
    expect(data).toBeNull();
  });
});

describe('updateReportStatus', () => {
  it('updates report status', async () => {
    const { data: all } = await getCivicReports();
    const report = all.find(r => r.status === 'pending');
    if (!report) return; // skip if no pending reports in seed

    const { data, error } = await updateReportStatus(report.id, 'acknowledged', 'We got it');
    expect(error).toBeNull();
    expect(data.status).toBe('acknowledged');
    expect(data.municipality_response).toBe('We got it');
  });
});

describe('submitIncident', () => {
  it('creates a safety incident', async () => {
    const { data, error } = await submitIncident({
      incident_type: 'theft',
      description: 'Test incident',
      latitude: -25.865,
      longitude: 25.644,
    });

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.incident_type).toBe('theft');
    expect(data.confirmations).toBe(0);
  });
});

describe('getSafetyIncidents', () => {
  it('returns seeded incidents', async () => {
    const { data, error } = await getSafetyIncidents();
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it('excludes removed incidents', async () => {
    const { data } = await getSafetyIncidents();
    data.forEach(i => expect(i.is_removed).toBe(false));
  });
});

describe('confirmIncident', () => {
  it('confirms an incident', async () => {
    const { data: incidents } = await getSafetyIncidents();
    const incident = incidents[0];

    const { data, error } = await confirmIncident(incident.id, 'user-123', 'confirm');
    expect(error).toBeNull();
    expect(data.success).toBe(true);
  });

  it('prevents double confirmation', async () => {
    const { data: incidents } = await getSafetyIncidents();
    const incident = incidents[0];

    // First confirmation already done above
    const { error } = await confirmIncident(incident.id, 'user-123', 'confirm');
    expect(error).toBe('Already confirmed');
  });
});

describe('createSOSAlert', () => {
  it('creates an SOS alert', async () => {
    const { data, error } = await createSOSAlert({
      latitude: -25.865,
      longitude: 25.644,
      alert_type: 'panic',
    });

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.status).toBe('active');
  });
});

describe('getDashboardStats', () => {
  it('returns dashboard statistics', async () => {
    const { data, error } = await getDashboardStats();
    expect(error).toBeNull();
    expect(data).toHaveProperty('totalReports');
    expect(data).toHaveProperty('byStatus');
    expect(data).toHaveProperty('resolutionRate');
    expect(data).toHaveProperty('totalIncidents');
    expect(data.totalReports).toBeGreaterThan(0);
  });
});

describe('processSMSReport', () => {
  it('processes a #REPORT SMS', async () => {
    const { data, error } = await processSMSReport('hash-123', '#REPORT pothole on Main Road at Station Road');
    expect(error).toBeNull();
    expect(data.processed).toBe(true);
    expect(data.parsed_category).toBe('pothole');
  });

  it('processes a #SOS SMS', async () => {
    const { data, error } = await processSMSReport('hash-456', '#SOS');
    expect(error).toBeNull();
    expect(data.processed).toBe(true);
  });

  it('handles unparseable messages', async () => {
    const { data, error } = await processSMSReport('hash-789', 'hello world');
    expect(error).toBeNull();
    expect(data.processed).toBe(false);
  });
});

describe('getSMSReports', () => {
  it('returns SMS reports', async () => {
    const { data, error } = await getSMSReports();
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
