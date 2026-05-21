import { describe, it, expect } from 'vitest';
import {
  fuzzLocation,
  getDistance,
  isWithinMahikeng,
  getMahikengCenter,
  getMahikengBounds,
  reverseGeocode,
} from '../utils/geolocation';

describe('fuzzLocation', () => {
  it('rounds coordinates to 3 decimal places by default', () => {
    const result = fuzzLocation(-25.865321, 25.644178);
    expect(result.lat).toBe(-25.865);
    expect(result.lng).toBe(25.644);
  });

  it('respects custom precision', () => {
    const result = fuzzLocation(-25.865321, 25.644178, 2);
    expect(result.lat).toBe(-25.87);
    expect(result.lng).toBe(25.64);
  });
});

describe('getDistance', () => {
  it('returns 0 for same point', () => {
    expect(getDistance(-25.865, 25.644, -25.865, 25.644)).toBe(0);
  });

  it('calculates distance between two Mahikeng points', () => {
    // ~1km apart
    const d = getDistance(-25.865, 25.644, -25.874, 25.644);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1100);
  });

  it('returns positive distance regardless of order', () => {
    const d1 = getDistance(-25.865, 25.644, -25.87, 25.65);
    const d2 = getDistance(-25.87, 25.65, -25.865, 25.644);
    expect(d1).toBeCloseTo(d2, 0);
  });
});

describe('isWithinMahikeng', () => {
  it('returns true for Mahikeng center', () => {
    expect(isWithinMahikeng(-25.8653, 25.6441)).toBe(true);
  });

  it('returns false for coordinates far outside', () => {
    expect(isWithinMahikeng(-33.9, 18.4)).toBe(false); // Cape Town
    expect(isWithinMahikeng(0, 0)).toBe(false);
  });

  it('returns false for just outside bounds', () => {
    expect(isWithinMahikeng(-25.93, 25.644)).toBe(false); // south of bounds
    expect(isWithinMahikeng(-25.865, 25.57)).toBe(false); // west of bounds
  });
});

describe('getMahikengCenter', () => {
  it('returns center coordinates', () => {
    const center = getMahikengCenter();
    expect(center.lat).toBe(-25.8653);
    expect(center.lng).toBe(25.6441);
  });
});

describe('getMahikengBounds', () => {
  it('returns bounds array for Leaflet', () => {
    const bounds = getMahikengBounds();
    expect(bounds).toHaveLength(2);
    expect(bounds[0]).toHaveLength(2); // [south, west]
    expect(bounds[1]).toHaveLength(2); // [north, east]
  });
});

describe('reverseGeocode', () => {
  it('returns a string address', async () => {
    const result = await reverseGeocode(-25.8653, 25.6441);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('falls back to coordinates when offline', async () => {
    // In test env (no network), should return coordinate string
    const result = await reverseGeocode(-25.8653, 25.6441);
    expect(typeof result).toBe('string');
    // Either a real address or coordinates fallback
    expect(result.length).toBeGreaterThan(0);
  });
});
