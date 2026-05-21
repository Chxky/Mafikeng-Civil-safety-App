// Push notification utilities

import { supabase, isLive } from '../db/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Request notification permission and subscribe to push
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { granted: false, error: 'Notifications not supported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { granted: false, error: 'Permission denied' };
  }

  return { granted: true };
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(userId) {
  if (!VAPID_PUBLIC_KEY || !isLive) {
    return { data: null, error: 'Push not configured (missing VAPID key or Supabase)' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { endpoint, keys } = subscription.toJSON();

    // Store subscription in Supabase
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_token_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'endpoint' })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Check if already subscribed
 */
export async function isSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      if (isLive && userId) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }
    }

    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
