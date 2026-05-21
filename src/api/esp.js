// EskomSePush API Service
// Mock when VITE_ESP_API_KEY is not set
// Real API: https://developer.eskom.sepush.co.za (free tier: 50 req/day)

const API_KEY = import.meta.env.VITE_ESP_API_KEY;
const BASE_URL = 'https://developer.sepush.co.za/business/2.0';

// Mahikeng area ID for ESP (use search to find: /area_search?text=mahikeng)
const MAHIKENG_AREA_ID = 'mahikeng';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Get current load shedding status for South Africa
 */
export async function fetchStatus() {
  if (API_KEY) {
    try {
      const resp = await fetch(`${BASE_URL}/status`, {
        headers: { 'token': API_KEY },
      });
      if (!resp.ok) throw new Error('ESP API error');
      const data = await resp.json();
      return { data: data.status, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  // Mock: return realistic Mahikeng load shedding data
  await delay(300);
  const stages = [0, 0, 0, 0, 0, 1, 2, 2, 3, 4]; // weighted toward lower stages
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const nextStage = Math.max(0, stage + (Math.random() > 0.5 ? 1 : -1));

  return {
    data: {
      stage,
      next_stage: nextStage,
      next_stage_start_time: new Date(Date.now() + 4 * 3600000).toISOString(),
      eskom_centurn: 'North West',
      municipality: 'Mahikeng Local Municipality',
    },
    error: null,
  };
}

/**
 * Get load shedding schedule for Mahikeng
 */
export async function fetchSchedule() {
  if (API_KEY) {
    try {
      const resp = await fetch(`${BASE_URL}/area/${MAHIKENG_AREA_ID}`, {
        headers: { 'token': API_KEY },
      });
      if (!resp.ok) throw new Error('ESP API error');
      const data = await resp.json();
      return { data: data.schedule, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  // Mock: generate a realistic 24-hour schedule
  await delay(300);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  // Typical load shedding blocks (stage-dependent)
  const blocks = {
    0: [],
    1: [
      { start: '06:00', end: '08:30', stage: 1, date: today },
      { start: '14:00', end: '16:30', stage: 1, date: today },
    ],
    2: [
      { start: '06:00', end: '08:30', stage: 2, date: today },
      { start: '14:00', end: '16:30', stage: 2, date: today },
      { start: '22:00', end: '00:30', stage: 2, date: today },
    ],
    3: [
      { start: '00:00', end: '02:30', stage: 3, date: today },
      { start: '06:00', end: '08:30', stage: 3, date: today },
      { start: '12:00', end: '14:30', stage: 3, date: today },
      { start: '18:00', end: '20:30', stage: 3, date: today },
    ],
    4: [
      { start: '00:00', end: '02:30', stage: 4, date: today },
      { start: '04:00', end: '06:30', stage: 4, date: today },
      { start: '08:00', end: '10:30', stage: 4, date: today },
      { start: '12:00', end: '14:30', stage: 4, date: today },
      { start: '16:00', end: '18:30', stage: 4, date: today },
      { start: '20:00', end: '22:30', stage: 4, date: today },
    ],
  };

  const { data: status } = await fetchStatus();
  const stage = status?.stage || 0;
  const todayBlocks = (blocks[stage] || []).map(b => ({ ...b, date: today }));

  // Add some tomorrow blocks at a potentially different stage
  const tomorrowStage = Math.max(0, stage + (Math.random() > 0.5 ? 1 : -1));
  const tomorrowBlocks = (blocks[tomorrowStage] || []).map(b => ({ ...b, stage: tomorrowStage, date: tomorrow }));

  return {
    data: {
      area: 'Mahikeng',
      stage,
      today: todayBlocks,
      tomorrow: tomorrowBlocks,
      note: stage > 0 ? `Stage ${stage} load shedding active` : 'No load shedding scheduled',
    },
    error: null,
  };
}

/**
 * Check if a given time falls within a load shedding block
 */
export function isInLoadSheddingBlock(schedule, dateTime = new Date()) {
  if (!schedule?.today) return { active: false };

  const timeStr = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
  const dateStr = dateTime.toISOString().split('T')[0];

  for (const block of schedule.today) {
    if (block.date === dateStr && timeStr >= block.start && timeStr < block.end) {
      return { active: true, block, endsAt: block.end };
    }
  }

  return { active: false };
}

/**
 * Get the next upcoming load shedding block
 */
export function getNextBlock(schedule) {
  if (!schedule?.today && !schedule?.tomorrow) return null;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  // Check today's remaining blocks
  for (const block of (schedule.today || [])) {
    if (block.date === todayStr && block.start > timeStr) {
      return { ...block, when: 'today' };
    }
  }

  // Check tomorrow
  const tomorrowBlocks = schedule.tomorrow || [];
  if (tomorrowBlocks.length > 0) {
    return { ...tomorrowBlocks[0], when: 'tomorrow' };
  }

  return null;
}
