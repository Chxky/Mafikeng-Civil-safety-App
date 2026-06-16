import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerLearner,
  getLearners,
  getTransportRoutes,
  startTrip,
  updateTripStatus,
  getActiveTrips,
  getTripHistory,
  checkVehiclePermit,
  reportUnsafeTransport,
  reportStranded,
  getStrandedReports,
  seedTransportData,
} from '../db/transportApi';

beforeEach(() => {
  seedTransportData();
});

describe('getTransportRoutes', () => {
  it('returns all active routes', async () => {
    const { data, error } = await getTransportRoutes();
    expect(error).toBeNull();
    expect(data.length).toBe(3);
  });

  it('each route has required fields', async () => {
    const { data } = await getTransportRoutes();
    data.forEach(r => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('school');
      expect(r).toHaveProperty('vehicle_registration');
      expect(r).toHaveProperty('driver_name');
    });
  });
});

describe('registerLearner & getLearners', () => {
  it('registers a learner', async () => {
    const { data, error } = await registerLearner({
      parent_user_token: 'parent-1',
      full_name: 'Thabo Molefe',
      grade: '10',
      school: 'Mmabatho High School',
      route_id: null,
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.full_name).toBe('Thabo Molefe');
    expect(data.grade).toBe('10');
  });

  it('retrieves learners for a parent', async () => {
    await registerLearner({ parent_user_token: 'parent-1', full_name: 'Child A', grade: '5', school: 'School A', route_id: null });
    await registerLearner({ parent_user_token: 'parent-1', full_name: 'Child B', grade: '8', school: 'School B', route_id: null });

    const { data } = await getLearners('parent-1');
    expect(data.length).toBe(2);
  });

  it('learners are isolated per parent', async () => {
    await registerLearner({ parent_user_token: 'parent-1', full_name: 'Child A', grade: '5', school: 'School A', route_id: null });

    const { data } = await getLearners('parent-2');
    expect(data).toEqual([]);
  });
});

describe('startTrip', () => {
  it('starts a trip for a route', async () => {
    const { data: routes } = await getTransportRoutes();
    const route = routes[0];

    const { data, error } = await startTrip(route.id, 'driver-1');
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.route_id).toBe(route.id);
    expect(data.driver_user_token).toBe('driver-1');
    expect(data.status).toBe('in_progress');
    expect(data).toHaveProperty('started_at');
  });
});

describe('updateTripStatus', () => {
  it('marks a trip as arrived', async () => {
    const { data: routes } = await getTransportRoutes();
    const { data: trip } = await startTrip(routes[0].id, 'driver-1');

    const { data, error } = await updateTripStatus(trip.id, 'arrived');
    expect(error).toBeNull();
    expect(data.status).toBe('arrived');
    expect(data).toHaveProperty('completed_at');
  });

  it('returns error for nonexistent trip', async () => {
    const { data, error } = await updateTripStatus('nonexistent', 'arrived');
    expect(data).toBeNull();
    expect(error).toBe('Not found');
  });
});

describe('getActiveTrips', () => {
  it('returns in-progress and delayed trips', async () => {
    const { data } = await getActiveTrips();
    expect(data.length).toBeGreaterThan(0);
    data.forEach(t => {
      expect(['in_progress', 'delayed']).toContain(t.status);
    });
  });

  it('filters by route', async () => {
    const { data: routes } = await getTransportRoutes();
    const { data } = await getActiveTrips(routes[0].id);
    data.forEach(t => expect(t.route_id).toBe(routes[0].id));
  });
});

describe('getTripHistory', () => {
  it('returns trip history for a route', async () => {
    const { data: routes } = await getTransportRoutes();
    const { data } = await getTripHistory(routes[0].id);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('checkVehiclePermit', () => {
  it('returns permit for valid registration', async () => {
    const { data, error } = await checkVehiclePermit('NW 123 GP');
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.vehicle_registration).toBe('NW 123 GP');
    expect(data.permit_status).toBe('valid');
  });

  it('returns null for unknown registration', async () => {
    const { data } = await checkVehiclePermit('ZZ 000 ZZ');
    expect(data).toBeNull();
  });

  it('is case-insensitive', async () => {
    const { data } = await checkVehiclePermit('nw 123 gp');
    expect(data).not.toBeNull();
    expect(data.vehicle_registration).toBe('NW 123 GP');
  });
});

describe('reportUnsafeTransport', () => {
  it('reports unsafe transport', async () => {
    const { data, error } = await reportUnsafeTransport({
      vehicle_reg: 'NW 999 GP',
      description: 'Speeding and reckless driving',
      latitude: -25.865,
      longitude: 25.644,
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.title).toContain('NW 999 GP');
  });
});

describe('reportStranded & getStrandedReports', () => {
  it('reports a stranded learner', async () => {
    const { data: routes } = await getTransportRoutes();
    const { data, error } = await reportStranded(routes[0].id, 'parent-1');
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.route_id).toBe(routes[0].id);
    expect(data.parent_user_token).toBe('parent-1');
    expect(data.resolved_at).toBeNull();
  });

  it('returns active stranded reports', async () => {
    const { data: routes } = await getTransportRoutes();
    await reportStranded(routes[0].id, 'parent-1');

    const { data } = await getStrandedReports();
    expect(data.length).toBeGreaterThan(0);
    data.forEach(r => expect(r.resolved_at).toBeNull());
  });
});
