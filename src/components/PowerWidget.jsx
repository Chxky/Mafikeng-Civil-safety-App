import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStatus, fetchSchedule, isInLoadSheddingBlock, getNextBlock } from '../api/esp';
import { cacheSchedule, getCachedSchedule, cachePowerStatus, getCachedPowerStatus } from '../db/offline';

export default function PowerWidget() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Try cache first
    const [cachedStatus, cachedSchedule] = await Promise.all([
      getCachedPowerStatus(),
      getCachedSchedule(),
    ]);
    if (cachedStatus) setStatus(cachedStatus);
    if (cachedSchedule) setSchedule(cachedSchedule);
    setLoading(false);

    // Fetch fresh
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
      <div className="px-4 mt-4">
        <div className="card animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const stage = status?.stage ?? 0;
  const isShedding = stage > 0;
  const currentBlock = schedule ? isInLoadSheddingBlock(schedule) : { active: false };
  const nextBlock = schedule ? getNextBlock(schedule) : null;

  return (
    <div className="px-4 mt-4">
      <div
        onClick={() => navigate('/power')}
        className={`card cursor-pointer border-l-4 ${
          currentBlock.active
            ? 'border-l-danger-500 bg-danger-50'
            : isShedding
              ? 'border-l-warning-500 bg-warning-50'
              : 'border-l-safety-500 bg-safety-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Mahikeng Power</span>
                <span className={`badge text-xs ${
                  currentBlock.active ? 'bg-danger-100 text-danger-700' :
                  isShedding ? 'bg-warning-100 text-warning-700' :
                  'bg-safety-100 text-safety-700'
                }`}>
                  Stage {stage}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentBlock.active
                  ? `Shedding now until ${currentBlock.endsAt}`
                  : nextBlock
                    ? `Next: ${nextBlock.start}–${nextBlock.end} (${nextBlock.when})`
                    : 'No load shedding scheduled'
                }
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {currentBlock.active && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></div>
            <span className="text-xs text-danger-600 font-medium">Live outage in your area — tap for details</span>
          </div>
        )}
      </div>
    </div>
  );
}
