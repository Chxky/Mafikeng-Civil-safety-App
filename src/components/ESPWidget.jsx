import { useState, useEffect } from 'react';
import { fetchStatus, fetchSchedule, isInLoadSheddingBlock, getNextBlock } from '../api/esp';
import { cacheSchedule, getCachedSchedule, cachePowerStatus, getCachedPowerStatus } from '../db/offline';

export default function ESPWidget({ compact = false }) {
  const [status, setStatus] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Try cache first for instant display
    const [cachedStatus, cachedSchedule] = await Promise.all([
      getCachedPowerStatus(),
      getCachedSchedule(),
    ]);
    if (cachedStatus) setStatus(cachedStatus);
    if (cachedSchedule) setSchedule(cachedSchedule);
    setLoading(false);

    // Fetch fresh data
    const [statusRes, scheduleRes] = await Promise.all([
      fetchStatus(),
      fetchSchedule(),
    ]);

    if (statusRes.data) {
      setStatus(statusRes.data);
      await cachePowerStatus(statusRes.data);
    }
    if (scheduleRes.data) {
      setSchedule(scheduleRes.data);
      await cacheSchedule(scheduleRes.data);
    }
  }

  if (loading && !status) {
    return (
      <div className="card animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const stage = status?.stage ?? 0;
  const isShedding = stage > 0;
  const currentBlock = schedule ? isInLoadSheddingBlock(schedule) : { active: false };
  const nextBlock = schedule ? getNextBlock(schedule) : null;

  if (compact) {
    return (
      <div
        className={`card cursor-pointer ${
          isShedding ? 'border-danger-200 bg-danger-50' : 'border-safety-200 bg-safety-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-xs font-medium text-gray-500">Load Shedding</p>
              <p className={`text-sm font-bold ${isShedding ? 'text-danger-700' : 'text-safety-700'}`}>
                Stage {stage}
              </p>
            </div>
          </div>
          <div className={`badge ${isShedding ? 'bg-danger-100 text-danger-700' : 'bg-safety-100 text-safety-700'}`}>
            {currentBlock.active ? 'Shedding Now' : isShedding ? 'Active Today' : 'No Shedding'}
          </div>
        </div>
        {nextBlock && (
          <p className="text-xs text-gray-400 mt-2">
            Next: {nextBlock.start}–{nextBlock.end} ({nextBlock.when})
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Banner */}
      <div className={`rounded-2xl p-4 ${
        currentBlock.active
          ? 'bg-gradient-to-br from-danger-600 to-danger-800 text-white'
          : isShedding
            ? 'bg-gradient-to-br from-warning-500 to-warning-700 text-white'
            : 'bg-gradient-to-br from-safety-500 to-safety-700 text-white'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Current Status</span>
          <span className="text-3xl font-bold">Stage {stage}</span>
        </div>
        <p className="text-sm opacity-90">
          {currentBlock.active
            ? `Shedding in progress until ${currentBlock.endsAt}`
            : isShedding
              ? 'Load shedding scheduled today'
              : 'No load shedding — all clear'
          }
        </p>
        {status?.next_stage !== undefined && status.next_stage !== stage && (
          <p className="text-xs opacity-75 mt-1">
            Next stage: {status.next_stage} at {new Date(status.next_stage_start_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Today's Schedule */}
      {schedule && (
        <div className="card">          <h3 className="text-sm font-bold text-gray-800 mb-3">Today&apos;s Schedule</h3>
          {schedule.today && schedule.today.length > 0 ? (
            <div className="space-y-2">
              {schedule.today.map((block, i) => {
                const now = new Date();
                const [startH, startM] = block.start.split(':').map(Number);
                const [endH, endM] = block.end.split(':').map(Number);
                const blockStart = new Date(now); blockStart.setHours(startH, startM, 0);
                const blockEnd = new Date(now); blockEnd.setHours(endH, endM, 0);
                const isActive = now >= blockStart && now < blockEnd;
                const isPast = now >= blockEnd;

                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${
                    isActive ? 'bg-danger-50 border border-danger-200' :
                    isPast ? 'bg-gray-50 opacity-60' : 'bg-gray-50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-danger-500 animate-pulse' :
                      isPast ? 'bg-gray-300' : 'bg-warning-400'
                    }`} />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{block.start} – {block.end}</span>
                      {isActive && <span className="ml-2 text-xs text-danger-600 font-medium">NOW</span>}
                    </div>
                    <span className="text-xs text-gray-400">Stage {block.stage}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-2xl">✅</span>
              <p className="text-sm text-gray-500 mt-1">No load shedding today</p>
            </div>
          )}
        </div>
      )}

      {/* Tomorrow's Schedule */}
      {schedule?.tomorrow && schedule.tomorrow.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Tomorrow</h3>
          <div className="space-y-2">
            {schedule.tomorrow.map((block, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-warning-400" />
                <span className="text-sm">{block.start} – {block.end}</span>
                <span className="text-xs text-gray-400 ml-auto">Stage {block.stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
