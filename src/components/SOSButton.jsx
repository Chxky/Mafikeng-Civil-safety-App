import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPosition } from '../utils/geolocation';
import { vibrate } from '../utils/helpers';
import { createSOSAlert } from '../db/mockApi';
import { useAuth } from '../hooks/useAuth';

export default function SOSButton({ size = 'large', className = '' }) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const holdTimer = useRef(null);
  const countdownTimer = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Discreet trigger: 3 rapid taps
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  const handleTap = useCallback(() => {
    tapCount.current++;

    if (tapTimer.current) clearTimeout(tapTimer.current);

    if (tapCount.current >= 3) {
      // Triple tap detected — trigger SOS
      tapCount.current = 0;
      triggerSOS();
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 1000);
    }
  }, []);

  const triggerSOS = useCallback(async () => {
    if (isActive) return;

    setIsActive(true);
    vibrate([300, 100, 300, 100, 300]);

    try {
      const position = await getCurrentPosition().catch(() => ({
        lat: -25.8653,
        lng: 25.6441,
      }));

      // Create SOS alert
      await createSOSAlert({
        user_token_id: user?.id,
        latitude: position.lat,
        longitude: position.lng,
        alert_type: 'panic',
      });

      // Trigger audible alarm
      playAlarm();

      // Notify emergency contacts (simulated)
      notifyEmergencyContacts(position);

      // Start recording (simulated)
      startRecording();

    } catch (err) {
      console.error('SOS trigger failed:', err);
    }
  }, [isActive, user]);

  const handleHoldStart = useCallback(() => {
    setIsPressed(true);
    setCountdown(3);

    holdTimer.current = setTimeout(() => {
      triggerSOS();
    }, 3000);

    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [triggerSOS]);

  const handleHoldEnd = useCallback(() => {
    setIsPressed(false);
    setCountdown(null);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, []);

  function playAlarm() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.8;

      oscillator.start();

      // Alternate frequency for siren effect
      let freq = 880;
      let direction = 1;
      const interval = setInterval(() => {
        freq += direction * 50;
        if (freq > 1200) direction = -1;
        if (freq < 600) direction = 1;
        oscillator.frequency.value = freq;
      }, 50);

      // Stop after 30 seconds
      setTimeout(() => {
        clearInterval(interval);
        oscillator.stop();
        audioCtx.close();
      }, 30000);
    } catch (err) {
      console.log('Audio alarm not available');
    }
  }

  function notifyEmergencyContacts(position) {
    // Simulate SMS sending
    console.log('[SOS] Emergency contacts notified with location:', position);
    console.log('[SOS] SMS sent to emergency contacts');
    console.log('[SOS] Alert forwarded to response network');

    // Simulate push notification to response network
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SOS Alert Sent', {
        body: `Your emergency contacts and local security have been notified. Location: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`,
        icon: '/icons/icon-192.svg',
        tag: 'sos-alert',
      });
    }
  }

  function startRecording() {
    // Simulate audio recording
    console.log('[SOS] Audio recording started');
    console.log('[SOS] Streaming to secure server');
  }

  if (isActive) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="sos-button sos-button-pressed w-24 h-24">
          <span className="text-2xl font-bold">SOS</span>
        </div>
        <div className="mt-3 text-center">
          <p className="text-danger-600 font-bold text-lg">Alert Active</p>
          <p className="text-sm text-gray-500 mt-1">Emergency contacts notified</p>
          <p className="text-xs text-gray-400 mt-1">Recording in progress...</p>
        </div>
        <button
          onClick={() => setIsActive(false)}
          className="mt-4 btn-outline text-sm px-4 py-2"
        >
          Cancel Alert
        </button>
      </div>
    );
  }

  if (size === 'small') {
    return (
      <button
        onClick={handleTap}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        className={`sos-button w-14 h-14 ${isPressed ? 'sos-button-pressed' : ''} ${className}`}
        aria-label="Emergency SOS - Triple tap or hold for 3 seconds"
      >
        <span className="text-sm font-bold">SOS</span>
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/50 rounded-full w-6 h-6 flex items-center justify-center">
              {countdown}
            </span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handleTap}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        className={`sos-button ${isPressed ? 'sos-button-pressed' : ''}`}
        aria-label="Emergency SOS - Triple tap or hold for 3 seconds"
      >
        <div className="flex flex-col items-center">
          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-xs font-bold">SOS</span>
        </div>
      </button>

      {countdown !== null && (
        <div className="mt-2 text-center animate-pulse">
          <p className="text-danger-600 font-bold text-2xl">{countdown}</p>
          <p className="text-xs text-gray-500">Hold to activate...</p>
        </div>
      )}

      {countdown === null && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">Hold 3s or triple-tap</p>
        </div>
      )}
    </div>
  );
}
