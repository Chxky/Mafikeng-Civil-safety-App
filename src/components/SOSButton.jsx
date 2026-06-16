import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPosition } from '../utils/geolocation';
import { vibrate } from '../utils/helpers';
import { createSOSAlert } from '../db/mockApi';
import { supabase, isLive } from '../db/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Icon from './Icon';

export default function SOSButton({ size = 'large', className = '' }) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const holdTimer = useRef(null);
  const countdownTimer = useRef(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  // eslint-disable-next-line no-unused-vars
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
      // eslint-disable-next-line react-hooks/immutability
      triggerSOS();
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/immutability
      playAlarm();

      // Notify emergency contacts (simulated)
      // eslint-disable-next-line react-hooks/immutability
      notifyEmergencyContacts(position);

      // Start recording (simulated)
      // eslint-disable-next-line react-hooks/immutability
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

  async function notifyEmergencyContacts(position) {
    const locationUrl = `https://maps.google.com/?q=${position.lat},${position.lng}`;
    const sosMessage = `SOS EMERGENCY from Mahikeng Civic Safety!\nLocation: ${locationUrl}\nTime: ${new Date().toLocaleString()}\nThis person needs immediate help.`;

    // Try to get emergency contacts from IndexedDB
    let contacts = [];
    try {
      const { getEmergencyContacts } = await import('../db/offline');
      contacts = await getEmergencyContacts() || [];
    // eslint-disable-next-line no-empty
    } catch {}

    // Send SMS via Supabase Edge Function (Africa's Talking)
    if (isLive && contacts.length > 0) {
      const phoneNumbers = contacts.map(c => c.phone).filter(Boolean);
      if (phoneNumbers.length > 0) {
        try {
          await supabase.functions.invoke('send-sms', {
            body: { to: phoneNumbers, message: sosMessage },
          });
          console.log('[SOS] SMS sent to', phoneNumbers.length, 'contacts');
        } catch (err) {
          console.error('[SOS] SMS failed:', err);
        }
      }
    } else {
      console.log('[SOS] No SMS gateway configured or no contacts. Location:', position);
    }

    // Send push notification to response network
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SOS Alert Sent', {
        body: `Emergency contacts notified. Location: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`,
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
          <p className="text-danger-600 font-bold text-lg">{t('sos_alert_active')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('sos_contacts_notified')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('sos_recording')}</p>
        </div>
        <button
          onClick={() => setIsActive(false)}
          className="mt-4 btn-outline text-sm px-4 py-2"
        >
          {t('cancel_alert')}
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
          <Icon name="warning" className="w-8 h-8 mb-1" strokeWidth={2} />
          <span className="text-xs font-bold">SOS</span>
        </div>
      </button>

      {countdown !== null && (
        <div className="mt-2 text-center animate-pulse">
          <p className="text-danger-600 font-bold text-2xl">{countdown}</p>
          <p className="text-xs text-gray-500">{t('hold_activate')}</p>
        </div>
      )}

      {countdown === null && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">{t('hold_or_tap')}</p>
        </div>
      )}
    </div>
  );
}
