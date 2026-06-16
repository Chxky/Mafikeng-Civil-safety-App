import { describe, it, expect, beforeEach } from 'vitest';
import {
  getJobListings,
  getSavedListings,
  toggleSavedListing,
  createJobAlert,
  getJobAlerts,
  seedJobsData,
} from '../db/jobsApi';

beforeEach(() => {
  seedJobsData();
});

describe('getJobListings', () => {
  it('returns all active job listings', async () => {
    const { data, error } = await getJobListings();
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it('filters by listing type (job)', async () => {
    const { data } = await getJobListings({ type: 'job' });
    expect(data.length).toBeGreaterThan(0);
    data.forEach(j => expect(j.listing_type).toBe('job'));
  });

  it('filters by listing type (tender)', async () => {
    const { data } = await getJobListings({ type: 'tender' });
    expect(data.length).toBeGreaterThan(0);
    data.forEach(j => expect(j.listing_type).toBe('tender'));
  });

  it('filters by department', async () => {
    const { data } = await getJobListings({ department: 'roads' });
    expect(data.length).toBeGreaterThan(0);
    data.forEach(j => expect(j.department).toBe('roads'));
  });

  it('returns results sorted by created_at descending', async () => {
    const { data } = await getJobListings();
    for (let i = 1; i < data.length; i++) {
      expect(new Date(data[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(data[i].created_at).getTime());
    }
  });

  it('each listing has required fields', async () => {
    const { data } = await getJobListings();
    data.forEach(j => {
      expect(j).toHaveProperty('id');
      expect(j).toHaveProperty('title');
      expect(j).toHaveProperty('department');
      expect(j).toHaveProperty('listing_type');
      expect(j).toHaveProperty('closing_date');
    });
  });
});

describe('toggleSavedListing', () => {
  it('saves a listing', async () => {
    const { data: listings } = await getJobListings();
    const listing = listings[0];

    const { data, error } = await toggleSavedListing('user-1', listing.id);
    expect(error).toBeNull();
    expect(data.saved).toBe(true);
  });

  it('unsaves a previously saved listing', async () => {
    const { data: listings } = await getJobListings();
    const listing = listings[0];

    await toggleSavedListing('user-1', listing.id);
    const { data } = await toggleSavedListing('user-1', listing.id);
    expect(data.saved).toBe(false);
  });

  it('toggling is per-user', async () => {
    const { data: listings } = await getJobListings();
    const listing = listings[0];

    await toggleSavedListing('user-1', listing.id);
    const { data: user2Result } = await toggleSavedListing('user-2', listing.id);
    expect(user2Result.saved).toBe(true);
  });
});

describe('getSavedListings', () => {
  it('returns saved listings for a user', async () => {
    const { data: listings } = await getJobListings();
    await toggleSavedListing('user-1', listings[0].id);
    await toggleSavedListing('user-1', listings[1].id);

    const { data } = await getSavedListings('user-1');
    expect(data.length).toBe(2);
  });

  it('returns empty array for user with no saved listings', async () => {
    const { data } = await getSavedListings('nobody');
    expect(data).toEqual([]);
  });
});

describe('createJobAlert & getJobAlerts', () => {
  it('creates a job alert', async () => {
    const { data, error } = await createJobAlert({
      user_token: 'user-1',
      keywords: ['engineer', 'roads'],
      listing_type: 'job',
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.is_active).toBe(true);
    expect(data.keywords).toEqual(['engineer', 'roads']);
  });

  it('retrieves alerts for a user', async () => {
    await createJobAlert({ user_token: 'user-1', keywords: ['engineer'] });
    await createJobAlert({ user_token: 'user-1', keywords: ['tender'] });

    const { data } = await getJobAlerts('user-1');
    expect(data.length).toBe(2);
  });

  it('alerts are isolated per user', async () => {
    await createJobAlert({ user_token: 'user-1', keywords: ['engineer'] });

    const { data } = await getJobAlerts('user-2');
    expect(data).toEqual([]);
  });
});
