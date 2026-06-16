import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMonitoringPoints,
  getWaterQualityReadings,
  getLatestReadings,
  submitWaterIssue,
  seedWaterData,
} from '../db/waterQualityApi';

beforeEach(() => {
  seedWaterData();
});

describe('getMonitoringPoints', () => {
  it('returns all monitoring points', async () => {
    const { data, error } = await getMonitoringPoints();
    expect(error).toBeNull();
    expect(data.length).toBe(5);
  });

  it('each point has required fields', async () => {
    const { data } = await getMonitoringPoints();
    data.forEach(point => {
      expect(point).toHaveProperty('id');
      expect(point).toHaveProperty('name');
      expect(point).toHaveProperty('point_type');
      expect(point).toHaveProperty('latitude');
      expect(point).toHaveProperty('longitude');
    });
  });

  it('includes treatment plant, river, reservoir, and tap types', async () => {
    const { data } = await getMonitoringPoints();
    const types = data.map(p => p.point_type);
    expect(types).toContain('treatment_plant');
    expect(types).toContain('river');
    expect(types).toContain('reservoir');
    expect(types).toContain('tap');
  });
});

describe('getWaterQualityReadings', () => {
  it('returns readings for a specific point', async () => {
    const { data: points } = await getMonitoringPoints();
    const point = points[0];

    const { data, error } = await getWaterQualityReadings(point.id);
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].monitoring_point_id).toBe(point.id);
  });

  it('returns at most 20 readings', async () => {
    const { data: points } = await getMonitoringPoints();
    const { data } = await getWaterQualityReadings(points[0].id);
    expect(data.length).toBeLessThanOrEqual(20);
  });

  it('returns readings sorted by time descending', async () => {
    const { data: points } = await getMonitoringPoints();
    const { data } = await getWaterQualityReadings(points[0].id);
    for (let i = 1; i < data.length; i++) {
      expect(new Date(data[i - 1].reading_time).getTime())
        .toBeGreaterThanOrEqual(new Date(data[i].reading_time).getTime());
    }
  });

  it('returns empty array for nonexistent point', async () => {
    const { data } = await getWaterQualityReadings('nonexistent');
    expect(data).toEqual([]);
  });

  it('includes expected quality fields', async () => {
    const { data: points } = await getMonitoringPoints();
    const { data } = await getWaterQualityReadings(points[0].id);
    expect(data[0]).toHaveProperty('ph_level');
    expect(data[0]).toHaveProperty('turbidity_ntu');
    expect(data[0]).toHaveProperty('e_coli_per_100ml');
    expect(data[0]).toHaveProperty('chlorine_mg_per_l');
    expect(data[0]).toHaveProperty('is_safe');
  });
});

describe('getLatestReadings', () => {
  it('returns one reading per monitoring point', async () => {
    const { data, error } = await getLatestReadings();
    expect(error).toBeNull();
    expect(data.length).toBe(5);
  });

  it('each reading has latest data', async () => {
    const { data } = await getLatestReadings();
    data.forEach(r => {
      expect(r).toHaveProperty('ph_level');
      expect(r).toHaveProperty('is_safe');
    });
  });
});

describe('submitWaterIssue', () => {
  it('creates a water issue report', async () => {
    const { data, error } = await submitWaterIssue({
      user_token: 'user-1',
      issue_type: 'discoloured_water',
      description: 'Brown water coming from tap',
      latitude: -25.865,
      longitude: 25.644,
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.issue_type).toBe('discoloured_water');
    expect(data.status).toBe('pending');
    expect(data).toHaveProperty('created_at');
  });

  it('handles all issue types', async () => {
    const types = ['discoloured_water', 'no_water', 'bad_taste', 'bad_smell', 'other'];
    for (const issue_type of types) {
      const { data, error } = await submitWaterIssue({
        user_token: 'user-1',
        issue_type,
        description: `Test ${issue_type}`,
        latitude: -25.865,
        longitude: 25.644,
      });
      expect(error).toBeNull();
      expect(data.issue_type).toBe(issue_type);
    }
  });
});
