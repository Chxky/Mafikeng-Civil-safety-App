import { describe, it, expect, vi } from 'vitest';
import {
  timeAgo,
  formatDate,
  formatDateTime,
  debounce,
  CATEGORIES,
  INCIDENT_TYPES,
  STATUSES,
  URGENCY_LEVELS,
} from '../utils/helpers';

describe('timeAgo', () => {
  it('returns relative time for recent dates', () => {
    const recent = new Date(Date.now() - 60000).toISOString(); // 1 min ago
    const result = timeAgo(recent);
    expect(result).toContain('minute');
  });

  it('returns "recently" for invalid dates', () => {
    expect(timeAgo('not-a-date')).toBe('recently');
  });
});

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    const result = formatDate('2026-01-15T10:30:00Z');
    expect(result).toMatch(/15 Jan 2026/);
  });

  it('returns original string for invalid input', () => {
    expect(formatDate('bad')).toBe('bad');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const result = formatDateTime('2026-03-20T14:30:00Z');
    expect(result).toMatch(/20 Mar 2026/);
    expect(result).toMatch(/\d{2}:\d{2}/); // time present, timezone-agnostic
  });
});

describe('debounce', () => {
  it('delays function execution', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('display constants', () => {
  it('has all category types', () => {
    expect(CATEGORIES).toHaveProperty('pothole');
    expect(CATEGORIES).toHaveProperty('water_leak');
    expect(CATEGORIES).toHaveProperty('sewage');
    expect(CATEGORIES).toHaveProperty('streetlight');
    expect(CATEGORIES).toHaveProperty('electricity');
    expect(CATEGORIES).toHaveProperty('illegal_dumping');
    expect(CATEGORIES).toHaveProperty('housing');
    expect(CATEGORIES).toHaveProperty('other');
  });

  it('each category has required fields', () => {
    Object.values(CATEGORIES).forEach(cat => {
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('icon');
      expect(cat).toHaveProperty('color');
      expect(cat).toHaveProperty('bg');
    });
  });

  it('has all incident types', () => {
    expect(INCIDENT_TYPES).toHaveProperty('theft');
    expect(INCIDENT_TYPES).toHaveProperty('vandalism');
    expect(INCIDENT_TYPES).toHaveProperty('drug_activity');
  });

  it('has all statuses', () => {
    expect(STATUSES).toHaveProperty('pending');
    expect(STATUSES).toHaveProperty('acknowledged');
    expect(STATUSES).toHaveProperty('in_progress');
    expect(STATUSES).toHaveProperty('resolved');
  });

  it('has all urgency levels', () => {
    expect(URGENCY_LEVELS).toHaveProperty('low');
    expect(URGENCY_LEVELS).toHaveProperty('normal');
    expect(URGENCY_LEVELS).toHaveProperty('high');
    expect(URGENCY_LEVELS).toHaveProperty('critical');
  });
});
